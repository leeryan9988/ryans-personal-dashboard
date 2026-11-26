'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Loader2, RotateCcw, Search } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type UsageStatus = 'unused' | 'pending' | 'used';
type Usage = { usage_status: UsageStatus; used_on: string | null; publish_account: string; publish_url: string; usage_note: string; usage_version: number; usage_updated_at: string | null };
type Entry = { id: string; group_name: string; position: number; title: string; created_at: string } & Usage;
type UsageDraft = Pick<Usage, 'usage_status' | 'used_on' | 'publish_account' | 'publish_url' | 'usage_note'>;
type Content = { id: string; html: string; markdown: string };
type Filter = UsageStatus | 'all';
const usageColumns = 'usage_status,used_on,publish_account,publish_url,usage_note,usage_version,usage_updated_at';
const statusLabels: Record<UsageStatus, string> = { unused: '未使用', pending: '待发布', used: '已使用' };
const statusColors: Record<UsageStatus, string> = { unused: 'border-slate-500/50 bg-slate-800 text-slate-200', pending: 'border-amber-500/50 bg-amber-950 text-amber-200', used: 'border-emerald-500/50 bg-emerald-950 text-emerald-200' };
function beijingToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function draftOf(entry: Entry): UsageDraft { return { usage_status: entry.usage_status, used_on: entry.used_on, publish_account: entry.publish_account, publish_url: entry.publish_url, usage_note: entry.usage_note }; }
function tally(items: Entry[]) { return items.reduce((counts, entry) => { counts[entry.usage_status]++; return counts; }, { unused: 0, pending: 0, used: 0 }); }

