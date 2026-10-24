import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const patterns = {
  AI: /\b(ai|artificial intelligence|machine learning|llm|chatgpt|openai|gemini|semiconductor|chip|gpu|data center|datacenter|robotics?|automation|model training)\b|人工智能|大模型|芯片|半导体|智能体|机器人|数据中心|生成式|人工智慧|晶片|半導體/i,
  '经济金融': /\b(economy|economic|inflation|interest rates?|central bank|federal reserve|fed policy|gdp|stock market|bond yields?|banking|currency|earnings|revenue|fiscal|investment|financial|shares?)\b|经济|金融|通胀|利率|央行|股市|债券|汇率|财报|投资|經濟|金融|通膨|匯率/i,
  '跨境贸易': /\b(trade|tariffs?|exports?|imports?|customs|shipping|supply chain|logistics|cross.border|e.commerce|sanctions?)\b|跨境|贸易|关税|出口|进口|海关|航运|物流|供应链|制裁|貿易|關稅|供應鏈/i,
};

const root = process.cwd();
const now = new Date();
const date = beijingDate(now);
const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const windowStart = `${previousDate}T06:30:00+08:00`;
const windowEnd = `${date}T06:30:00+08:00`;
const publishedAt = `${date}T07:00:00+08:00`;
if (now.getTime() < Date.parse(windowEnd)) {
  console.log('Waiting for the 06:30 Beijing cutoff.');
  process.exit(0);
}
const outputDir = join(root, 'public/focus-news');
const indexPath = join(outputDir, 'index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
if (!Array.isArray(index)) throw new Error('Invalid focused news index.');
if (index.some((edition) => edition.date === date)) {
  console.log(`${date} already prepared; keeping the published report.`);
  process.exit(0);
}
const reportPath = join(outputDir, `${date}.json`);
try { await access(reportPath); throw new Error(`${date} report exists; refusing overwrite.`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

// Official publisher feeds only. A missing, blocked, or paywalled feed is skipped.
const feeds = [
  ['BBC', 'https://feeds.bbci.co.uk/news/business/rss.xml', /(^|\.)bbc\.(com|co\.uk)$/],
  ['BBC', 'https://feeds.bbci.co.uk/news/technology/rss.xml', /(^|\.)bbc\.(com|co\.uk)$/],
  ['卫报', 'https://www.theguardian.com/business/rss', /(^|\.)theguardian\.com$/],
  ['卫报', 'https://www.theguardian.com/technology/rss', /(^|\.)theguardian\.com$/],
  ['NPR', 'https://feeds.npr.org/1017/rss.xml', /(^|\.)npr\.org$/],
  ['世界报', 'https://www.lemonde.fr/en/economy/rss_full.xml', /(^|\.)lemonde\.fr$/],
  ['世界报', 'https://www.lemonde.fr/en/asia-and-pacific/rss_full.xml', /(^|\.)lemonde\.fr$/],
  ['半岛电视台', 'https://www.aljazeera.com/xml/rss/all.xml', /(^|\.)aljazeera\.com$/],
  ['France 24', 'https://www.france24.com/en/rss', /(^|\.)france24\.com$/],
  ['新华社', 'https://www.xinhuanet.com/english/rss/businessrss.xml', /(^|\.)(xinhuanet\.com|news\.cn)$/],
  ['新华社', 'https://www.xinhuanet.com/english/rss/scirss.xml', /(^|\.)(xinhuanet\.com|news\.cn)$/],
  ['华尔街日报', 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', /(^|\.)wsj\.com$/],
  ['华尔街日报', 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', /(^|\.)wsj\.com$/],
  ['澳大利亚广播公司', 'https://www.abc.net.au/news/feed/51120/rss.xml', /(^|\.)abc\.net\.au$/],
  ['彭博社', 'https://feeds.bloomberg.com/markets/news.rss', /(^|\.)bloomberg\.com$/],
  ['金融时报', 'https://www.ft.com/world?format=rss', /(^|\.)ft\.com$/],
  ['南华早报', 'https://www.scmp.com/rss/92/feed', /(^|\.)scmp\.com$/],
  ['南华早报', 'https://www.scmp.com/rss/3/feed', /(^|\.)scmp\.com$/],
  ['韩联社', 'https://en.yna.co.kr/RSS/economy.xml', /(^|\.)yna\.co\.kr$/],
  ['新加坡海峡时报', 'https://www.straitstimes.com/news/business/rss.xml', /(^|\.)straitstimes\.com$/],
  ['日本放送协会', 'https://www3.nhk.or.jp/rss/news/cat5.xml', /(^|\.)nhk\.or\.jp$/],
  ['中央通讯社', 'https://www.cna.com.tw/rss/aie.aspx', /(^|\.)cna\.com\.tw$/],
  ['德国之声', 'https://rss.dw.com/rdf/rss-en-bus', /(^|\.)dw\.com$/],
  ['加拿大广播公司', 'https://www.cbc.ca/cmlink/rss-business', /(^|\.)cbc\.ca$/],
  ['路透社', 'https://feeds.reuters.com/reuters/businessNews', /(^|\.)reuters\.com$/],
  ['美联社', 'https://apnews.com/feed', /(^|\.)apnews\.com$/],
];

const results = await Promise.all(feeds.map(async ([media, feedUrl, domain]) => {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'RyanFocusedNews/1.0 (+GitHub Actions)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const stories = parseFeed(await response.text(), media, domain).filter((item) => {
      const time = Date.parse(item.publishedTime);
      return time >= Date.parse(windowStart) && time < Date.parse(windowEnd);
    });
    console.log(`${media}: ${stories.length} dated items from ${new URL(feedUrl).hostname}`);
    return stories;
  } catch (error) {
    console.log(`${media}: unavailable (${error.message})`);
    return [];
  }
}));
const byUrl = new Map();
for (const item of results.flat()) {
  const key = cleanUrl(item.url);
  if (!byUrl.has(key)) byUrl.set(key, item);
}
const candidates = [...byUrl.values()]
  .filter((item) => !excluded(item) && item.description.length >= 40)
  .map((item) => ({ ...item, topic: topicFor(item) }))
  .filter((item) => item.topic)
  .sort((a, b) => b.topic.score - a.topic.score || b.publishedTime.localeCompare(a.publishedTime));
const unique = dedupeStories(candidates);
const counts = { AI: 0, '经济金融': 0, '跨境贸易': 0 };
const sourceCounts = new Map();
const selected = [];
for (const item of unique) {
  const topic = item.topic.name;
  if (counts[topic] >= 8 || (sourceCounts.get(item.media) ?? 0) >= 3) continue;
  selected.push(item);
  counts[topic]++;
  sourceCounts.set(item.media, (sourceCounts.get(item.media) ?? 0) + 1);
}
if (!selected.length) throw new Error('No source-backed AI, economy, or trade stories; previous report is preserved.');
selected.sort((a, b) => b.publishedTime.localeCompare(a.publishedTime));
const report = {
  date, publishedAt, windowStart, windowEnd, preparedAt: now.toISOString(),
  title: `AI · 经济金融 · 跨境贸易｜${date}`,
  articleCount: selected.length, topicCounts: counts,
  sourceConversationId: 'github-actions-focused-official-rss',
  content: renderReport(selected),
};
await mkdir(outputDir, { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
await writeFile(indexPath, JSON.stringify([
  { date, publishedAt, windowStart, windowEnd, title: report.title, articleCount: selected.length, file: `${date}.json` },
  ...index,
], null, 2) + '\n');
console.log(`Prepared ${selected.length} focused stories: ${JSON.stringify(counts)}`);

function parseFeed(xml, media, domain) {
  const result = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = getTag(block, 'title');
    const url = getTag(block, 'link');
    const published = getTag(block, 'pubDate') || getTag(block, 'dc:date');
    const description = compactDescription(getTag(block, 'description'));
    if (!title || !url || !published || !Number.isFinite(Date.parse(published))) continue;
    let parsed;
    try { parsed = new URL(url); } catch { continue; }
    if (parsed.protocol !== 'https:' || !domain.test(parsed.hostname)) continue;
    result.push({ title, url: parsed.href, media, description, publishedTime: new Date(published).toISOString() });
  }
  return result;
}
function getTag(block, name) {
  const raw = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '';
  // RSS descriptions often escape HTML. Decode before removing tags.
  const decoded = decode(decode(raw.replace(/^<!\[CDATA\[|\]\]>$/g, '')));
  return decoded.replace(/<\/(?:p|li|div)>/gi, '. ').replace(/<[^>]*>/g, ' ').replace(/\.\.(?=\s|$)/g, '.').replace(/\s+/g, ' ').trim();
}
function compactDescription(value) {
  const sentences = value.split(/(?<=[.!?])\s+/);
  let brief = '';
  for (const sentence of sentences) {
    const next = brief ? `${brief} ${sentence}` : sentence;
    if (next.length > 420) break;
    brief = next;
    if (brief.length >= 100) break;
  }
  return brief.length >= 45 ? brief : '';
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
// Compare events across publishers, while retaining different developments on a shared topic.
function dedupeStories(items) {
  const words = items.map(item => titleWords(item.title));
  const frequency = new Map();
  for (const tokens of words) for (const token of tokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  const parent = items.map((_, index) => index);
  const root = index => { while (parent[index] !== index) index = parent[index]; return index; };
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (sameStory(items[i], items[j], words[i], words[j], frequency, items.length)) {
        const left = root(i), right = root(j);
        parent[Math.max(left, right)] = Math.min(left, right);
      }
    }
  }
  return items.filter((_, index) => root(index) === index);
}
function sameStory(a, b, x, y, frequency, total) {
  if (cleanUrl(a.url) === cleanUrl(b.url)) return true;
  if (differentDevelopment(a.title, b.title)) return false;
  const shared = [...x].filter(token => y.has(token));
  const weight = token => Math.log(1 + total / (frequency.get(token) ?? 1));
  const common = shared.reduce((sum, token) => sum + weight(token), 0);
  const xWeight = [...x].reduce((sum, token) => sum + weight(token), 0);
  const yWeight = [...y].reduce((sum, token) => sum + weight(token), 0);
  if (shared.length >= 3 && common / Math.max(1, Math.min(xWeight, yWeight)) >= 0.4) return true;
  const bx = bigrams(a.title), by = bigrams(b.title);
  const overlap = [...bx].filter(token => by.has(token)).length;
  return overlap / Math.max(1, Math.min(bx.size, by.size)) > 0.76;
}
function titleWords(value) {
  const stop = new Set('a an the and or of in on for to from with by as at after before amid over under into about across how what why who when where says say said is are was were be been being has have had it its this that these those his her their he she they us uk u s new latest live report reports reported could would may can will get gets'.split(' '));
  const title = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/international criminal court/g, 'icc').replace(/north korea/g, 'northkorea')
    .replace(/south korea/g, 'south').replace(/artificial intelligence/g, 'ai')
    .replace(/\b(?:broadcasts?|loudspeakers?)\b/g, 'broadcast')
    .replace(/new york city/g, 'nyc').replace(/(\d),(\d{3})/g, '$1$2');
  return new Set(title.replace(/[^a-z0-9]+/g, ' ').split(' ').filter(word => word.length > 2 && !stop.has(word))
    .map(word => word.replace(/(ing|ed|es|s)$/, ''))
    .map(word => ({ french: 'france', ukrainian: 'ukraine', russian: 'russia', british: 'britain', american: 'america', billionaire: 'billion', zuckerberg: 'meta', restart: 'resume', bombard: 'strik', missil: 'strik' })[word] ?? word));
}
function differentDevelopment(a, b) {
  const main = value => value.toLowerCase().split(/\b(?:after|amid|following|while|but)\b/)[0];
  const attack = value => /\b(bombard\w*|attack\w*|missiles?|airstrikes?|drone\w*|strikes?|struck|shell\w*|raid\w*)\b/.test(value) && !/\bstrikes? (a )?deal\b/.test(value);
  const peace = value => /\b(talk\w*|negotiat\w*|peace|ceasefire)\b/.test(value);
  const evacuate = value => /\b(diplomat\w*.*leave|evacuat\w*|ordered? to leave|told to leave)\b/.test(value);
  const x = main(a), y = main(b);
  if ((attack(x) && peace(y) && !attack(y)) || (attack(y) && peace(x) && !attack(x))) return true;
  if ((attack(x) && evacuate(y)) || (attack(y) && evacuate(x))) return true;
  if ((/\bresponds?\b/.test(x) && /\b(?:calls? on|urges)\b.*\b(?:remove|take down)\b/.test(y)) ||
      (/\bresponds?\b/.test(y) && /\b(?:calls? on|urges)\b.*\b(?:remove|take down)\b/.test(x))) return true;
  const speaker = value => value.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says|calls|responds|accuses|hopes|warns|urges|defends)\b/)?.[1];
  return Boolean(speaker(a) && speaker(b) && speaker(a) !== speaker(b));
}
function bigrams(value) { const chars = [...value.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '')]; return new Set(chars.slice(1).map((ch, i) => chars[i] + ch)); }

