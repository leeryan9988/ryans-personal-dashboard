import { ChevronDown, ExternalLink, Newspaper } from 'lucide-react';
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { matchesDashboardSearch } from '@/lib/dashboard-search';

type NewsEdition = {
  date: string;
  publishedAt: string;
  title: string;
  articleCount: number;
  file: string;
};

type NewsReport = Omit<NewsEdition, 'file'> & {
  sourceConversationId: string;
  content: string;
};

const newsBase = `${import.meta.env.BASE_URL}news/`;
const newSourcePolicyStarts = '2026-10-22';

function beijingDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `${year}年${Number(month)}月${Number(day)}日 · 北京时间 08:00`;
}

function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline underline-offset-2 hover:text-cyan-100">{link[1]} <ExternalLink className="inline size-3" /></a>;
    }
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function matchingNewsContent(content: string, query: string) {
  if (!query.trim()) return content;
  const sections = content.split(/(?=^###\s+\d+[.)]\s)/m);
  if (sections.length < 2) return matchesDashboardSearch(query, content) ? content : '';
  return sections.slice(1).filter((section) => matchesDashboardSearch(query, section)).join('\n\n');
}

function displayedNewsContent(report: NewsReport, query: string) {
  if (!query.trim() || matchesDashboardSearch(query, report.date, report.title)) return report.content;
  return matchingNewsContent(report.content, query);
}

function FullMarkdownBody({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let storyBlocks: ReactNode[] | null = null;
  let nextBlockKey = 0;
  const append = (block: ReactNode) => {
    if (storyBlocks) storyBlocks.push(block);
    else blocks.push(block);
  };
  const closeStory = () => {
    if (!storyBlocks) return;
    blocks.push(<article key={nextBlockKey++} className="my-6 rounded-2xl border border-sky-300/20 bg-white/[0.035] px-5 py-5 sm:px-7 sm:py-6">{storyBlocks}</article>);
    storyBlocks = null;
  };
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line || line === '---') { i++; continue; }
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|[\s:|-]+\|$/.test(lines[i].trim()))
          rows.push(lines[i].trim().slice(1, -1).split('|').map((cell) => cell.trim()));
        i++;
      }
      append(<div key={nextBlockKey++} className="my-4 overflow-x-auto rounded-xl border border-white/10"><table className="min-w-full text-left text-sm"><thead className="bg-white/10"><tr>{rows[0]?.map((cell, j) => <th key={j} className="whitespace-nowrap px-3 py-2 font-semibold text-cyan-100">{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, j) => <tr key={j} className="border-t border-white/10">{row.map((cell, k) => <td key={k} className="min-w-36 px-3 py-2 align-top leading-6">{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const numberedStory = level === 3 && /^\d+[.)]\s+/.test(heading[2]);
      if (storyBlocks) closeStory();
      if (numberedStory) storyBlocks = [];
      const className = level === 1
        ? 'mt-8 border-b border-cyan-300/20 pb-2 text-xl font-bold text-white'
        : level === 2
          ? 'mt-6 text-lg font-bold text-cyan-100'
          : numberedStory
            ? 'mb-4 text-lg font-bold leading-8 text-cyan-100'
            : 'mt-5 text-base font-semibold text-white';
      append(<h2 key={nextBlockKey++} className={className}>{inline(heading[2])}</h2>);
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      append(<ul key={nextBlockKey++} className="my-3 list-disc space-y-1 pl-6 text-sm leading-7 text-slate-200">{items.map((item, j) => <li key={j}>{inline(item)}</li>)}</ul>);
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s|^[-*]\s|^\|/.test(lines[i].trim()) && lines[i].trim() !== '---') {
      paragraph.push(lines[i].trim());
      i++;
    }
    if (paragraph.length) {
      const originalTitle = paragraph[0].startsWith('**原文标题：**');
      append(<p key={nextBlockKey++} className={originalTitle ? 'my-2 text-xs leading-6 text-slate-400 sm:text-sm' : 'my-3 text-sm leading-7 text-slate-200'}>{inline(paragraph.join(' '))}</p>);
    }
    else i++;
  }
  closeStory();
  return <div>{blocks}</div>;
}


function mobileNewsText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim();
}

function MobileNewsBody({ content }: { content: string }) {
  const headings = [...content.matchAll(/^###\s+\d+[.)]\s.+$/gm)];
  const stories = headings.map((heading, index) => content.slice(heading.index ?? 0, headings[index + 1]?.index ?? content.length));
  if (!stories.length) return <FullMarkdownBody content={content} />;

  return <div className="space-y-4">
    {stories.map((story, index) => {
      const lines = story.split('\n').map((line) => line.trim()).filter(Boolean);
      const title = mobileNewsText(lines[0].replace(/^###\s+/, ''));
      const labeledSummary = lines.find((line) => /^\*\*(一句话看懂|内容提示)：\*\*/.test(line));
      const firstParagraph = lines.find((line) =>
        !line.startsWith('#') && !line.startsWith('**') &&
        !/^\[[^\]]+\]\(https?:\/\/[^)]+\)\s*$/.test(line) && !line.startsWith('|') && line !== '---' && !/^[-*]\s/.test(line)
      );
      const summary = labeledSummary
        ? mobileNewsText(labeledSummary.replace(/^\*\*(一句话看懂|内容提示)：\*\*\s*/, ''))
        : mobileNewsText(firstParagraph ?? '').split(/(?<=[。！？])/)[0];

      return <article key={index} className="space-y-1">
        <h3 className="text-sm font-semibold leading-6 text-cyan-100">{title}</h3>
        {summary && <p className="text-sm leading-6 text-slate-200">{summary}</p>}
      </article>;
    })}
  </div>;
}

function MarkdownBody({ content }: { content: string }) {
  return <>
    <div className="sm:hidden"><MobileNewsBody content={content} /></div>
    <div className="hidden sm:block"><FullMarkdownBody content={content} /></div>
  </>;
}

export function NewsBriefingView({ searchQuery = '' }: { searchQuery?: string }) {
  const [editions, setEditions] = useState<NewsEdition[]>([]);
  const [reports, setReports] = useState<Record<string, NewsReport>>({});
  const [experiment, setExperiment] = useState<NewsReport | null>(null);
  const [experimentError, setExperimentError] = useState('');
  const [rebuilt, setRebuilt] = useState<NewsReport | null>(null);
  const [rebuiltError, setRebuiltError] = useState('');
  const [revised, setRevised] = useState<NewsReport | null>(null);
  const [revisedError, setRevisedError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const fetched = useRef(new Set<string>());
  const clockOffset = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${newsBase}2026-10-21-experiment.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<NewsReport>;
      })
      .then((report) => {
        if (report.date !== '2026-10-21' || typeof report.content !== 'string') throw new Error('实验版格式不正确');
        if (!cancelled) setExperiment(report);
      })
      .catch(() => { if (!cancelled) setExperimentError('实验版暂时无法加载，请刷新后重试。'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${newsBase}2026-10-21-rebuilt-08-analysis-v2.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<NewsReport>;
      })
      .then((report) => {
        if (report.date !== '2026-10-21' || report.articleCount < 50 || typeof report.content !== 'string') throw new Error('分析修订版格式不正确');
        if (!cancelled) setRevised(report);
      })
      .catch(() => { if (!cancelled) setRevisedError('分析修订版暂时无法加载，请刷新后重试。'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${newsBase}2026-10-21-rebuilt-08.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<NewsReport>;
      })
      .then((report) => {
        if (report.date !== '2026-10-21' || report.articleCount < 50 || typeof report.content !== 'string') throw new Error('重编版格式不正确');
        if (!cancelled) setRebuilt(report);
      })
      .catch(() => { if (!cancelled) setRebuiltError('重编实验版暂时无法加载，请刷新后重试。'); });
    return () => { cancelled = true; };
  }, []);

  const loadReport = useCallback(async (edition: NewsEdition) => {
    if (fetched.current.has(edition.date)) return;
    fetched.current.add(edition.date);
    try {
      const response = await fetch(`${newsBase}${edition.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const report = await response.json() as NewsReport;
      if (report.date !== edition.date || typeof report.content !== 'string') throw new Error('早报文件格式不正确');
      setReports((current) => ({ ...current, [edition.date]: report }));
      setReportErrors((current) => ({ ...current, [edition.date]: '' }));
    } catch {
      fetched.current.delete(edition.date);
      setReportErrors((current) => ({ ...current, [edition.date]: '本期内容暂时无法加载，请刷新后重试。' }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadIndex = () => fetch(`${newsBase}index.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const serverTime = Date.parse(response.headers.get('date') ?? '');
        if (Number.isFinite(serverTime)) {
          clockOffset.current = serverTime - Date.now();
          if (!cancelled) setNow(serverTime);
        }
        return response.json() as Promise<NewsEdition[]>;
      })
      .then((rows) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error('早报目录格式不正确');
        const sorted = rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && /^\d{4}-\d{2}-\d{2}\.json$/.test(row.file))
          .sort((a, b) => b.date.localeCompare(a.date));
        setEditions(sorted);
        const latest = sorted.find((row) => Date.parse(row.publishedAt) <= Date.now() + clockOffset.current);
        if (latest) void loadReport(latest);
        setError('');
      })
      .catch(() => { if (!cancelled) setError('早报目录暂时无法加载，请刷新后重试。'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    void loadIndex();
    const refresh = window.setInterval(() => { void loadIndex(); }, 60_000);
    return () => { cancelled = true; window.clearInterval(refresh); };
  }, [loadReport]);

  useEffect(() => {
    const nextRelease = editions.map((edition) => Date.parse(edition.publishedAt))
      .filter((time) => Number.isFinite(time) && time > now)
      .sort((a, b) => a - b)[0];
    if (!nextRelease) return;
    const timer = window.setTimeout(() => {
      const currentTime = Date.now() + clockOffset.current;
      setNow(currentTime);
      const latest = editions.find((row) => Date.parse(row.publishedAt) <= currentTime);
      if (latest) void loadReport(latest);
    }, Math.min(nextRelease - now + 50, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [editions, now, loadReport]);

  const released = editions.filter((edition) => Date.parse(edition.publishedAt) <= now);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    editions.filter((edition) => Date.parse(edition.publishedAt) <= now)
      .forEach((edition) => { void loadReport(edition); });
  }, [searchQuery, editions, now, loadReport]);

  const today = beijingDate();
  const revisedIsLatest = Boolean(revised && today === '2026-10-21');
  const rebuiltIsLatest = Boolean(rebuilt && today === '2026-10-21' && !revised);
  const experimentIsLatest = Boolean(experiment && today === '2026-10-21' && !rebuilt && !revised);
  const revisedMatches = Boolean(revised && displayedNewsContent(revised, searchQuery));
  const rebuiltMatches = Boolean(rebuilt && displayedNewsContent(rebuilt, searchQuery));
  const experimentMatches = Boolean(experiment && displayedNewsContent(experiment, searchQuery));
  const visible = released.filter((edition) =>
    matchesDashboardSearch(searchQuery, edition.date, dateLabel(edition.date)) ||
    Boolean(reports[edition.date] && displayedNewsContent(reports[edition.date], searchQuery)),
  );
  const searchingReports = Boolean(searchQuery.trim() && released.some((edition) =>
    !reports[edition.date] && !reportErrors[edition.date],
  ));
  const incompleteSearch = Boolean(searchQuery.trim() && released.some((edition) => reportErrors[edition.date]));

  return <div className="overflow-hidden rounded-[24px] border border-[#284d9a] bg-[#061432] text-white shadow-[0_20px_60px_rgba(15,31,72,.22)]">
    <header className="bg-[radial-gradient(circle_at_85%_0%,#2556ae_0%,transparent_42%),radial-gradient(circle_at_10%_10%,#143a7d_0%,transparent_42%)] px-5 py-5 sm:px-8 sm:py-6">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-cyan-200"><Newspaper className="size-4" /> GLOBAL NEWS BRIEFING</div>
      <h1 className="text-2xl font-black tracking-tight sm:text-4xl">全球主流媒体 <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300 bg-clip-text text-transparent">中文早报</span></h1>
      <p className="mt-2 text-xs leading-5 text-slate-200 sm:text-sm">北京时间每日 08:00 期，重点关注 AI、跨境贸易、经济和全球重大事件；每期至少 50 条，逐条说明影响机制、受影响对象和结论边界。</p>
    </header>
    <div className="flex flex-col gap-2.5 p-3 sm:p-5">
      {loading && <p className="rounded-xl bg-[#0a1c42] p-5 text-sm text-sky-100">正在加载早报…</p>}
      {error && <p role="alert" className="rounded-xl bg-[#0a1c42] p-5 text-sm text-rose-200">{error}</p>}
      {!loading && !error && editions.length === 0 && <p className="rounded-xl bg-[#0a1c42] p-5 text-sm text-sky-100">尚无已归档的早报。</p>}
      {searchQuery.trim() && !loading && <p className="text-sm text-sky-100">{searchingReports ? '正在检索已发布早报全文… ' : ''}找到 {visible.length + Number(experimentMatches) + Number(rebuiltMatches) + Number(revisedMatches)} 期匹配早报；展开后仅显示命中的新闻。</p>}
      {incompleteSearch && <p role="alert" className="text-sm text-amber-200">部分往期早报未能加载，搜索结果可能不完整。请刷新后重试。</p>}
      {released.length < editions.length && <p className="rounded-xl bg-[#0a1c42] px-4 py-3 text-sm text-cyan-100">新一期已安排在北京时间 08:00 显示。</p>}
      {experimentError && <p role="alert" className="rounded-xl bg-[#0a1c42] px-4 py-3 text-sm text-rose-200">{experimentError}</p>}
      {rebuiltError && <p role="alert" className="rounded-xl bg-[#0a1c42] px-4 py-3 text-sm text-rose-200">{rebuiltError}</p>}
      {revisedError && <p role="alert" className="rounded-xl bg-[#0a1c42] px-4 py-3 text-sm text-rose-200">{revisedError}</p>}
      {revised && revisedMatches && <details key="2026-10-21-analysis-v2" open={revisedIsLatest || Boolean(searchQuery.trim())} className={`group overflow-hidden rounded-xl border border-cyan-300/40 bg-[#0a1c42] ${revisedIsLatest ? 'order-0' : 'order-1'}`}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-100">08:00 期 · 分析修订版</span>
          <span>2026 年 10 月 21 日 · 补发</span>
          <span className="text-xs font-normal text-slate-400">{revised.articleCount} 条新闻 · 机制、对象、结论边界</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-sky-300/15 px-4 py-4 sm:px-7"><MarkdownBody content={displayedNewsContent(revised, searchQuery)} /></div>
      </details>}
      {rebuilt && rebuiltMatches && <details key="2026-10-21-rebuilt-08" open={rebuiltIsLatest || Boolean(searchQuery.trim())} className={`group overflow-hidden rounded-xl border border-cyan-300/40 bg-[#0a1c42] ${rebuiltIsLatest ? 'order-0' : 'order-2'}`}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-100">08:00 期 · 先前重编版</span>
          <span>2026 年 10 月 21 日 · 补发</span>
          <span className="text-xs font-normal text-slate-400">{rebuilt.articleCount} 条新闻 · 逐条简析</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-sky-300/15 px-4 py-4 sm:px-7"><MarkdownBody content={displayedNewsContent(rebuilt, searchQuery)} /></div>
      </details>}
      {experiment && experimentMatches && <details key="2026-10-21-experiment" open={experimentIsLatest || Boolean(searchQuery.trim())} className={`group overflow-hidden rounded-xl border border-cyan-300/40 bg-[#0a1c42] ${experimentIsLatest ? 'order-0' : 'order-3'}`}>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-100">30 家媒体选题池 · 实验版</span>
          <span>2026 年 10 月 21 日 · 补发试版</span>
          <span className="text-xs font-normal text-slate-400">{experiment.articleCount} 条新闻 · 3 条时间待核</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-sky-300/15 px-4 py-4 sm:px-7"><MarkdownBody content={displayedNewsContent(experiment, searchQuery)} /></div>
      </details>}
      {visible.map((edition) => {
        const latest = edition.date === released[0]?.date && !experimentIsLatest && !rebuiltIsLatest && !revisedIsLatest;
        return <details key={edition.date} open={latest || Boolean(searchQuery.trim())} onToggle={(event) => { if (event.currentTarget.open) void loadReport(edition); }} className={`group overflow-hidden rounded-xl border border-sky-300/20 bg-[#0a1c42] ${latest ? 'order-0' : 'order-4'}`}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className={latest ? 'rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-200' : 'rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300'}>{latest ? (edition.date === today ? '今天' : '最新一期') : '往期'}</span>
            {edition.date < newSourcePolicyStarts && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs text-amber-100">旧版十二国归档</span>}
            <span>{dateLabel(edition.date)}</span>
            <span className="text-xs font-normal text-slate-400">{edition.articleCount} 条新闻</span>
            <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-sky-300/15 px-4 py-4 sm:px-7">
            {reportErrors[edition.date] && <p role="alert" className="text-sm text-rose-200">{reportErrors[edition.date]}</p>}
            {!reports[edition.date] && !reportErrors[edition.date] && <p className="text-sm text-sky-100">正在加载本期内容…</p>}
            {reports[edition.date] && <MarkdownBody content={displayedNewsContent(reports[edition.date], searchQuery)} />}
          </div>
        </details>;
      })}
    </div>
  </div>;
}
