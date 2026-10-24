import { ChevronDown, ExternalLink, Newspaper } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchesDashboardSearch } from '@/lib/dashboard-search';

type Edition = {
  date: string;
  publishedAt: string;
  title: string;
  articleCount: number;
  file: string;
};

type Report = Edition & { content: string; preparedAt?: string };
type Topic = '全部' | 'AI' | '经济金融' | '跨境贸易' | '亚马逊电商';
type Story = {
  number: string;
  title: string;
  originalTitle: string;
  topic: Exclude<Topic, '全部'>;
  summary: string;
  analysis: string;
  source: string;
  sourceTime: string;
  url: string;
};

const base = `${import.meta.env.BASE_URL}focus-news/`;
const topics: Topic[] = ['全部', 'AI', '经济金融', '跨境贸易', '亚马逊电商'];

function readLine(section: string, label: string) {
  return section.match(new RegExp(`^\\*\\*${label}：\\*\\*\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
}

function parseStories(content: string): Story[] {
  const headings = [...content.matchAll(/^### (\d+)\. (.+)$/gm)];
  return headings.flatMap((heading, index) => {
    const section = content.slice(heading.index ?? 0, headings[index + 1]?.index ?? content.length);
    const topic = readLine(section, '主题') as Story['topic'];
    const url = section.match(/\[阅读原文\]\((https:\/\/[^)]+)\)/)?.[1] ?? '';
    if (!topics.includes(topic) || !url) return [];
    const sourceLine = readLine(section, '来源与时间').split('｜');
    const rawSummary = readLine(section, '一句话看懂') || readLine(section, '媒体导语（原文）') || readLine(section, '内容提示');
    return [{
      number: heading[1],
      title: heading[2],
      originalTitle: readLine(section, '原文标题'),
      topic,
      summary: rawSummary.replace(/（依据[^（）]*(?:整理|翻译)）\s*$/, '').trim(),
      analysis: readLine(section, '影响分析'),
      source: sourceLine[0]?.trim() ?? '',
      sourceTime: sourceLine[1]?.trim() ?? '',
      url,
    }];
  });
}

function beijingTime(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}


function storyTimestamp(story: Story) {
  const match = story.sourceTime.match(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/);
  return match ? Date.parse(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:00+08:00`) : 0;
}

function dateLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function FocusedNewsView({ searchQuery = '' }: { searchQuery?: string }) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({});
  const requested = useRef(new Set<string>());
  const [topic, setTopic] = useState<Topic>('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const response = await fetch(`${base}index.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: Edition[] = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid index');
        if (alive) { setEditions(data); setError(''); }
      } catch {
        if (alive) setError('新闻目录暂时无法读取，请稍后刷新。');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void refresh();
    const timer = window.setInterval(() => { setNow(Date.now()); void refresh(); }, 60_000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  const available = useMemo(
    () => editions.filter((edition) => Date.parse(edition.publishedAt) <= now)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [editions, now],
  );
  const openDates = available.filter((edition, index) => expandedDates[edition.date] ?? index === 0);
  const openKey = openDates.map((edition) => edition.date).join('|');

  useEffect(() => {
    for (const edition of openDates) {
      if (reports[edition.date] || reportErrors[edition.date] || requested.current.has(edition.date)) continue;
      requested.current.add(edition.date);
      void fetch(`${base}${edition.file}`, { cache: 'no-store' })
        .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
        .then((report: Report) => {
          setReports((current) => ({ ...current, [edition.date]: report }));
          setReportErrors((current) => { const next = { ...current }; delete next[edition.date]; return next; });
        })
        .catch(() => setReportErrors((current) => ({ ...current, [edition.date]: '本期新闻暂时无法读取。' })))
        .finally(() => requested.current.delete(edition.date));
    }
  }, [openKey, reports, reportErrors]);

  return <section className="mx-auto w-full max-w-[1540px] space-y-5 px-4 pb-12 pt-5 sm:px-7">
    <header className="rounded-3xl bg-[#102c57] px-5 py-7 text-white shadow-sm sm:px-8">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-sky-200"><Newspaper className="size-4" /> DAILY FOCUS</div>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">AI · 经济金融 · 跨境贸易 · 亚马逊电商</h1>
      <p className="mt-2 text-sm leading-6 text-sky-100">每天北京时间 07:00 计划更新。收录媒体公开报道的标题、导语与影响观察。</p>
      <p className="mt-1 text-xs leading-5 text-sky-200">影响观察由明确规则推导，供继续核查；不代表媒体观点或投资建议。</p>
    </header>

    <div className="rounded-2xl border border-[#cfe0f1] bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {topics.map((option) => <button key={option} type="button" onClick={() => setTopic(option)}
          className={`rounded-xl border px-3 py-2 text-sm transition-colors ${topic === option ? 'border-[#1b4a80] bg-[#1b4a80] text-white' : 'border-[#cfe0f1] text-[#315b88] hover:bg-[#eef6ff]'}`}>
          {option}
        </button>)}
      </div>
    </div>

    {loading && <p className="px-2 text-sm text-[#57718f]">正在读取新闻…</p>}
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
    {!loading && !available.length && !error && <p className="rounded-2xl border border-[#cfe0f1] bg-white p-6 text-sm text-[#57718f]">首期将在下一次北京时间 07:00 更新后显示。</p>}

    {available.map((edition, index) => {
      const isOpen = expandedDates[edition.date] ?? index === 0;
      const report = reports[edition.date];
      const stories = report ? parseStories(report.content)
        .filter((story) => story.summary && !story.summary.startsWith('原文或媒体导语暂不可读取'))
        .sort((a, b) => storyTimestamp(b) - storyTimestamp(a) || Number(a.number) - Number(b.number)) : [];
      const shown = stories.filter((story) =>
        (topic === '全部' || story.topic === topic) &&
        matchesDashboardSearch(searchQuery, story.title, story.originalTitle, story.summary, story.analysis, story.source, story.topic)
      );
      return <section key={edition.date} className="overflow-hidden rounded-3xl border border-[#21497a] bg-[#091d40] text-white">
        <button type="button" aria-expanded={isOpen} onClick={() => setExpandedDates((current) => ({ ...current, [edition.date]: !isOpen }))}
          className="flex w-full items-center justify-between gap-3 bg-[#112f62] px-4 py-4 text-left hover:bg-[#173b77] sm:px-6">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${index === 0 ? 'bg-[#125989] text-cyan-100' : 'bg-white/10 text-slate-300'}`}>{index === 0 ? '最新一期' : '历史'}</span>
            <span className="font-semibold">{dateLabel(edition.date)}</span>
            <span className="text-xs text-sky-200">{report ? `可读 ${stories.length} 条` : `${edition.articleCount} 条`}</span>
          </span>
          <ChevronDown className={`size-5 shrink-0 text-sky-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="space-y-3 p-3 sm:p-5">
          {report && <div className="flex flex-wrap justify-between gap-2 px-1 text-xs leading-5 text-sky-200">
            <span>计划 {beijingTime(report.publishedAt)} 北京时间{report.preparedAt && Date.parse(report.preparedAt) > Date.parse(report.publishedAt) ? ` · 实际采集 ${beijingTime(report.preparedAt)}` : ''}</span>
            <span>公开 RSS 导语；中文简介为自动翻译，原文链接可核对。</span>
          </div>}
          {reportErrors[edition.date] && <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-4 text-sm text-amber-100">
            {reportErrors[edition.date]} <button type="button" className="underline" onClick={() => setReportErrors((current) => { const next = { ...current }; delete next[edition.date]; return next; })}>重试</button>
          </p>}
          {!report && !reportErrors[edition.date] && <p className="px-2 py-4 text-sm text-sky-200">正在读取本期新闻…</p>}
          {report && (shown.length ? <div className="space-y-2.5">
            {shown.map((story) => <article key={`${edition.date}-${story.number}`} className="rounded-2xl border border-[#204d87] bg-[#122b57] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#295493] text-xs font-bold text-white">{story.number.padStart(2, '0')}</span>
                <h2 className="min-w-0 flex-1 text-sm font-bold leading-6 text-white sm:text-base">{story.title}</h2>
                <span className="rounded-full border border-[#2d649b] bg-[#173e72] px-2 py-0.5 text-xs text-cyan-100">{story.topic}</span>
                <a href={story.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-200 hover:underline">阅读原文 <ExternalLink className="size-3" /></a>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-sky-200">
                <span>{story.source}{story.sourceTime ? ` · ${story.sourceTime}` : ''}</span>
                {story.originalTitle && <span className="truncate sm:max-w-[60%]" title={story.originalTitle}>{story.originalTitle}</span>}
              </div>
              <div className="mt-2 grid gap-2 border-t border-white/10 pt-2 text-xs leading-6 text-slate-100 sm:grid-cols-2 sm:gap-4 sm:text-sm">
                <p><strong className="mr-1 text-cyan-300">简介</strong>{story.summary}</p>
                <p><strong className="mr-1 text-amber-300">影响观察</strong>{story.analysis}</p>
              </div>
            </article>)}
          </div> : <p className="rounded-xl border border-[#204d87] bg-[#122b57] px-4 py-5 text-sm text-sky-200">
            {topic === '亚马逊电商' && edition.date === '2026-10-24' ? '亚马逊电商分类从下一期开始收录；本期历史数据保持原样。' : '本期没有匹配的新闻。'}
          </p>)}
        </div>}
      </section>;
    })}
  </section>;
}
