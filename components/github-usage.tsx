import { ArrowUpRight, Sparkles, Star, TrendingUp } from 'lucide-react';
import { githubUsageEdition, type GithubPick } from '@/lib/github-usage-data';

const number = new Intl.NumberFormat('zh-CN');

function PickCard({ pick, rank, rising }: { pick: GithubPick; rank: number; rising: boolean }) {
  return (
    <article className="group rounded-2xl border border-sky-400/20 bg-[#102450]/85 p-4 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-cyan-300/60 hover:bg-[#163064] sm:p-5">
      <div className="flex flex-wrap items-start gap-3 sm:gap-4">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl border text-sm font-black ${rank === 1 ? 'border-amber-200/60 bg-gradient-to-br from-amber-300 to-orange-500 text-[#38220a]' : 'border-sky-300/25 bg-[#223c78] text-sky-100'}`}>
          {String(rank).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="break-all text-base font-bold text-white sm:text-lg">{pick.name}</h3>
            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2.5 py-0.5 text-xs text-cyan-100">{pick.audience}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
            <span className="inline-flex items-center gap-1.5 text-sky-100"><Star className="size-4 text-amber-300" /> {number.format(pick.stars)} 星</span>
            <span className={rising ? 'text-pink-300' : 'text-slate-300'}>
              上周新增 {pick.weeklyGain == null ? '统计中' : `+${number.format(pick.weeklyGain)}`}
            </span>
          </div>
        </div>
        <a href={pick.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20" aria-label={`打开 ${pick.name} 的 GitHub 仓库`}>
          仓库地址 <ArrowUpRight className="size-4" />
        </a>
      </div>
      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
        <p className="text-sm leading-6 text-slate-200"><span className="mb-1 block text-xs font-bold tracking-wider text-cyan-300">主要功能</span>{pick.functionZh}</p>
        <p className="text-sm leading-6 text-slate-200"><span className="mb-1 block text-xs font-bold tracking-wider text-amber-300">为什么值得关注</span>{pick.reasonZh}</p>
      </div>
    </article>
  );
}

export function GithubUsageView() {
  const edition = githubUsageEdition;
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#284d9a] bg-[#061432] text-white shadow-[0_20px_60px_rgba(15,31,72,.22)]">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_0%,#2556ae_0%,transparent_42%),radial-gradient(circle_at_10%_10%,#143a7d_0%,transparent_42%)] px-5 pb-6 pt-8 sm:px-8 sm:pt-10">
        <div className="pointer-events-none absolute right-[-50px] top-[-90px] size-72 rounded-full border border-sky-300/20" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[.18em] text-cyan-200"><Star className="size-4" /> RYAN'S GITHUB PICKS</div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">GitHub <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300 bg-clip-text text-transparent">使用精选</span></h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">每周三、周五更新。4 个近期飙升项目，加上 3 个高星实用项目；优先看功能和使用价值。</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-sky-100">
            <span className="rounded-full border border-sky-200/20 bg-white/10 px-3 py-1.5">更新：{edition.publishedAt}</span>
            <span className="rounded-full border border-sky-200/20 bg-white/10 px-3 py-1.5">周增长统计：{edition.growthWindow}</span>
          </div>
        </div>
      </div>
      <div className="space-y-9 px-4 pb-8 sm:px-8">
        <section aria-labelledby="rising-heading">
          <div className="mb-4 flex items-center gap-2"><TrendingUp className="size-5 text-pink-300" /><h2 id="rising-heading" className="text-xl font-bold">近期飙升 · 4 个</h2></div>
          <div className="space-y-3">{edition.rising.map((pick, index) => <PickCard key={pick.url} pick={pick} rank={index + 1} rising />)}</div>
        </section>
        <section aria-labelledby="established-heading">
          <div className="mb-4 flex items-center gap-2"><Sparkles className="size-5 text-amber-300" /><h2 id="established-heading" className="text-xl font-bold">高星精选 · 3 个</h2></div>
          <div className="space-y-3">{edition.established.map((pick, index) => <PickCard key={pick.url} pick={pick} rank={index + 1} rising={false} />)}</div>
        </section>
        <p className="rounded-xl border border-sky-300/15 bg-white/5 p-3 text-xs leading-5 text-slate-300">
          总星数核对自各项目 GitHub 仓库；飙升组的上周新增来自 <a className="text-cyan-200 underline" href={edition.risingSource} target="_blank" rel="noopener noreferrer">OpenGithubs 周榜</a>。高星组将在积累一周历史数据后显示同口径增长，未核实的数字不会估算。
        </p>
      </div>
    </div>
  );
}

