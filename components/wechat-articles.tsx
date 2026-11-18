'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Copy, FileText } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { WechatTopicSamples } from './wechat-topic-samples';

type Article = {
  id: string;
  title: string;
  article_date: string;
  html: string;
  markdown: string;
};

function mondayOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}

function sundayOf(monday: string) {
  const day = new Date(`${monday}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 6);
  return day.toISOString().slice(0, 10);
}

export function WechatArticlesView({ userId }: { userId: string | null }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const client = getSupabase();
    if (!client) return;
    void client.from('wechat_articles').select('id,title,article_date,html,markdown')
      .order('article_date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!alive) return;
        if (loadError) setError('文章暂时无法读取，请稍后刷新。');
        else {
          const loaded = (data ?? []) as Article[];
          setError('');
          setArticles(loaded);
          setExpandedWeek((current) => current ?? (loaded[0] ? mondayOf(loaded[0].article_date) : null));
        }
      });
    return () => { alive = false; };
  }, [userId]);

  const weeks = useMemo(() => {
    const grouped = new Map<string, Article[]>();
    for (const article of articles) {
      const monday = mondayOf(article.article_date);
      const entries = grouped.get(monday) ?? [];
      entries.push(article);
      grouped.set(monday, entries);
    }
    return Array.from(grouped, ([monday, entries]) => ({ monday, entries }))
      .sort((a, b) => b.monday.localeCompare(a.monday));
  }, [articles]);

  async function copyArticle(article: Article) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([article.html], { type: 'text/html' }),
        'text/plain': new Blob([article.markdown], { type: 'text/plain' }),
      })]);
      setCopiedId(article.id);
      setError('');
      window.setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setError('复制失败。请使用 HTTPS 打开看板，并允许浏览器访问剪贴板。');
    }
  }

  return <section className="w-full overflow-hidden rounded-3xl bg-[#071633] text-white shadow-xl">
    <header className="bg-gradient-to-r from-[#102a59] to-[#244b98] px-6 py-7 sm:px-8">
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-cyan-200"><FileText className="size-4" /> 微信公众号</div>
      <h1 className="mt-2 text-3xl font-bold">文章库</h1>
      <p className="mt-2 text-sm text-sky-100">每周准备 7 篇。展开周列表，点击标题预览，点击标题旁按钮复制图文。</p>
    </header>
    <div className="space-y-3 p-4 sm:p-6">
      {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
      {!userId && <p className="rounded-xl border border-white/15 p-5 text-sm text-slate-300">登录后查看文章。</p>}
      {userId && weeks.length === 0 && !error && <p className="rounded-xl border border-white/15 p-5 text-sm text-slate-300">还没有文章。</p>}
      {weeks.map((week, index) => {
        const expanded = expandedWeek === week.monday;
        return <div key={week.monday} className="overflow-hidden rounded-2xl border border-[#25426e] bg-[#0b1d40]">
          <button type="button" aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5" onClick={() => { setExpandedWeek(expanded ? null : week.monday); setSelectedId(null); }}>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${index === 0 ? 'bg-cyan-800 text-cyan-100' : 'bg-[#22365d] text-slate-200'}`}>{index === 0 ? '最新一周' : '往期'}</span>
            <span className="text-sm font-semibold">{week.monday} — {sundayOf(week.monday)}</span>
            <span className="text-xs text-slate-400">{week.entries.length} 篇文章</span>
            <ChevronDown className={`ml-auto size-4 text-cyan-100 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && <ol className="space-y-2 border-t border-[#25426e] p-3 sm:p-4">
            {week.entries.map((article, articleIndex) => <li key={article.id} className="rounded-xl border border-[#1f416e] bg-[#11274d] px-3 py-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="rounded-full bg-[#244b98] px-2 py-1 text-xs font-bold text-cyan-100">{String(articleIndex + 1).padStart(2, '0')}</span>
                <span className="text-xs text-slate-400">{article.article_date}</span>
                <button type="button" className="min-w-0 flex-1 text-left text-sm font-semibold leading-relaxed text-white hover:text-cyan-200" onClick={() => setSelectedId(selectedId === article.id ? null : article.id)}>{article.title}</button>
                <button type="button" onClick={() => void copyArticle(article)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-600 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-900/50">
                  {copiedId === article.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copiedId === article.id ? '已复制' : '复制图文'}
                </button>
              </div>
              {selectedId === article.id && <div className="mt-4 overflow-hidden rounded-xl bg-white p-2 sm:p-4"><iframe title={article.title} sandbox="" srcDoc={article.html} className="h-[75vh] w-full border-0" /></div>}
            </li>)}
          </ol>}
        </div>;
      })}
      <WechatTopicSamples userId={userId} />
    </div>
  </section>;
}

