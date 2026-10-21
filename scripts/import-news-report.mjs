import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node scripts/import-news-report.mjs <report.md>');
  process.exit(1);
}

const source = await readFile(sourcePath, 'utf8');
const dateMatch = source.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日/);
if (!dateMatch || !source.includes('早报')) {
  throw new Error('找不到全球早报日期；未修改归档。');
}
const date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
const previousDate = new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const content = source
  .replace(/:chatgpt-content-reference\{[^}]*\}/g, '')
  .replace(/navlist[^]*/g, '')
  .replace(/\n### (?:可进一步开展的工作|基于本期早报，可以进一步开展)[\s\S]*$/, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const articleCount = (content.match(/^### \d+\. /gm) ?? []).length;
if (!articleCount || !content.includes('核验') || !/https?:\/\//.test(content)) {
  throw new Error('早报缺少新闻、核验说明或原文链接；未修改归档。');
}

const directory = join(process.cwd(), 'public', 'news');
const file = `${date}.json`;
await mkdir(directory, { recursive: true });
const reportPath = join(directory, file);
const indexPath = join(directory, 'index.json');
const index = JSON.parse(await readFile(indexPath, 'utf8'));
if (!Array.isArray(index)) throw new Error('早报目录格式不正确；未修改归档。');
if (index.some((row) => row.date === date)) {
  const existing = JSON.parse(await readFile(reportPath, 'utf8'));
  if (existing.content === content) {
    console.log(`${date} 已归档，无需重复追加。`);
    process.exit(0);
  }
  throw new Error(`${date} 已存在且内容不同；请人工核对，未覆盖旧期。`);
}
if (index.length && index[0].date !== previousDate) {
  throw new Error(`归档最新一期为 ${index[0].date}，请先补齐缺失日期，再加入 ${date}；未修改归档。`);
}
const windowStart = index[0]?.windowEnd ?? `${previousDate}T08:00:00+08:00`;
const windowEnd = `${date}T07:50:00+08:00`;
const [previousYear, previousMonth, previousDay] = previousDate.split('-');
const previousDateZh = `${previousYear}年${Number(previousMonth)}月${Number(previousDay)}日`;
if (!(source.includes(previousDate) || source.includes(previousDateZh))
    || !source.includes(windowStart.slice(11, 16)) || !source.includes('07:50')) {
  throw new Error(`早报未明确覆盖 ${windowStart} 至 ${windowEnd}；未修改归档。`);
}
const report = {
  date,
  publishedAt: `${date}T08:00:00+08:00`,
  windowStart,
  windowEnd,
  title: source.match(/^#\s+(.+早报.*)$/m)?.[1].trim() ?? '全球主流媒体中文早报',
  articleCount,
  sourceConversationId: '6acd9fca-fe30-83ea-9b39-45854f7124f4',
  content,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
const next = [
  ...index,
  { date, publishedAt: report.publishedAt, windowStart: report.windowStart, windowEnd: report.windowEnd, title: report.title, articleCount, file },
].sort((a, b) => b.date.localeCompare(a.date));
await writeFile(indexPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`已归档 ${date}，共 ${articleCount} 条。`);

