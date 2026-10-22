import { access, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const mode = process.argv[2] ?? 'check';
if (!['check', 'publish'].includes(mode)) throw new Error('Usage: node scripts/cloud-news-feed-only.mjs check|publish');
const root = process.cwd();
const now = new Date();
const date = beijingDate(now);
const indexPath = join(root, 'public/news/index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
if (!Array.isArray(index) || !index[0]?.date || !index[0]?.file) throw new Error('Invalid news index.');

const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const windowEnd = mode === 'check' ? now.toISOString() : `${date}T07:50:00+08:00`;
const windowStart = mode === 'check' ? new Date(now.getTime() - 86_400_000).toISOString() : index[0].windowEnd;
if (mode === 'publish') {
  if (index[0].date === date) { console.log(`${date} already published; no overwrite.`); process.exit(0); }
  if (index[0].date !== previousDate || !windowStart) throw new Error(`Date gap or missing prior cutoff: ${index[0].date}.`);
  if (now.getTime() < Date.parse(windowEnd)) throw new Error('The 07:50 Beijing cutoff has not arrived.');
  if (Date.parse(windowStart) >= Date.parse(windowEnd)) throw new Error('Invalid news window.');
}

const previous = JSON.parse(await readFile(join(root, 'public/news', index[0].file), 'utf8'));
const previousLinks = new Set([...previous.content.matchAll(/\[阅读原文\]\((https?:\/\/[^)]+)\)/g)].map(m => cleanUrl(m[1])));
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
  ['天空新闻', 'https://feeds.skynews.com/feeds/rss/world.xml', /(^|\.)sky\.com$/],
  ['天空新闻', 'https://feeds.skynews.com/feeds/rss/business.xml', /(^|\.)sky\.com$/],
  ['新华社', 'https://www.xinhuanet.com/english/rss/worldrss.xml', /(^|\.)(xinhuanet\.com|news\.cn)$/],
  ['新华社', 'https://www.xinhuanet.com/english/rss/businessrss.xml', /(^|\.)(xinhuanet\.com|news\.cn)$/],
  ['新华社', 'https://www.xinhuanet.com/english/rss/scirss.xml', /(^|\.)(xinhuanet\.com|news\.cn)$/],
  ['安纳多卢通讯社', 'https://www.aa.com.tr/en/rss/default?cat=live', /(^|\.)aa\.com\.tr$/],
  ['洛杉矶时报', 'https://www.latimes.com/world-nation/rss2.0.xml', /(^|\.)latimes\.com$/],
  ['洛杉矶时报', 'https://www.latimes.com/business/rss2.0.xml', /(^|\.)latimes\.com$/],
  ['华尔街日报', 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', /(^|\.)wsj\.com$/],
  ['CNN', 'https://rss.cnn.com/rss/edition_world.rss', /(^|\.)cnn\.com$/],
  ['NBC News', 'https://feeds.nbcnews.com/nbcnews/public/news', /(^|\.)nbcnews\.com$/],
];

const results = await Promise.all(feeds.map(async ([media, feedUrl, domain]) => {
  try {
    const response = await fetch(feedUrl, { headers: { 'User-Agent': 'RyanNewsBriefing/1.0 (+GitHub Actions)' }, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const stories = parseFeed(await response.text(), media, domain).filter(item => {
      const time = Date.parse(item.publishedTime);
      return time >= Date.parse(windowStart) && time <= Date.parse(windowEnd) && (mode === 'check' || !previousLinks.has(cleanUrl(item.url)));
    });
    console.log(`${media}: ${stories.length} in window (${new URL(feedUrl).hostname}).`);
    return stories;
  } catch (error) { console.log(`${media}: unavailable (${error.message}).`); return []; }
}));

const byUrl = new Map();
for (const item of results.flat()) if (!byUrl.has(cleanUrl(item.url))) byUrl.set(cleanUrl(item.url), item);
const ranked = [...byUrl.values()].filter(item => !excluded(item))
  .sort((a, b) => relevance(b) - relevance(a) || b.publishedTime.localeCompare(a.publishedTime));
const selected = [];
for (const item of ranked) if (!selected.some(other => sameStory(item, other))) selected.push(item);
console.log(`Candidates: ${byUrl.size} unique links; ${selected.length} after topic filter and title deduplication.`);
if (mode === 'check') process.exit(selected.length > 0 ? 0 : 1);
if (selected.length === 0) throw new Error('No dated feed reports; existing briefing unchanged.');

const items = selected;
const reportPath = join(root, 'public/news', `${date}.json`);
try { await access(reportPath); throw new Error(`${date} report exists; refusing overwrite.`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const publishedAt = `${date}T08:00:00+08:00`;
const title = `全球主流媒体新闻速览｜${date}`;
const report = { date, publishedAt, windowStart, windowEnd, title, articleCount: items.length, sourceConversationId: 'github-actions-official-rss', content: renderReport(items) };
const next = [{ date, publishedAt, windowStart, windowEnd, title, articleCount: items.length, file: `${date}.json` }, ...index];
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
await writeFile(indexPath, JSON.stringify(next, null, 2) + '\n');
console.log(`Prepared ${items.length} reports for ${date}; Pages deployment is still required.`);

function parseFeed(xml, media, domain) {
  const result = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = getTag(block, 'title');
    const url = getTag(block, 'link');
    const published = getTag(block, 'pubDate') || getTag(block, 'dc:date');
    if (!title || !url || !published || !Number.isFinite(Date.parse(published))) continue;
    let parsed;
    try { parsed = new URL(url); } catch { continue; }
    if (parsed.protocol !== 'https:' || !domain.test(parsed.hostname)) continue;
    result.push({ title, url: parsed.href, media, publishedTime: new Date(published).toISOString() });
  }
  return result;
}
function getTag(block, name) {
  const raw = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '';
  return decode(raw.replace(/^<!\[CDATA\[|\]\]>$/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}
function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n)))
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'").replace(/&nbsp;/gi, ' ');
}
function beijingDate(value) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function cleanUrl(value) { const url = new URL(value); url.hash = ''; url.search = ''; return url.href.replace(/\/$/, ''); }
function excluded(item) { return /\b(football|soccer|cricket|tennis|movie review|tv review|recipe|celebrity|fashion|sports? round-?up)\b/i.test(item.title); }
function relevance(item) {
  const text = item.title.toLowerCase();
  return (/\b(ai|artificial intelligence|chip|semiconductor|trade|tariff|econom|inflation|interest rate|market|finance|bank|war|election|government|diplomat|climate|energy|health|disaster|earthquake|business|supply chain|shipping|technology|tech)\b/.test(text) ? 10 : 0);
}
function sameStory(a, b) {
  if (cleanUrl(a.url) === cleanUrl(b.url)) return true;
  const x = bigrams(a.title), y = bigrams(b.title);
  const overlap = [...x].filter(token => y.has(token)).length;
  return overlap / Math.max(1, Math.min(x.size, y.size)) > 0.76;
}
function bigrams(value) { const chars = [...value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')]; return new Set(chars.slice(1).map((ch, i) => chars[i] + ch)); }
function renderReport(items) {
  const generated = localTime(now);
  const late = now.getTime() >= Date.parse(`${date}T08:00:00+08:00`);
  const header = late ? `**北京时间08:00期；实际生成于${generated}，属于延迟补发。**` : '**北京时间08:00期；计划08:00在看板显示。**';
  return [`# 全球主流媒体新闻速览｜${date}`, header, `**收录窗口：${windowStart}—${windowEnd}（按时间戳换算为北京时间）。**`,
    '聚焦AI、跨境贸易、经济和全球重大事件。以下为媒体官方RSS所列原文标题；未生成中文摘要或简析，也未独立核验报道内容。',
    ...items.map((item, i) => `### ${i + 1}. ${escape(item.title)}\n\n**来源与时间：** ${escape(item.media)}｜${localTime(new Date(item.publishedTime))} 北京时间\n\n**来源标记：** 官方RSS收录；依据该媒体发布信息，未独立核验。 [阅读原文](${item.url})`)].join('\n\n');
}
function localTime(value) { return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(value); }
function escape(value) { return value.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, ''); }

