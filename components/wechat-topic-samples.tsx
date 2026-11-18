'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

type Sample = { id: string; topic_no: number; title: string; markdown: string; html: string };
const names = [
  '夫妻相处', '中年婚姻危机', '晚年爱情与再婚', '父母与成年子女', '父亲的情感', '母亲与女儿',
  '父亲与儿子', '婆媳与岳婿', '兄弟姐妹', '祖孙关系', '带娃与家庭分工', '孩子成长',
  '金钱与亲情', '疾病与照顾', '丧失与告别', '友情与同学情', '邻里与熟人社会',
  '退休与自我价值', '独居与自由', '家庭秘密与反转', '家庭喜事与仪式', '重新选择人生',
];

export function WechatTopicSamples({ userId }: { userId: string | null }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const client = getSupabase();
    if (!client) return;
    void client.from('wechat_topic_samples').select('id,topic_no,title,markdown,html')
      .eq('user_id', userId).order('topic_no', { ascending: true })
      .then(({ data, error: loadError }) => {
        if (!alive) return;
        if (loadError) setError('选题库暂时无法读取，请稍后刷新。');
        else { setSamples((data ?? []) as Sample[]); setError(''); }
      });
    return () => { alive = false; };
  }, [userId]);

  async function copySample(sample: Sample) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([sample.html], { type: 'text/html' }),
        'text/plain': new Blob([sample.markdown], { type: 'text/plain' }),
      })]);
      setCopiedId(sample.id);
      setError('');
      window.setTimeout(() => setCopiedId(null), 2500);
    } catch { setError('复制失败。请使用 HTTPS 打开看板，并允许浏览器访问剪贴板。'); }
  }

  return <div className="overflow-hidden rounded-2xl border border-[#25426e] bg-[#0b1d40]">
    <button type="button" aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5" onClick={() => { setExpanded(!expanded); setSelectedId(null); }}>
      <span className="rounded-full bg-violet-800 px-2.5 py-1 text-xs font-semibold text-violet-100">选题库</span>
      <span className="text-sm font-semibold">22 个情感选题，每题 1 篇试稿</span>
      <span className="text-xs text-slate-400">{samples.length} 篇文章</span>
      <ChevronDown className={`ml-auto size-4 text-cyan-100 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
    {expanded && <div className="space-y-2 border-t border-[#25426e] p-3 sm:p-4">
      {error && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
      {!userId && <p className="p-3 text-sm text-slate-300">登录后查看选题库。</p>}
      {userId && samples.length === 0 && !error && <p className="p-3 text-sm text-slate-300">试稿准备中。</p>}
      {samples.map((sample) => <div key={sample.id} className="rounded-xl border border-[#1f416e] bg-[#11274d] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="rounded-full bg-[#244b98] px-2 py-1 text-xs font-bold text-cyan-100">{String(sample.topic_no).padStart(2, '0')}</span>
          <span className="text-xs text-slate-400">{names[sample.topic_no - 1]}</span>
          <button type="button" className="min-w-0 flex-1 text-left text-sm font-semibold leading-relaxed text-white hover:text-cyan-200" onClick={() => setSelectedId(selectedId === sample.id ? null : sample.id)}>{sample.title}</button>
          <button type="button" onClick={() => void copySample(sample)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-600 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-900/50">
            {copiedId === sample.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copiedId === sample.id ? '已复制' : '复制图文'}
          </button>
        </div>
        {selectedId === sample.id && <div className="mt-4 overflow-hidden rounded-xl bg-white p-2 sm:p-4"><iframe title={sample.title} sandbox="" srcDoc={sample.html} className="h-[75vh] w-full border-0" /></div>}
      </div>)}
    </div>}
  </div>;
}
