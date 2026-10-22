import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const stage = process.argv[2];
if (!['draft', 'finalize'].includes(stage)) throw new Error('Usage: node scripts/cloud-news-briefing.mjs draft|finalize');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY secret is missing; no briefing was published.');

const root = process.cwd();
const indexPath = join(root, 'public/news/index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
if (!Array.isArray(index) || !index[0]?.date) throw new Error('Invalid news index.');

const beijingNow = new Date();
const beijingParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).formatToParts(beijingNow);
const part = Object.fromEntries(beijingParts.map(({ type, value }) => [type, value]));
const date = `${part.year}-${part.month}-${part.day}`;
const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const windowStart = index[0].windowEnd ?? `${previousDate}T08:00:00+08:00`;
const windowEnd = `${date}T07:50:00+08:00`;
const draftPath = join(root, '.github/news-drafts', `${date}.json`);
const reportPath = join(root, 'public/news', `${date}.json`);

if (index[0].date === date) {
  console.log(`${date} already exists; keeping the published edition unchanged.`);
  process.exit(0);
}
if (index[0].date !== previousDate) throw new Error(`Date gap: latest edition ${index[0].date}, expected ${previousDate}.`);
if (Date.parse(windowStart) >= Date.parse(windowEnd)) throw new Error('Invalid continuous news window.');

