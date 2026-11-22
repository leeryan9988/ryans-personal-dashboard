'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type Entry = { id: string; group_name: string; position: number; title: string };
type Content = { id: string; html: string; markdown: string };
export function WechatArticleCollections({ userId }: { userId: string | null }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<string | null>('情感测试版');
  const [selected, setSelected] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, Content>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const epoch = useRef(0);
  const pending = useRef(new Map<string, Promise<Content>>());
  useEffect(() => {
    const current = ++epoch.current;
    setEntries([]); setContents({}); setSelected(null); setError(''); setLoading({}); setCopied(null); pending.current.clear();
    if (!userId) return;
    const client = getSupabase(); if (!client) return;
    void client.from('wechat_article_collections').select('id,group_name,position,title').eq('user_id', userId).order('position').then(({ data, error: issue }) => {
      if (epoch.current !== current) return;
      if (issue) setError('文章分组暂时无法读取，请刷新重试。');
      else setEntries((data ?? []) as Entry[]);
    });
    return () => { epoch.current++; };
  }, [userId]);
  const groups = useMemo(() => {
    const result = new Map<string, Entry[]>();
    for (const entry of entries) result.set(entry.group_name, [...(result.get(entry.group_name) ?? []), entry]);
    return [...result].sort(([a], [b]) => a === '情感测试版' ? -1 : b === '情感测试版' ? 1 : a.localeCompare(b, 'zh-CN', { numeric: true }));
  }, [entries]);
  function loadContent(id: string): Promise<Content> {
    if (contents[id]) return Promise.resolve(contents[id]);
    const existing = pending.current.get(id); if (existing) return existing;
    const current = epoch.current;
    const operation = (async () => {
      const client = getSupabase(); if (!client || !userId) throw new Error('请先登录。');
      setLoading(state => ({ ...state, [id]: true }));
      const { data, error: issue } = await client.from('wechat_article_collections').select('id,html,markdown').eq('id', id).eq('user_id', userId).single();
      if (epoch.current !== current) throw new Error('登录状态已变化，请重新打开文章。');
      if (issue || !data) throw new Error('文章暂时无法读取，请重试。');
      setContents(state => ({ ...state, [id]: data as Content })); return data as Content;
    })().finally(() => { if (epoch.current === current) { pending.current.delete(id); setLoading(state => ({ ...state, [id]: false })); } });
    pending.current.set(id, operation); return operation;
  }
  async function preview(id: string) {
    if (selected === id) { setSelected(null); return; }
    setSelected(id); setError('');
    try { await loadContent(id); } catch (issue) { setError(issue instanceof Error ? issue.message : '读取失败，请重试。'); }
  }
  async function copy(entry: Entry) {
    setError(''); const current = epoch.current;
    try {
      // Start clipboard access during the click; resolve article data inside ClipboardItem.
      const content = loadContent(entry.id);
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': content.then(a => new Blob([a.html], { type: 'text/html' })),
        'text/plain': content.then(a => new Blob([a.markdown], { type: 'text/plain' })),
      })]);
      if (current === epoch.current) setCopied(entry.id);
    } catch { if (current === epoch.current) setError('复制失败，请先打开文章后重试，并允许 HTTPS 看板访问剪贴板。'); }
  }
  if (!userId) return null;
  return <div className="space-y-3" aria-label="情感文章分组">
    {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
    {groups.map(([name, articles]) => <div key={name} className="overflow-hidden rounded-2xl border border-cyan-700 bg-[#0b1d40]">
      <button type="button" aria-expanded={expanded === name} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-white/5" onClick={() => { setExpanded(expanded === name ? null : name); setSelected(null); }}>
        <span className="rounded-full bg-cyan-900 px-2.5 py-1 text-xs text-cyan-100">情感文章</span><span className="font-semibold">{name}</span><span className="text-xs text-slate-300">{articles.length} 篇</span><ChevronDown className={`ml-auto size-4 ${expanded === name ? 'rotate-180' : ''}`} />
      </button>
      {expanded === name && <ol className="space-y-2 border-t border-[#25426e] p-3">
        {articles.map(a => <li key={a.id} className="rounded-xl border border-[#1f416e] bg-[#11274d] p-3">
          <div className="flex flex-wrap items-center gap-3"><span className="text-xs text-cyan-200">{String(a.position).padStart(2, '0')}</span><button type="button" className="min-w-0 flex-1 text-left text-sm font-semibold leading-relaxed text-white hover:text-cyan-200" onClick={() => void preview(a.id)}>{a.title}</button><button type="button" disabled={loading[a.id]} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-600 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-50" onClick={() => void copy(a)}>{loading[a.id] ? <Loader2 className="size-3.5 animate-spin" /> : copied === a.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied === a.id ? '已复制' : '复制图文'}</button></div>
          {selected === a.id && <div className="mt-4 rounded-xl bg-white p-2 sm:p-4">{contents[a.id] ? <iframe title={a.title} sandbox="" srcDoc={contents[a.id].html} className="h-[75vh] w-full border-0" /> : <p className="p-4 text-sm text-slate-700">{loading[a.id] ? '正在加载图文…' : '读取未完成，请重试。'}</p>}</div>}
        </li>)}
      </ol>}
    </div>)}
  </div>;
}