function topicFor(item) {
  const title = item.title;
  const description = item.description;
  const scores = Object.entries(patterns).map(([name, pattern]) => ({
    name,
    score: (pattern.test(title) ? 4 : 0) + (pattern.test(description) ? 1 : 0),
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores[0].score >= 4 ? scores[0] : null;
}
function analysisFor(item) {
  const text = `${item.title} ${item.description}`;
  if (/\b(tariffs?|customs|duties|trade barriers?)\b|关税|海关|關稅/i.test(text))
    return '若相关措施落地，跨境企业需核对适用商品、税率、生效日期和豁免条件；实际成本影响以官方文件为准。';
  if (/\b(exports?|imports?|sanctions?|supply chain|shipping|logistics)\b|出口|进口|制裁|供应链|航运|物流/i.test(text))
    return '需关注适用市场、交付时间和供应链替代方案；报道中的计划与已执行措施应分开看待。';
  if (/\b(interest rates?|inflation|central bank|federal reserve|bond yields?|currency)\b|利率|通胀|央行|债券|汇率/i.test(text))
    return '利率、汇率或融资成本可能受到影响；需结合后续官方数据和政策决定判断实际幅度。';
  if (/\b(earnings|revenue|profits?|gdp|employment|stock market|shares?)\b|财报|营收|利润|就业|股市|经济增长/i.test(text))
    return '这为判断需求和企业经营提供了线索，但单条数据不足以代表整体趋势，仍需与历史数据及后续披露对照。';
  if (/\b(ai|artificial intelligence|model|chip|semiconductor|gpu|robotics?|automation)\b|人工智能|大模型|芯片|半导体|机器人/i.test(text))
    return '需区分产品发布、实际可用性与商业化效果，并继续观察成本、监管和供应链约束。';
  return '这是值得跟踪的行业信号；具体影响仍需更多数据或正式公告验证。';
}
function renderReport(items) {
  return [
    `# AI · 经济金融 · 跨境贸易｜${date}`,
    `**收录窗口：** ${windowStart}—${windowEnd}（北京时间）；计划07:00展示。`,
    '简介来自媒体公开导语；影响分析为规则推导的观察点，不是投资建议，也不代表已独立核验。',
    ...items.map((item, index) =>
      `### ${index + 1}. ${escape(item.title)}\n\n**主题：** ${item.topic.name}\n\n**媒体导语（原文）：** ${escape(item.description)}\n\n**影响分析：** ${analysisFor(item)}\n\n**来源与时间：** ${escape(item.media)}｜${localTime(new Date(item.publishedTime))} 北京时间\n\n**来源标记：** 官方公开RSS；未独立核验。 [阅读原文](${item.url})`
    ),
  ].join('\n\n');
}
function localTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(value);
}
function escape(value) { return value.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, ''); }
