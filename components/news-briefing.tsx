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

function MarkdownBody({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
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
      blocks.push(<div key={blocks.length} className="my-4 overflow-x-auto rounded-xl border border-white/10"><table className="min-w-full text-left text-sm"><thead className="bg-white/10"><tr>{rows[0]?.map((cell, j) => <th key={j} className="whitespace-nowrap px-3 py-2 font-semibold text-cyan-100">{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, j) => <tr key={j} className="border-t border-white/10">{row.map((cell, k) => <td key={k} className="min-w-36 px-3 py-2 align-top leading-6">{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const className = level === 1
        ? 'mt-8 border-b border-cyan-300/20 pb-2 text-xl font-bold text-white'
        : level === 2
          ? 'mt-6 text-lg font-bold text-cyan-100'
          : 'mt-5 text-base font-semibold text-white';
      blocks.push(<h2 key={blocks.length} className={className}>{inline(heading[2])}</h2>);
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(<ul key={blocks.length} className="my-3 list-disc space-y-1 pl-6 text-sm leading-7 text-slate-200">{items.map((item, j) => <li key={j}>{inline(item)}</li>)}</ul>);
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s|^[-*]\s|^\|/.test(lines[i].trim()) && lines[i].trim() !== '---') {
      paragraph.push(lines[i].trim());
      i++;
    }
    if (paragraph.length) blocks.push(<p key={blocks.length} className="my-3 text-sm leading-7 text-slate-200">{inline(paragraph.join(' '))}</p>);
    else i++;
  }
  return <div>{blocks}</div>;
}

export function NewsBriefingView({ searchQuery = '' }: { searchQuery?: string }) {
  const [editions, setEditions] = useState<NewsEdition[]>([]);
  const [reports, setReports] = useState<Record<string, NewsReport>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const fetched = useRef(new Set<string>());

  const loadReport = useCallback(async (edition: NewsEdition) => {
    if (fetched.current.has(edition.date)) return;
    fetched.current.add(edition.date);
    setReportErrors((current) => ({ ...current, [edition.date]: '' }));
    try {
      const response = await fetch(`${newsBase}${edition.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const report = await response.json() as NewsReport;
      if (report.date !== edition.date || typeof report.content !== 'string') throw new Error('早报文件格式不正确');
      setReports((current) => ({ ...current, [edition.date]: report }));
    } catch {
      fetched.current.delete(edition.date);
      setReportErrors((current) => ({ ...current, [edition.date]: '本期内容暂时无法加载，请刷新后重试。' }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${newsBase}index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<NewsEdition[]>;
      })
      .then((rows) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error('早报目录格式不正确');
        const sorted = rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && /^\d{4}-\d{2}-\d{2}\.json$/.test(row.file))
          .sort((a, b) => b.date.localeCompare(a.date));
        setEditions(sorted);
      })
      .catch(() => { if (!cancelled) setError('早报目录暂时无法加载，请刷新后重试。'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadReport]);

  useEffect(() => {
    const nextRelease = editions.map((edition) => Date.parse(edition.publishedAt))
      .filter((time) => Number.isFinite(time) && time > now)
      .sort((a, b) => a - b)[0];
    if (!nextRelease) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(nextRelease - now + 50, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [editions, now]);

  const released = editions.filter((edition) => Date.parse(edition.publishedAt) <= now);
  const latestReleased = released[0];
  useEffect(() => {
    if (latestReleased) void loadReport(latestReleased);
  }, [latestReleased, loadReport]);

  const today = beijingDate();
  const visible = released.filter((edition) =>
    matchesDashboardSearch(searchQuery, edition.date, dateLabel(edition.date), reports[edition.date]?.content ?? ''),
  );

  return <div className="overflow-hidden rounded-[24px] border border-[#284d9a] bg-[#061432] text-white shadow-[0_20px_60px_rgba(15,31,72,.22)]">
    <header className="bg-[radial-gradient(circle_at_85%_0%,#2556ae_0%,transparent_42%),radial-gradient(circle_at_10%_10%,#143a7d_0%,transparent_42%)] px-5 py-5 sm:px-8 sm:py-6">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-cyan-200"><Newspaper className="size-4" /> GLOBAL NEWS BRIEFING</div>
      <h1 className="text-2xl font-black tracking-tight sm:text-4xl">全球主流媒体 <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300 bg-clip-text text-transparent">中文早报</span></h1>
      <p className="mt-2 text-xs leading-5 text-slate-200 sm:text-sm">关注 AI、跨境贸易、经济和全球重大事件，不限国家。每日北京时间 08:00 显示已预先发布的新一期；往期可查看原文、来源与核验说明。</p>
    </header>
    <div className="space-y-2.5 p-3 sm:p-5">
      {loading && <p className="rounded-xl bg-[#0a1c42] p-5 text-sm text-sky-100">正在加载早报…</p>}
      {error && <p role="alert" className="rounded-xl bg-[#0a1c42] p-5 text-sm text-rose-200">{error}</p>}
      {!loading && !error && editions.length === 0 && <p className="rounded-xl bg-[#0a1c42] p-5 text-sm text-sky-100">尚无已归档的早报。</p>}
      {searchQuery.trim() && !loading && <p className="text-sm text-sky-100">找到 {visible.length} 期匹配早报；正文搜索覆盖已打开的期数。</p>}
      {released.length < editions.length && <p className="rounded-xl bg-[#0a1c42] px-4 py-3 text-sm text-cyan-100">新一期已安排在北京时间 08:00 显示。</p>}
      {visible.map((edition) => {
        const latest = edition.date === released[0]?.date;
        return <details key={edition.date} open={latest} onToggle={(event) => { if (event.currentTarget.open) void loadReport(edition); }} className="group overflow-hidden rounded-xl border border-sky-300/20 bg-[#0a1c42]">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-3 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className={latest ? 'rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-200' : 'rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300'}>{latest ? (edition.date === today ? '今天' : '最新一期') : '往期'}</span>
            <span>{dateLabel(edition.date)}</span>
            <span className="text-xs font-normal text-slate-400">{edition.articleCount} 条新闻</span>
            <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-sky-300/15 px-4 py-4 sm:px-7">
            {reportErrors[edition.date] && <p role="alert" className="text-sm text-rose-200">{reportErrors[edition.date]}</p>}
            {!reports[edition.date] && !reportErrors[edition.date] && <p className="text-sm text-sky-100">正在加载本期内容…</p>}
            {reports[edition.date] && <MarkdownBody content={reports[edition.date].content} />}
          </div>
        </details>;
      })}
    </div>
  </div>;
}

