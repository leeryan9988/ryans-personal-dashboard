import { ExternalLink, Newspaper } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { matchesDashboardSearch } from '@/lib/dashboard-search';

type Edition = {
  date: string;
  publishedAt: string;
  title: string;
  articleCount: number;
  file: string;
};

type Report = Edition & { content: string; preparedAt?: string };
type Topic = '全部' | 'AI' | '经济金融' | '跨境贸易';
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
const topics: Topic[] = ['全部', 'AI', '经济金融', '跨境贸易'];

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

export function FocusedNewsView({ searchQuery = '' }: { searchQuery?: string }) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, Report>>({});
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
    () => editions.filter((edition) => Date.parse(edition.publishedAt) <= now),
    [editions, now],
  );
  const selected = available.find((edition) => edition.date === selectedDate) ?? available[0];

  useEffect(() => {
    if (!selected || reports[selected.date]) return;
    let alive = true;
    void fetch(`${base}${selected.file}`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
      .then((report: Report) => { if (alive) setReports((current) => ({ ...current, [selected.date]: report })); })
      .catch(() => { if (alive) setError('本期新闻暂时无法读取，请稍后刷新。'); });
    return () => { alive = false; };
  }, [selected?.date, selected?.file, reports]);

  const report = selected ? reports[selected.date] : undefined;
  const stories = useMemo(() => report ? parseStories(report.content).filter((story) => story.summary && !story.summary.startsWith('原文或媒体导语暂不可读取')) : [], [report]);
  const shown = stories.filter((story) =>
    (topic === '全部' || story.topic === topic) &&
    matchesDashboardSearch(searchQuery, story.title, story.originalTitle, story.summary, story.analysis, story.source, story.topic)
  );

  return <section className="mx-auto w-full max-w-[1540px] space-y-5 px-4 pb-12 pt-5 sm:px-7">
    <header className="rounded-3xl bg-[#102c57] px-5 py-7 text-white shadow-sm sm:px-8">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-sky-200"><Newspaper className="size-4" /> DAILY FOCUS</div>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">AI · 经济金融 · 跨境贸易</h1>
      <p className="mt-2 text-sm leading-6 text-sky-100">每天北京时间 07:00 计划更新。收录权威媒体公开报道的标题、导语与影响观察。</p>
      <p className="mt-1 text-xs leading-5 text-sky-200">影响观察由明确规则推导，供继续核查；不代表媒体观点或投资建议。</p>
    </header>

    <div className="rounded-2xl border border-[#cfe0f1] bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {topics.map((option) => <button key={option} type="button" onClick={() => setTopic(option)}
          className={`rounded-xl border px-3 py-2 text-sm transition-colors ${topic === option ? 'border-[#1b4a80] bg-[#1b4a80] text-white' : 'border-[#cfe0f1] text-[#315b88] hover:bg-[#eef6ff]'}`}>
          {option}
        </button>)}
        {available.length > 0 && <label className="ml-auto flex items-center gap-2 text-xs text-[#57718f]">
          日期
          <select aria-label="新闻期数" value={selected?.date ?? ''} onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-[#cfe0f1] bg-white px-2 py-2 text-sm text-[#153e69]">
            {available.map((edition) => <option key={edition.date} value={edition.date}>{edition.date}</option>)}
          </select>
        </label>}
      </div>
    </div>

    {loading && <p className="px-2 text-sm text-[#57718f]">正在读取新闻…</p>}
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}
    {!loading && !available.length && !error && <p className="rounded-2xl border border-[#cfe0f1] bg-white p-6 text-sm text-[#57718f]">首期将在下一次北京时间 07:00 更新后显示。</p>}
    {selected && !report && !error && <p className="px-2 text-sm text-[#57718f]">正在读取 {selected.date} 新闻…</p>}
    {report && <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1 text-sm text-[#57718f]">
        <span>计划 {beijingTime(report.publishedAt)} 北京时间{report.preparedAt && Date.parse(report.preparedAt) > Date.parse(report.publishedAt) ? ` · 实际采集 ${beijingTime(report.preparedAt)}` : ''} · 可读 {stories.length} 条</span>
        <span>公开 RSS 导语；中文简介为自动翻译，原文链接可核对。</span>
      </div>
      {shown.length ? <div className="grid gap-3 lg:grid-cols-2">
        {shown.map((story) => <article key={`${report.date}-${story.number}`} className="rounded-2xl border border-[#cfe0f1] bg-white p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-[#6682a0]">
            <span className="rounded-full bg-[#eaf3fd] px-2 py-1 text-[#1d5d99]">{story.topic}</span>
            <span>{story.source}{story.sourceTime ? ` · ${story.sourceTime}` : ''}</span>
          </div>
          <h2 className="text-base font-bold leading-7 text-[#102f55]">{story.title}</h2>
          {story.originalTitle && <p className="mt-1 text-xs leading-5 text-[#71869d]">{story.originalTitle}</p>}
          <p className="mt-3 text-sm leading-7 text-[#345475]"><strong className="text-[#173f69]">简介：</strong>{story.summary}</p>
          <p className="mt-2 text-sm leading-7 text-[#345475]"><strong className="text-[#173f69]">影响观察：</strong>{story.analysis}</p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm text-[#1c62a4] underline-offset-2 hover:underline"
            href={story.url} target="_blank" rel="noopener noreferrer">阅读原文 <ExternalLink className="size-3.5" /></a>
        </article>)}
      </div> : <p className="rounded-2xl border border-[#cfe0f1] bg-white p-6 text-sm text-[#57718f]">本期没有匹配的新闻。</p>}
    </>}
  </section>;
}
