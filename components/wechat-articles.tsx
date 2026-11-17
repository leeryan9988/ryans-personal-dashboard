'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FileText } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type Article = {
  id: string;
  title: string;
  article_date: string;
  html: string;
  markdown: string;
};

export function WechatArticlesView({ userId }: { userId: string | null }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
        else { setError(''); setArticles((data ?? []) as Article[]); }
      });
    return () => { alive = false; };
  }, [userId]);

  const selected = useMemo(() => articles.find((item) => item.id === selectedId), [articles, selectedId]);

  async function copyArticle() {
    if (!selected) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([selected.html], { type: 'text/html' }),
        'text/plain': new Blob([selected.markdown], { type: 'text/plain' }),
      })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('复制失败。请使用 HTTPS 打开看板，并允许浏览器访问剪贴板。');
    }
  }

  return <section className="mx-auto w-full max-w-[1050px] space-y-5">
    <header className="rounded-3xl bg-[#102c57] px-6 py-7 text-white">
      <div className="flex items-center gap-2 text-xs tracking-widest text-sky-200"><FileText className="size-4" /> 微信公众号</div>
      <h1 className="mt-2 text-2xl font-bold">文章库</h1>
      <p className="mt-2 text-sm text-sky-100">每周准备 7 篇。点击标题查看图文排版，再一键复制。</p>
    </header>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {!userId && <p className="rounded-2xl bg-white p-6 text-sm text-slate-600">登录后查看文章。</p>}
    {userId && !selected && <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      {articles.length === 0 && !error && <p className="text-sm text-slate-500">还没有文章。</p>}
      <ol className="divide-y divide-slate-100">
        {articles.map((article) => <li key={article.id} className="py-3">
          <button type="button" className="w-full text-left hover:text-blue-700" onClick={() => setSelectedId(article.id)}>
            <span className="mr-3 text-xs text-slate-500">{article.article_date}</span>
            <span className="font-medium">{article.title}</span>
          </button>
        </li>)}
      </ol>
    </div>}
    {selected && <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="text-sm text-blue-700 hover:underline" onClick={() => setSelectedId(null)}>← 返回标题列表</button>
        <button type="button" onClick={copyArticle} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? '已复制' : '一键复制图文'}
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-5">
        <iframe title={selected.title} sandbox="" srcDoc={selected.html} className="h-[75vh] w-full border-0" />
      </div>
    </div>}
  </section>;
}