const previousReport = JSON.parse(await readFile(join(root, 'public/news', index[0].file), 'utf8'));
const previousLinks = [...previousReport.content.matchAll(/\[阅读原文\]\((https?:\/\/[^)]+)\)/g)].map((match) => cleanUrl(match[1]));
const themes = [
  '人工智能、芯片、数据中心、科技监管和重大公司投资',
  '跨境贸易、关税、出口管制、供应链、港口和航运',
  '全球经济、央行、通胀、利率、就业、能源和金融市场',
  '战争、外交、安全、国际组织及影响多国的重大事件',
  '亚洲、欧洲、非洲、美洲和中东的重要公共事件',
  '公共卫生、重大灾害、气候、粮食及社会政策',
];
const preferredMedia = 'AP, Reuters, AFP, Xinhua, BBC, New York Times, Washington Post, Wall Street Journal, Bloomberg, Guardian, Financial Times, Al Jazeera, NPR, CNN, France 24, DPA, TASS, Kyodo, Anadolu, China Daily, Los Angeles Times, Independent, Sky News, RT, Forbes, Yonhap, Grupo Globo, ABC Australia, Economist, NBC News；另可选可信主流媒体及官方原始信息';
let draft = null;
try { draft = JSON.parse(await readFile(draftPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (draft && (draft.date !== date || draft.windowStart !== windowStart)) throw new Error('Existing draft does not match the current continuous window.');
if (stage === 'draft' && draft) {
  console.log(`${date} draft already exists; no overwrite.`);
  process.exit(0);
}

const candidates = draft?.items ?? [];
const previousDraftCount = candidates.length;
const discoveryStart = stage === 'finalize' && draft ? draft.collectedThrough : windowStart;
const discoveryEnd = stage === 'draft' ? beijingNow.toISOString() : windowEnd;
const target = stage === 'draft' ? 55 : 62;
const maxCalls = stage === 'draft' ? 12 : (draft ? 5 : 14);
const minNew = stage === 'finalize' && draft ? 5 : 0;
let added = 0;

for (let attempt = 0; attempt < maxCalls && (candidates.length < target || added < minNew); attempt++) {
  const theme = themes[attempt % themes.length];
  const known = candidates.slice(-65).map((item) => item.title).join('；');
  const fresh = await searchBatch({ theme, discoveryStart, discoveryEnd, known });
  const unique = [];
  for (const item of fresh) {
    const normalized = normalizeItem(item);
    if (!normalized || !withinWindow(normalized, windowStart, windowEnd, discoveryEnd)) continue;
    if (previousLinks.includes(cleanUrl(normalized.url)) || candidates.some((other) => sameStory(other, normalized)) || unique.some((other) => sameStory(other, normalized))) continue;
    unique.push(normalized);
  }
  const checked = await Promise.all(unique.map(async (item) => ({ item, source: await verifyLink(item.url) })));
  for (const { item: normalized, source } of checked) {
    if (!source) continue;
    normalized.url = source.url;
    normalized.publishedTime = source.publishedTime;
    if (source.publishedDate) normalized.publishedDate = source.publishedDate;
    if (!withinWindow(normalized, windowStart, windowEnd, discoveryEnd)) continue;
    if (candidates.some((other) => sameStory(other, normalized))) continue;
    candidates.push(normalized);
    added++;
  }
  console.log(`Batch ${attempt + 1}: ${candidates.length} unique, reachable reports.`);
}

const newItems = candidates.slice(previousDraftCount);
const rejected = await auditAnalysis(newItems);
for (let i = candidates.length - 1; i >= previousDraftCount; i--) {
  if (rejected.has(cleanUrl(candidates[i].url))) candidates.splice(i, 1);
}
console.log(`Quality review rejected ${rejected.size} weak analyses; ${candidates.length} stories remain.`);

if (stage === 'draft') {
  if (candidates.length < 40) throw new Error(`Only ${candidates.length} sourced stories found in draft; no draft committed.`);
  await mkdir(join(root, '.github/news-drafts'), { recursive: true });
  await writeFile(draftPath, `${JSON.stringify({ date, windowStart, collectedThrough: discoveryEnd, items: candidates }, null, 2)}\n`, { flag: 'wx' });
  console.log(`Prepared ${candidates.length} stories for ${date}; no public edition changed.`);
  process.exit(0);
}

const selected = candidates.sort((a, b) => b.importance - a.importance || b.publishedDate.localeCompare(a.publishedDate)).slice(0, 60);
if (selected.length < 50) throw new Error(`Only ${selected.length} distinct source reports; no edition published.`);
const content = renderReport(selected, { date, windowStart, windowEnd, generatedAt: beijingNow });
validateReport(selected, content);
try {
  await access(reportPath);
  throw new Error(`${date} report file already exists; refusing to overwrite.`);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const publishedAt = `${date}T08:00:00+08:00`;
const [year, month, day] = date.split('-');
const report = { date, publishedAt, windowStart, windowEnd, title: `全球主流媒体中文早报｜${year}年${Number(month)}月${Number(day)}日`, articleCount: selected.length, sourceConversationId: 'github-actions', content };
const next = [{ date, publishedAt, windowStart, windowEnd, title: report.title, articleCount: selected.length, file: `${date}.json` }, ...index];
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
await writeFile(indexPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Prepared ${selected.length} articles for ${date}. Deployment is a separate workflow.`);

async function searchBatch({ theme, discoveryStart, discoveryEnd, known }) {
  const prompt = `Find up to 12 DIFFERENT and important real news reports originally published between ${discoveryStart} and ${discoveryEnd}. Focus: ${theme}. Prefer these media: ${preferredMedia}. Search the live web and read each source page. Do not invent articles, original URLs, publication dates, quotes, facts, or causal claims. Exclude the previous-edition URLs and avoid these current titles: ${known.slice(-4500)}. Return ONLY a JSON object {"items":[...]} with each item having: title (concise Chinese), media (publisher name Chinese or English), url (the ORIGINAL publisher's direct article URL), publishedDate (YYYY-MM-DD in Beijing time), publishedTime (exact ISO 8601 with timezone only if verified on the publisher's page, otherwise empty string), summary (one factual Chinese paragraph, at least 35 Chinese characters), mechanism (specific causal transmission path through costs/prices/supply/demand/capital/rules/implementation, at least 25 Chinese characters), affected (specific people, firms, sectors or places, at least 12 Chinese characters), cannotConclude (a conclusion not supported by THIS article's evidence, at least 20 Chinese characters), kind (fact, statement, proposal, forecast, or opinion), importance (integer 1-5). Each analysis must add information beyond the summary. Cite only original publisher pages. If fewer than 12 qualify, return fewer. No generic filler. Dates without exact times are allowed and must have publishedTime empty.`;
  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENAI_NEWS_MODEL || 'gpt-4.1', tools: [{ type: 'web_search', search_context_size: 'high' }], tool_choice: 'required', max_tool_calls: 4, input: prompt, max_output_tokens: 9000 }),
  }, 180_000);
  if (!response.ok) throw new Error(`OpenAI search failed with HTTP ${response.status}: ${(await response.text()).slice(0, 350)}`);
  const body = await response.json();
  const output = body.output?.filter((entry) => entry.type === 'message').flatMap((entry) => entry.content ?? []).filter((entry) => entry.type === 'output_text').map((entry) => entry.text).join('\n') ?? '';
  const json = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error('OpenAI did not return parseable JSON; no edition changed.'); }
  return Array.isArray(parsed.items) ? parsed.items : [];
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  for (const key of ['title', 'media', 'url', 'publishedDate', 'summary', 'mechanism', 'affected', 'cannotConclude', 'kind']) {
    if (typeof item[key] !== 'string' || !item[key].trim()) return null;
    item[key] = item[key].trim();
  }
  item.mechanism = item.mechanism.replace(/^机制[:：]\s*/, '');
  item.affected = item.affected.replace(/^受影响的是\s*/, '');
  item.cannotConclude = item.cannotConclude.replace(/^(?:目前)?不能\s*/, '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedDate) || !Number.isFinite(Date.parse(`${item.publishedDate}T00:00:00Z`))) return null;
  try { if (new URL(item.url).protocol !== 'https:') return null; } catch { return null; }
  if (!qualityText(item.summary, 35) || !qualityText(item.mechanism, 25) || !qualityText(item.affected, 12) || !qualityText(item.cannotConclude, 20)) return null;
  if (item.mechanism === item.summary || item.cannotConclude === item.summary) return null;
  if (/值得关注|需持续关注|有待观察|影响有待评估/.test(`${item.mechanism}${item.affected}${item.cannotConclude}`)) return null;
  item.importance = Math.max(1, Math.min(5, Number(item.importance) || 1));
  item.publishedTime = typeof item.publishedTime === 'string' && Number.isFinite(Date.parse(item.publishedTime)) ? item.publishedTime : '';
  return item;
}

function qualityText(value, min) { return [...value.replace(/\s/g, '')].length >= min; }
function cleanUrl(value) { const url = new URL(value); url.hash = ''; url.search = ''; return url.href.replace(/\/$/, ''); }
function bigrams(value) { const string = value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, ''); return new Set([...string].slice(1).map((char, index) => [...string][index] + char)); }
function sameStory(a, b) {
  if (cleanUrl(a.url) === cleanUrl(b.url)) return true;
  const x = bigrams(a.title), y = bigrams(b.title);
  const overlap = [...x].filter((token) => y.has(token)).length;
  return overlap / Math.max(1, Math.min(x.size, y.size)) > 0.72;
}
function withinWindow(item, start, end, discoveryEnd) {
  if (item.publishedTime) {
    const when = Date.parse(item.publishedTime);
    return when >= Date.parse(start) && when <= Date.parse(end) && when <= Date.parse(discoveryEnd);
  }
  const firstParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(start));
  const firstValues = Object.fromEntries(firstParts.map(({ type, value }) => [type, value]));
  const first = `${firstValues.year}-${firstValues.month}-${firstValues.day}`;
  return item.publishedDate >= first && item.publishedDate <= end.slice(0, 10);
}
async function verifyLink(url) {
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RyanNewsBriefing/1.0)' }, redirect: 'follow' }, 15_000);
    if (!response.ok || !response.url.startsWith('https://')) return null;
    const html = (await response.text()).slice(0, 1_500_000);
    const published = html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[^"'<\s]*)/i)?.[1]
      ?? html.match(/article:published_time[^>]*content=["'](\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[^"'<\s]*)/i)?.[1]
      ?? html.match(/content=["'](\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[^"'<\s]*)["'][^>]*article:published_time/i)?.[1]
      ?? '';
    const publishedTime = Number.isFinite(Date.parse(published)) ? published : '';
    const dateParts = publishedTime ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(publishedTime)) : [];
    const values = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const publishedDate = publishedTime ? `${values.year}-${values.month}-${values.day}` : '';
    return { url: response.url, publishedTime, publishedDate };
  } catch { return null; }
}
async function fetchWithTimeout(url, options, milliseconds) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(milliseconds) });
}
function renderReport(items, { date, windowStart, windowEnd, generatedAt }) {
  const [year, month, day] = date.split('-');
  const title = `全球主流媒体中文早报｜${year}年${Number(month)}月${Number(day)}日`;
  const late = generatedAt.getTime() >= Date.parse(`${date}T08:00:00+08:00`);
  const generated = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(generatedAt);
  const header = late ? `**北京时间08:00期；本期生成于${generated}，属于延迟补发，实际部署时间以 GitHub Pages 记录为准。**` : '**北京时间08:00期；计划08:00在看板显示，实际部署时间以 GitHub Pages 记录为准。**';
  return [`# ${title}`, header, `**收录窗口：${windowStart}—${windowEnd}（北京时间）。**`, '重点为 AI、跨境贸易、经济及全球重大事件，不设国别配额。依据原媒体报道，未逐条做第二媒体交叉核验；仅有日期的报道标记“时间待核实”。', ...items.map((item, i) => {
    const time = item.publishedTime ? `${item.publishedTime}（原站时间）` : `${item.publishedDate}，时间待核实`;
    const kind = { fact: '媒体报道', statement: '声明或当事方说法', proposal: '政策提议', forecast: '预测', opinion: '评论' }[item.kind] ?? '媒体报道';
    return `### ${i + 1}. ${escapeText(item.title)}\n\n**来源与时间：** ${escapeText(item.media)}｜${time}｜${kind}\n\n${escapeText(item.summary)}\n\n**简析：** 机制：${escapeText(item.mechanism)}；受影响的是${escapeText(item.affected)}；目前不能${escapeText(item.cannotConclude)}。\n\n**核验：** 已核对可追溯原文链接，依据该媒体报道；未独立交叉核验${item.publishedTime ? '' : '；时间待核实'}。 [阅读原文](${item.url})`;
  })].join('\n\n');
}
function escapeText(value) { return value.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, ''); }
function validateReport(items, content) {
  if (items.length < 50 || (content.match(/^### \d+\. /gm) ?? []).length !== items.length) throw new Error('Article count check failed.');
  if (new Set(items.map((item) => cleanUrl(item.url))).size !== items.length) throw new Error('Duplicate source links.');
  for (const item of items) if (!item.summary || !item.mechanism || !item.affected || !item.cannotConclude || !item.media || !item.url) throw new Error('Missing article fields.');
}

async function auditAnalysis(items) {
  const rejected = new Set();
  for (let offset = 0; offset < items.length; offset += 10) {
    const batch = items.slice(offset, offset + 10);
    const input = `审查以下全球早报条目。只审查简析是否真正超出摘要：机制要说清成本、价格、供需、资金、制度或执行路径的传导；受影响者要具体；“目前不能”的边界要紧扣该报道证据。重复摘要、泛泛“值得关注”、空洞风险或把核验说明当分析，一律判不合格。返回严格 JSON：{"rejectedUrls":[不合格条目的 URL]}。不要为了凑数降低标准。\n${JSON.stringify(batch.map(({ title, url, summary, mechanism, affected, cannotConclude }) => ({ title, url, summary, mechanism, affected, cannotConclude })))}`;
    const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_NEWS_MODEL || 'gpt-4.1', input, max_output_tokens: 1800 }),
    }, 120_000);
    if (!response.ok) throw new Error(`OpenAI quality review failed with HTTP ${response.status}; no edition changed.`);
    const body = await response.json();
    const output = body.output?.filter((entry) => entry.type === 'message').flatMap((entry) => entry.content ?? []).filter((entry) => entry.type === 'output_text').map((entry) => entry.text).join('\n') ?? '';
    let parsed;
    try { parsed = JSON.parse(output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch { throw new Error('Quality review returned invalid JSON; no edition changed.'); }
    if (!Array.isArray(parsed.rejectedUrls)) throw new Error('Quality review did not return decisions; no edition changed.');
    for (const url of parsed.rejectedUrls) {
      if (typeof url === 'string') {
        try { rejected.add(cleanUrl(url)); } catch { /* Ignore malformed review references. */ }
      }
    }
  }
  return rejected;
}

