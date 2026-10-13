import { ArrowUpRight, ChevronDown, Sparkles, Star, TrendingUp } from 'lucide-react';
import { githubUsageEditions, type GithubPick, type GithubUsageEdition } from '@/lib/github-usage-data';
import { matchesDashboardSearch } from '@/lib/dashboard-search';

const number = new Intl.NumberFormat('zh-CN');

function PickRow({ pick, rank, rising }: { pick: GithubPick; rank: number; rising: boolean }) {
  return (
    <article className="rounded-xl border border-sky-400/20 bg-[#102450]/85 px-3 py-2.5 transition hover:border-cyan-300/60 hover:bg-[#163064] sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={rank === 1 ? 'grid size-7 shrink-0 place-items-center rounded-lg bg-amber-400 text-xs font-black text-[#38220a]' : 'grid size-7 shrink-0 place-items-center rounded-lg bg-[#223c78] text-xs font-bold text-sky-100'}>
          {String(rank).padStart(2, '0')}
        </span>
        <h4 className="min-w-0 break-all text-sm font-bold text-white sm:text-base">{pick.name}</h4>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-0.5 text-[11px] text-cyan-100">{pick.audience}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold sm:ml-auto">
          <span className="inline-flex items-center gap-1 text-sky-100"><Star className="size-3.5 text-amber-300" />{number.format(pick.stars)} 星</span>
          {pick.weeklyGain != null && <span className={rising ? 'text-pink-300' : 'text-slate-300'}>上周新增 +{number.format(pick.weeklyGain)}</span>}
          <a href={pick.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-cyan-200 underline-offset-2 hover:underline" aria-label={'打开 ' + pick.name + ' 的 GitHub 仓库'}>
            仓库地址 <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
      <div className="mt-2 grid gap-x-5 gap-y-1 border-t border-white/10 pt-2 text-xs leading-5 text-slate-200 sm:grid-cols-2">
        <p><span className="mr-1 font-bold text-cyan-300">功能</span>{pick.functionZh}</p>
        <p><span className="mr-1 font-bold text-amber-300">值得关注</span>{pick.reasonZh}</p>
      </div>
    </article>
  );
}

function EditionContent({ edition }: { edition: GithubUsageEdition }) {
  return (
    <div className="space-y-5 border-t border-sky-300/15 px-3 py-4 sm:px-5">
      <section>
        <div className="mb-2 flex items-center gap-2"><TrendingUp className="size-4 text-pink-300" /><h3 className="text-base font-bold">近期飙升 · {edition.rising.length} 个</h3></div>
        <div className="space-y-2">{edition.rising.map((pick, index) => <PickRow key={pick.url} pick={pick} rank={index + 1} rising />)}</div>
      </section>
      <section>
        <div className="mb-2 flex items-center gap-2"><Sparkles className="size-4 text-amber-300" /><h3 className="text-base font-bold">高星精选 · {edition.established.length} 个</h3></div>
        <div className="space-y-2">{edition.established.map((pick, index) => <PickRow key={pick.url} pick={pick} rank={index + 1} rising={false} />)}</div>
      </section>
      <p className="text-xs leading-5 text-slate-400">总星数核对自 GitHub 仓库；飙升组增长来自 <a className="text-cyan-200 underline" href={edition.risingSource} target="_blank" rel="noopener noreferrer">OpenGithubs 周榜</a>（{edition.growthWindow}）。周增长仅展示已核实的数据。</p>
    </div>
  );
}

export function GithubUsageView({ searchQuery = '' }: { searchQuery?: string }) {
  const editions = [...githubUsageEditions]
    .sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso))
    .map((edition) => ({
      ...edition,
      rising: edition.rising.filter((pick) => matchesDashboardSearch(searchQuery, pick.name, pick.audience, pick.functionZh, pick.reasonZh)),
      established: edition.established.filter((pick) => matchesDashboardSearch(searchQuery, pick.name, pick.audience, pick.functionZh, pick.reasonZh)),
    }))
    .filter((edition) => edition.rising.length + edition.established.length > 0);
  const matchCount = editions.reduce((total, edition) => total + edition.rising.length + edition.established.length, 0);
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#284d9a] bg-[#061432] text-white shadow-[0_20px_60px_rgba(15,31,72,.22)]">
      <header className="bg-[radial-gradient(circle_at_85%_0%,#2556ae_0%,transparent_42%),radial-gradient(circle_at_10%_10%,#143a7d_0%,transparent_42%)] px-5 py-5 sm:px-8 sm:py-6">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-cyan-200"><Star className="size-3.5" />RYAN'S GITHUB PICKS</div>
        <h1 className="text-2xl font-black tracking-tight sm:text-4xl">GitHub <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-300 bg-clip-text text-transparent">使用精选</span></h1>
        <p className="mt-2 text-xs leading-5 text-slate-200 sm:text-sm">每周三、周五更新；每期 4 个近期飙升项目和 3 个高星实用项目。按时间从新到旧排列。</p>
      </header>
      <div className="space-y-2.5 p-3 sm:p-5">
        {searchQuery.trim() && <p className="text-sm text-sky-100">GitHub 精选：找到 {matchCount} 个匹配项目</p>}
        {searchQuery.trim() && matchCount === 0 && <div className="rounded-xl border border-sky-300/20 bg-[#0a1c42] p-5 text-sm text-sky-100">当前精选中没有匹配项目。<a href={`https://github.com/search?q=${encodeURIComponent(searchQuery.trim())}&type=repositories`} target="_blank" rel="noopener noreferrer" className="ml-2 text-cyan-200 underline">去 GitHub 搜索 ↗</a></div>}
        {editions.map((edition, index) => (
          <details key={edition.publishedAtIso} open={index === 0} className="group overflow-hidden rounded-xl border border-sky-300/20 bg-[#0a1c42]">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5 text-sm font-semibold marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className={index === 0 ? 'rounded-full bg-cyan-300/15 px-2 py-0.5 text-xs text-cyan-200' : 'rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300'}>{index === 0 ? '最新一期' : '往期'}</span>
              <span>{edition.publishedAt}</span>
              <span className="text-xs font-normal text-slate-400">{edition.rising.length + edition.established.length} 个项目</span>
              <ChevronDown className="ml-auto size-4 shrink-0 text-sky-200 transition group-open:rotate-180" />
            </summary>
            <EditionContent edition={edition} />
          </details>
        ))}
      </div>
    </div>
  );
}