export function WechatArticleCollections({ userId, table = 'wechat_article_collections', label = '情感文章', emptyMessage }: { userId: string | null; table?: 'wechat_article_collections' | 'benchmark_article_collections'; label?: string; emptyMessage?: string }) {
  const tracking = table === 'benchmark_article_collections';
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchCollapsed, setSearchCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [contents, setContents] = useState<Record<string, Content>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, UsageDraft>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Filter>('unused');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastChange, setLastChange] = useState<{ before: Entry; after: Entry } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const epoch = useRef(0);
  const pending = useRef(new Map<string, Promise<Content>>());
  const savingIds = useRef(new Set<string>());
  useEffect(() => { setFilter('unused'); setSearch(''); setSearchCollapsed({}); }, [userId, table]);
  useEffect(() => {
    const current = ++epoch.current;
    setEntries([]); setContents({}); setSelected({}); setExpanded({}); setError(''); setLoading({}); setSaving({}); setDrafts({}); setEditing({}); setCopied(null); setNotice(''); setLastChange(null); pending.current.clear(); savingIds.current.clear();
    if (!userId) { setListLoading(false); return; }
    const client = getSupabase(); if (!client) { setListLoading(false); setError('云端连接暂不可用，请刷新重试。'); return; }
    setListLoading(true);
    const columns = `id,group_name,position,title,created_at${tracking ? `,${usageColumns}` : ''}`;
    void (async () => {
      try {
        const { data, error: issue } = await client.from(table).select(columns).eq('user_id', userId).order('position');
        if (epoch.current !== current) return;
        if (issue) throw issue;
        setEntries((data ?? []) as unknown as Entry[]);
      } catch { if (epoch.current === current) setError('文章分组暂时无法读取，请刷新重试。'); }
      finally { if (epoch.current === current) setListLoading(false); }
    })();
    return () => { epoch.current++; };
  }, [userId, table, tracking, refresh]);
  const groups = useMemo(() => {
    const result = new Map<string, Entry[]>();
    for (const entry of entries) result.set(entry.group_name, [...(result.get(entry.group_name) ?? []), entry]);
    const created = (items: Entry[]) => Math.min(...items.map(item => Date.parse(item.created_at)));
    for (const items of result.values()) items.sort((a, b) => a.position - b.position);
    return [...result].sort(([a, left], [b, right]) => {
      if (tracking) {
        const aNumber = /^正式版(\d+)号$/.exec(a); const bNumber = /^正式版(\d+)号$/.exec(b);
        if (aNumber && bNumber) return Number(bNumber[1]) - Number(aNumber[1]);
        if (aNumber || bNumber) return aNumber ? -1 : 1;
      }
      return created(right) - created(left) || b.localeCompare(a, 'zh-CN', { numeric: true });
    });
  }, [entries, tracking]);
  const query = search.trim().toLocaleLowerCase();
  const counts = tracking ? tally(entries) : { unused: 0, pending: 0, used: 0 };
  const visibleGroups = groups.map(([name, articles]) => ({ name, articles, visible: articles.filter(entry => !tracking || ((filter === 'all' || entry.usage_status === filter) && (!query || entry.title.toLocaleLowerCase().includes(query)))) })).filter(group => group.visible.length > 0);

  async function saveUsage(entry: Entry, draft: UsageDraft, undo = false) {
    if (!tracking || !userId || savingIds.current.has(entry.id)) return;
    savingIds.current.add(entry.id); const current = epoch.current;
    setSaving(state => ({ ...state, [entry.id]: true })); setError(''); setNotice('');
    try {
      const client = getSupabase(); if (!client) throw new Error('云端连接暂不可用，请稍后重试。');
      const values = { ...draft, used_on: draft.usage_status === 'used' ? draft.used_on || beijingToday() : null, publish_account: draft.publish_account.trim(), publish_url: draft.publish_url.trim(), usage_note: draft.usage_note.trim() };
      if (values.publish_url) { let url: URL; try { url = new URL(values.publish_url); } catch { throw new Error('发布链接请填写完整的 http:// 或 https:// 地址。'); } if (!['http:', 'https:'].includes(url.protocol)) throw new Error('发布链接仅支持 http:// 或 https:// 地址。'); }
      const { data, error: issue } = await client.from('benchmark_article_collections').update(values).eq('id', entry.id).eq('user_id', userId).eq('usage_version', entry.usage_version).select(usageColumns).maybeSingle();
      if (epoch.current !== current) return;
      if (issue) throw new Error('使用记录未能保存，请检查网络后重试。');
      if (!data) throw new Error('这篇文章的记录已在其他页面更新，请刷新列表后重试。');
      const after = { ...entry, ...data } as Entry;
      setEntries(state => state.map(item => item.id === entry.id ? { ...item, ...data } as Entry : item));
      setEditing(state => ({ ...state, [entry.id]: false })); setDrafts(state => ({ ...state, [entry.id]: draftOf(after) }));
      setLastChange(undo ? null : { before: entry, after });
      setNotice(undo ? '已撤销上一次修改。' : `已保存为「${statusLabels[after.usage_status]}」${after.usage_status === 'used' ? '，可在「已使用」中查阅。' : '。'}`);
    } catch (issue) { if (epoch.current === current) setError(issue instanceof Error ? issue.message : '使用记录未能保存，请重试。'); }
    finally { if (epoch.current === current) { savingIds.current.delete(entry.id); setSaving(state => ({ ...state, [entry.id]: false })); } }
  }
  function mark(entry: Entry, status: UsageStatus) { return saveUsage(entry, { ...draftOf(entry), usage_status: status, used_on: status === 'used' ? entry.used_on || beijingToday() : null }); }
  function edit(entry: Entry) { if (!editing[entry.id]) setDrafts(state => ({ ...state, [entry.id]: draftOf(entry) })); setEditing(state => ({ ...state, [entry.id]: !state[entry.id] })); }
  function changeDraft(entry: Entry, patch: Partial<UsageDraft>) { setDrafts(state => ({ ...state, [entry.id]: { ...(state[entry.id] ?? draftOf(entry)), ...patch } })); }
  function loadContent(id: string): Promise<Content> {
    if (contents[id]) return Promise.resolve(contents[id]);
    const existing = pending.current.get(id); if (existing) return existing;
    const current = epoch.current;
    const operation = (async () => {
      const client = getSupabase(); if (!client || !userId) throw new Error('请先登录。');
      setLoading(state => ({ ...state, [id]: true }));
      const { data, error: issue } = await client.from(table).select('id,html,markdown').eq('id', id).eq('user_id', userId).single();
      if (epoch.current !== current) throw new Error('登录状态已变化，请重新打开文章。');
      if (issue || !data) throw new Error('文章暂时无法读取，请重试。');
      setContents(state => ({ ...state, [id]: data as Content })); return data as Content;
    })().finally(() => { if (epoch.current === current) { pending.current.delete(id); setLoading(state => ({ ...state, [id]: false })); } });
    pending.current.set(id, operation); return operation;
  }
  async function preview(id: string) {
    if (selected[id]) { setSelected(state => ({ ...state, [id]: false })); return; }
    setSelected(state => ({ ...state, [id]: true })); setError('');
    try { await loadContent(id); } catch (issue) { setError(issue instanceof Error ? issue.message : '读取失败，请重试。'); }
  }
  async function copy(entry: Entry) {
    setError(''); const current = epoch.current;
    try {
      const content = loadContent(entry.id);
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': content.then(a => new Blob([a.html], { type: 'text/html' })), 'text/plain': content.then(a => new Blob([a.markdown], { type: 'text/plain' })) })]);
      if (current === epoch.current) setCopied(entry.id);
    } catch { if (current === epoch.current) setError('复制失败，请先打开文章后重试，并允许 HTTPS 看板访问剪贴板。'); }
  }
  if (!userId) return null;
  const smallButton = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs disabled:cursor-wait disabled:opacity-50';
  const field = 'w-full rounded-lg border border-slate-500 bg-[#0b1d40] px-3 py-2 text-sm text-white placeholder:text-slate-400';
  return <div className="space-y-3" aria-label={`${label}分组`}>
    {tracking && <div className="space-y-4 rounded-2xl border border-cyan-800 bg-[#0b1d40] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-white">文章使用管理</h3><p className="mt-1 text-xs leading-relaxed text-slate-300">按状态找文章，已使用的图文仍可随时查阅。</p></div><button type="button" disabled={listLoading || Object.values(saving).some(Boolean)} className={`${smallButton} border-slate-500 text-slate-200`} onClick={() => setRefresh(value => value + 1)}><RotateCcw className="size-3.5" />刷新列表</button></div>
      <div role="group" aria-label="按使用状态筛选" className="flex flex-wrap gap-2">{(['unused', 'pending', 'used', 'all'] as Filter[]).map(value => <button key={value} type="button" aria-pressed={filter === value} className={`${smallButton} ${filter === value ? 'border-cyan-400 bg-cyan-900 font-semibold text-white' : 'border-slate-600 text-slate-300 hover:bg-white/5'}`} onClick={() => setFilter(value)}>{value === 'all' ? '全部' : statusLabels[value]}<span className="tabular-nums">{value === 'all' ? entries.length : counts[value]}</span></button>)}</div>
      <label className="relative block"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" /><span className="sr-only">跨组搜索文章标题</span><input type="search" value={search} placeholder="搜索标题，查看这个选题是否用过" className={`${field} pl-10`} onChange={event => { setSearch(event.target.value); setSearchCollapsed({}); if (event.target.value.trim()) setFilter('all'); }} /></label>
    </div>}
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-100 p-3 text-sm text-rose-900"><span>{error}</span>{tracking && <button type="button" disabled={listLoading || Object.values(saving).some(Boolean)} className="font-semibold underline disabled:opacity-50" onClick={() => setRefresh(value => value + 1)}>刷新列表</button>}</div>}
    {notice && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-700 bg-emerald-950 p-3 text-sm text-emerald-100"><span>{notice}</span>{lastChange && <button type="button" disabled={saving[lastChange.after.id]} className="font-semibold underline disabled:opacity-50" onClick={() => void saveUsage(lastChange.after, draftOf(lastChange.before), true)}>撤销上次修改</button>}<button type="button" className="ml-auto text-xs underline" onClick={() => { setFilter('used'); setSearch(''); }}>查看已使用</button></div>}
    {listLoading && <p role="status" className="flex items-center gap-2 p-4 text-sm text-slate-300"><Loader2 className="size-4 animate-spin" />正在读取文章…</p>}
    {!listLoading && !error && !entries.length && <p className="rounded-xl border border-white/15 p-5 text-sm text-slate-300">{emptyMessage || '暂时还没有文章。'}</p>}
    {!listLoading && entries.length > 0 && !visibleGroups.length && <p className="rounded-xl border border-white/15 p-5 text-sm text-slate-300">{query ? '没有找到匹配的标题，试试其他关键词或切换状态。' : `暂时没有${filter === 'all' ? '' : statusLabels[filter]}的文章，可切换其他状态查看。`}</p>}
    {visibleGroups.map(({ name, articles, visible }) => {
      const progress = tracking ? tally(articles) : null;
      const isExpanded = query ? !searchCollapsed[name] : !!expanded[name];
      return <div key={name} className="overflow-hidden rounded-2xl border border-cyan-700 bg-[#0b1d40]" data-article-group={name}>
        <button type="button" aria-expanded={isExpanded} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-white/5" onClick={() => { if (query) setSearchCollapsed(state => ({ ...state, [name]: !state[name] })); else setExpanded(state => ({ ...state, [name]: !state[name] })); }}>
          <span className="shrink-0 rounded-full bg-cyan-900 px-2.5 py-1 text-xs text-cyan-100">{label}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-semibold text-white">{name}</span><span className="text-xs text-slate-300">{articles.length} 篇</span></span>{progress && <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="text-slate-300">未使用 {progress.unused}</span><span className="text-amber-200">待发布 {progress.pending}</span><span className="text-emerald-200">已使用 {progress.used}</span></span>}</span><ChevronDown className={`shrink-0 size-4 text-slate-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {progress && <div className="h-1 bg-slate-800" aria-label={`已使用 ${progress.used} / ${articles.length} 篇`}><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${progress.used / articles.length * 100}%` }} /></div>}
        {isExpanded && <ol className="space-y-2 border-t border-[#25426e] p-3">{visible.map(entry => {
          const draft = drafts[entry.id] ?? draftOf(entry);
          return <li key={entry.id} data-article-id={entry.id} className="rounded-xl border border-[#1f416e] bg-[#11274d] p-3 sm:p-4">
            <div className="flex flex-wrap items-start gap-3"><span className="pt-0.5 text-xs text-cyan-200">{String(entry.position).padStart(2, '0')}</span><button type="button" className="min-w-0 flex-1 text-left text-sm font-semibold leading-relaxed text-white hover:text-cyan-200" onClick={() => void preview(entry.id)}>{entry.title}</button>{tracking && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusColors[entry.usage_status]}`}>{statusLabels[entry.usage_status]}</span>}</div>
            {tracking && entry.usage_status === 'used' && <p className="mt-2 text-xs text-emerald-200">使用日期：{entry.used_on}{entry.publish_account ? ` · ${entry.publish_account}` : ''}{entry.publish_url && <> · <a href={entry.publish_url} target="_blank" rel="noopener noreferrer" className="underline">查看发布文章</a></>}</p>}
            {tracking && entry.usage_note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">备注：{entry.usage_note}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={loading[entry.id]} className={`${smallButton} border-cyan-600 text-cyan-100`} onClick={() => void copy(entry)}>{loading[entry.id] ? <Loader2 className="size-3.5 animate-spin" /> : copied === entry.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied === entry.id ? '已复制' : '复制图文'}</button>
              {tracking && <>
                {entry.usage_status !== 'used' && <button type="button" disabled={saving[entry.id]} className={`${smallButton} border-emerald-500 bg-emerald-900 text-emerald-50`} onClick={() => void mark(entry, 'used')}>{saving[entry.id] ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}标记已使用</button>}
                {entry.usage_status === 'unused' ? <button type="button" disabled={saving[entry.id]} className={`${smallButton} border-amber-600 text-amber-100`} onClick={() => void mark(entry, 'pending')}>设为待发布</button> : <button type="button" disabled={saving[entry.id]} className={`${smallButton} border-slate-500 text-slate-200`} onClick={() => void mark(entry, 'unused')}>改为未使用</button>}
                <button type="button" disabled={saving[entry.id]} aria-expanded={!!editing[entry.id]} className={`${smallButton} border-slate-500 text-slate-200`} onClick={() => edit(entry)}>使用记录</button>
              </>}
            </div>
            {tracking && editing[entry.id] && <form aria-label={`${entry.title}的使用记录`} className="mt-4 space-y-3 rounded-xl border border-slate-600 bg-[#0b1d40] p-3 sm:p-4" onSubmit={event => { event.preventDefault(); void saveUsage(entry, draft); }}><fieldset disabled={saving[entry.id]} className="space-y-3 disabled:opacity-60">
              <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs text-slate-300">使用状态<select className={`${field} mt-1`} value={draft.usage_status} onChange={event => { const status = event.target.value as UsageStatus; changeDraft(entry, { usage_status: status, used_on: status === 'used' ? draft.used_on || beijingToday() : null }); }}><option value="unused">未使用</option><option value="pending">待发布</option><option value="used">已使用</option></select></label>{draft.usage_status === 'used' && <label className="block text-xs text-slate-300">使用日期<input type="date" required className={`${field} mt-1 [color-scheme:dark]`} value={draft.used_on || beijingToday()} onChange={event => changeDraft(entry, { used_on: event.target.value })} /></label>}</div>
              <label className="block text-xs text-slate-300">发布账号（选填）<input className={`${field} mt-1`} value={draft.publish_account} maxLength={100} placeholder="例如：我的公众号" onChange={event => changeDraft(entry, { publish_account: event.target.value })} /></label>
              <label className="block text-xs text-slate-300">发布链接（选填）<input type="url" className={`${field} mt-1`} value={draft.publish_url} maxLength={2000} placeholder="https://mp.weixin.qq.com/…" onChange={event => changeDraft(entry, { publish_url: event.target.value })} /></label>
              <label className="block text-xs text-slate-300">备注（选填）<textarea className={`${field} mt-1 min-h-20 resize-y`} value={draft.usage_note} maxLength={1000} placeholder="记录修改要点、发布情况等" onChange={event => changeDraft(entry, { usage_note: event.target.value })} /></label>
              <div className="flex flex-wrap gap-2"><button type="submit" className={`${smallButton} border-cyan-400 bg-cyan-900 text-white`}>{saving[entry.id] && <Loader2 className="size-3.5 animate-spin" />}保存记录</button><button type="button" className={`${smallButton} border-slate-500 text-slate-200`} onClick={() => setEditing(state => ({ ...state, [entry.id]: false }))}>取消编辑</button></div>
            </fieldset></form>}
            {selected[entry.id] && <div className="mt-4 rounded-xl bg-white p-2 sm:p-4">{contents[entry.id] ? <iframe title={entry.title} sandbox="" srcDoc={contents[entry.id].html} className="h-[75vh] w-full border-0" /> : <p className="p-4 text-sm text-slate-700">{loading[entry.id] ? '正在加载图文…' : '读取未完成，请重试。'}</p>}</div>}
          </li>;
        })}</ol>}
      </div>;
    })}
  </div>;
}
