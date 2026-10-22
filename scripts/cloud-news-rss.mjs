import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const stage = process.argv[2];
if (!['draft', 'finalize'].includes(stage)) throw new Error('Usage: node scripts/cloud-news-rss.mjs draft|finalize');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY secret is missing.');

const root = process.cwd();
const indexPath = join(root, 'public/news/index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
const now = new Date();
const date = beijingDate(now);
const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const windowStart = index[0]?.windowEnd ?? `${previousDate}T08:00:00+08:00`;
const windowEnd = `${date}T07:50:00+08:00`;
const draftPath = join(root, '.github/news-drafts', `${date}.json`);
const reportPath = join(root, 'public/news', `${date}.json`);

if (index[0]?.date === date) {
  console.log(`${date} already exists; no overwrite.`);
  process.exit(0);
}
if (index[0]?.date !== previousDate) throw new Error(`Date gap: latest ${index[0]?.date}, expected ${previousDate}.`);
if (Date.parse(windowStart) >= Date.parse(windowEnd)) throw new Error('Invalid news window.');

let draft;
try { draft = JSON.parse(await readFile(draftPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (draft && (draft.date !== date || draft.windowStart !== windowStart)) throw new Error('Draft date or window mismatch.');
if (stage === 'draft' && draft) { console.log('Draft already exists; no overwrite.'); process.exit(0); }

const previous = JSON.parse(await readFile(join(root, 'public/news', index[0].file), 'utf8'));
const previousLinks = new Set([...previous.content.matchAll(/\[阅读原文\]\((https?:\/\/[^)]+)\)/g)].map(x => cleanUrl(x[1])));
const endForCollection = stage === 'draft' ? Math.min(now.getTime(), Date.parse(windowEnd)) : Date.parse(windowEnd);
const feeds = [
  ['BBC', 'https://feeds.bbci.co.uk/news/world/rss.xml', /(^|\.)bbc\.(com|co\.uk)$/],
  ['BBC', 'https://feeds.bbci.co.uk/news/business/rss.xml', /(^|\.)bbc\.(com|co\.uk)$/],
  ['BBC', 'https://feeds.bbci.co.uk/news/technology/rss.xml', /(^|\.)bbc\.(com|co\.uk)$/],
  ['卫报', 'https://www.theguardian.com/world/rss', /(^|\.)theguardian\.com$/],
  ['卫报', 'https://www.theguardian.com/business/rss', /(^|\.)theguardian\.com$/],
  ['卫报', 'https://www.theguardian.com/technology/rss', /(^|\.)theguardian\.com$/],
  ['半岛电视台', 'https://www.aljazeera.com/xml/rss/all.xml', /(^|\.)aljazeera\.com$/],
  ['France 24', 'https://www.france24.com/en/rss', /(^|\.)france24\.com$/],
  ['NPR', 'https://feeds.npr.org/1001/rss.xml', /(^|\.)npr\.org$/],
  ['世界报', 'https://www.lemonde.fr/en/international/rss_full.xml', /(^|\.)lemonde\.fr$/],
  ['世界报', 'https://www.lemonde.fr/en/economy/rss_full.xml', /(^|\.)lemonde\.fr$/],
  ['世界报', 'https://www.lemonde.fr/en/asia-and-pacific/rss_full.xml', /(^|\.)lemonde\.fr$/],
  ['澳大利亚广播公司', 'https://www.abc.net.au/news/feed/51120/rss.xml', /(^|\.)abc\.net\.au$/],
];

const collected = (await Promise.all(feeds.map(async ([media, feedUrl, domain]) => {
  try {
    const response = await fetch(feedUrl, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const stories = parseFeed(xml, media, domain).filter(item => {
      const time = Date.parse(item.publishedTime);
      return time >= Date.parse(windowStart) && time <= endForCollection && !previousLinks.has(cleanUrl(item.url));
    });
    console.log(`${media}: ${stories.length} reports inside the window (${new URL(feedUrl).pathname}).`);
    return stories;
  } catch (error) { console.log(`${media} feed unavailable: ${error.message}`); return []; }
}))).flat();

const existing = draft?.items ?? [];
const unique = new Map(existing.map(item => [cleanUrl(item.url), item]));
for (const item of collected) if (!unique.has(cleanUrl(item.url))) unique.set(cleanUrl(item.url), item);
const raw = [...unique.values()];
console.log(`Official-feed candidates: ${raw.length} distinct links.`);
if (raw.length < 50) throw new Error(`Only ${raw.length} dated official-feed reports; existing edition is unchanged.`);

const annotated = existing.filter(item => item.summary && item.mechanism && item.affected && item.cannotConclude);
const known = new Set(annotated.map(item => cleanUrl(item.url)));
const toAnalyze = raw.filter(item => !known.has(cleanUrl(item.url)))
  .sort((a, b) => relevance(b) - relevance(a) || b.publishedTime.localeCompare(a.publishedTime))
  .slice(0, stage === 'draft' ? 85 : draft ? 35 : 100);
for (let offset = 0; offset < toAnalyze.length; offset += 8) {
  const batch = toAnalyze.slice(offset, offset + 8);
  const decisions = await analyzeBatch(batch);
  const byUrl = new Map();
  for (const item of decisions) {
    if (typeof item?.url !== 'string') continue;
    try { byUrl.set(cleanUrl(item.url), item); } catch { /* Reject malformed model URLs. */ }
  }
  for (const item of batch) {
    const decision = byUrl.get(cleanUrl(item.url));
    if (!decision || !validAnalysis(decision)) continue;
    annotated.push({ ...item, ...decision, url: item.url, media: item.media, publishedTime: item.publishedTime, publishedDate: item.publishedDate });
  }
  console.log(`Analysis batch ${offset / 8 + 1}: ${annotated.length} eligible reports.`);
}

const deduped = [];
for (const item of annotated.sort((a, b) => (b.importance ?? 1) - (a.importance ?? 1) || b.publishedTime.localeCompare(a.publishedTime))) {
  if (deduped.some(other => sameStory(other, item))) continue;
  deduped.push(item);
}
console.log(`After event deduplication: ${deduped.length} reports.`);
if (stage === 'draft') {
  if (deduped.length < 40) throw new Error(`Draft has only ${deduped.length} reports; not saved.`);
  await mkdir(join(root, '.github/news-drafts'), { recursive: true });
  await writeFile(draftPath, JSON.stringify({ date, windowStart, collectedThrough: now.toISOString(), items: deduped }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Prepared ${deduped.length} official-feed reports for ${date}.`);
  process.exit(0);
}

const selected = deduped.slice(0, 60);
if (selected.length < 50) throw new Error(`Only ${selected.length} different, analyzed reports; edition unchanged.`);
try { await access(reportPath); throw new Error(`${date} report exists; refusing overwrite.`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const content = renderReport(selected);
const publishedAt = `${date}T08:00:00+08:00`;
const report = { date, publishedAt, windowStart, windowEnd, title: `全球主流媒体中文早报｜${date}`, articleCount: selected.length, sourceConversationId: 'github-actions-rss', content };
const next = [{ date, publishedAt, windowStart, windowEnd, title: report.title, articleCount: selected.length, file: `${date}.json` }, ...index];
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
await writeFile(indexPath, JSON.stringify(next, null, 2) + '\n');
console.log(`Prepared ${selected.length} reports. The Pages workflow must deploy the commit.`);

function parseFeed(xml, media, domain) {
  const result = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = getTag(block, 'title');
    const url = getTag(block, 'link');
    const published = getTag(block, 'pubDate') || getTag(block, 'dc:date');
    const description = getTag(block, 'description') || getTag(block, 'content:encoded');
    if (!title || !url || !published || !Number.isFinite(Date.parse(published))) continue;
    let parsed;
    try { parsed = new URL(url); } catch { continue; }
    if (parsed.protocol !== 'https:' || !domain.test(parsed.hostname)) continue;
    const publishedTime = new Date(published).toISOString();
    result.push({ title, url: parsed.href, media, publishedTime, publishedDate: beijingDate(new Date(publishedTime)), sourceNote: description.slice(0, 1800) });
  }
  return result;
}
function getTag(block, name) {
  const expression = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i');
  const raw = block.match(expression)?.[1] ?? '';
  return decode(raw.replace(/^<!\[CDATA\[|\]\]>$/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}
function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number) => String.fromCodePoint(number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number)))
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&apos;|&#39;/gi, "'").replace(/&nbsp;/gi, ' ');
}
function beijingDate(value) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function cleanUrl(value) { const url = new URL(value); url.hash = ''; url.search = ''; return url.href.replace(/\/$/, ''); }
function relevance(item) {
  const text = `${item.title} ${item.sourceNote}`.toLowerCase();
  const topical = /\b(ai|artificial intelligence|chip|semiconductor|trade|tariff|econom|inflation|interest rate|market|finance|bank|war|election|government|diplomat|climate|energy|health|disaster|earthquake|business|supply chain|shipping|technology|tech)\b/i.test(text);
  const excluded = /\b(football|soccer|cricket|tennis|movie review|tv review|recipe|celebrity|fashion)\b/i.test(text);
  return (topical ? 10 : 0) - (excluded ? 12 : 0) + Math.min(item.sourceNote.length / 1000, 2);
}
function bigrams(value) { const chars = [...value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')]; return new Set(chars.slice(1).map((ch, i) => chars[i] + ch)); }
function sameStory(a, b) {
  if (cleanUrl(a.url) === cleanUrl(b.url)) return true;
  const x = bigrams(a.title), y = bigrams(b.title);
  const overlap = [...x].filter(token => y.has(token)).length;
  return overlap / Math.max(1, Math.min(x.size, y.size)) > 0.76;
}
async function analyzeBatch(batch) {
  const prompt = `请只根据下列媒体官方RSS所给标题、描述和时间，为每条新闻写中文摘要和真正的简析。不得增加RSS未给出的具体数字、机构说法、因果事实；机制可作明确标为可能的推论。每条都要说明影响如何经成本、供需、价格、资金、制度或执行路径传导，具体谁受影响，以及目前证据不能下什么结论。不要重复摘要，不要写“值得关注”。返回JSON对象，格式为 {"items":[{"url":"原URL","title":"中文标题","summary":"35字以上中文事实摘要","mechanism":"25字以上具体机制","affected":"具体受影响者","cannotConclude":"针对本条证据的边界","kind":"fact或statement或proposal或forecast或opinion","importance":1到5}]}。仅返回输入中的URL，无法可靠概括的条目可跳过。输入：${JSON.stringify(batch)}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_NEWS_MODEL || 'gpt-4.1', text: { format: { type: 'json_object' } }, input: prompt, max_output_tokens: 6500 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`OpenAI analysis HTTP ${response.status}; edition unchanged.`);
  const body = await response.json();
  const output = (body.output ?? []).filter(x => x.type === 'message').flatMap(x => x.content ?? []).filter(x => x.type === 'output_text').map(x => x.text).join('\n');
  let parsed;
  try { parsed = JSON.parse(output); } catch { throw new Error(`OpenAI analysis JSON invalid (${body.status}); edition unchanged.`); }
  return Array.isArray(parsed.items) ? parsed.items : [];
}
function validAnalysis(item) {
  if (!item || !['url', 'title', 'summary', 'mechanism', 'affected', 'cannotConclude'].every(key => typeof item[key] === 'string' && item[key].trim())) return false;
  if (item.summary.length < 25 || item.mechanism.length < 20 || item.affected.length < 5 || item.cannotConclude.length < 12) return false;
  if (/值得关注|有待观察|影响有待评估/.test(`${item.mechanism}${item.affected}${item.cannotConclude}`)) return false;
  item.importance = Math.max(1, Math.min(5, Number(item.importance) || 1));
  return true;
}
function renderReport(items) {
  const late = now.getTime() >= Date.parse(`${date}T08:00:00+08:00`);
  const generated = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const header = late ? `**北京时间08:00期；本期生成于${generated}，属于延迟补发。**` : '**北京时间08:00期；计划08:00在看板显示。**';
  return [`# 全球主流媒体中文早报｜${date}`, header, `**收录窗口：${windowStart}—${windowEnd}（北京时间）。**`, '关注AI、跨境贸易、经济及不限国别的重大事件；来自媒体官方RSS，原文链接和发布时间可追溯，未做第二媒体交叉核验。', ...items.map((item, i) => {
    const localTime = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(item.publishedTime));
    const kind = { fact: '媒体报道', statement: '当事方说法', proposal: '政策提议', forecast: '预测', opinion: '评论' }[item.kind] ?? '媒体报道';
    return `### ${i + 1}. ${escape(item.title)}\n\n**来源与时间：** ${escape(item.media)}｜${localTime} 北京时间｜${kind}\n\n${escape(item.summary)}\n\n**简析：** 机制：${escape(item.mechanism)}；受影响的是${escape(item.affected)}；目前不能${escape(item.cannotConclude)}。\n\n**核验：** 已核对媒体官方RSS原文链接和发布时间；依据该媒体报道，未独立交叉核验。 [阅读原文](${item.url})`;
  })].join('\n\n');
}
function escape(value) { return value.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, ''); }

