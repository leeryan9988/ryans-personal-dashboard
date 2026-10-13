import type {
  Book,
  FinanceLog,
  Goal,
  HealthLog,
  PlanNote,
  ProfitLog,
  WeeklyReflection,
  WorkProduct,
} from './dashboard-data';
import { githubUsageEditions } from './github-usage-data';

export type DashboardSearchResult = {
  id: string;
  area: string;
  title: string;
  detail: string;
};

export function matchesDashboardSearch(query: string, ...values: unknown[]) {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const text = values.filter((value) => value != null).join(' ').toLocaleLowerCase();
  return tokens.every((token) => text.includes(token));
}

export function searchDashboardData(
  query: string,
  data: {
    products: WorkProduct[];
    goals: Goal[];
    profits: ProfitLog[];
    health: HealthLog[];
    finance: FinanceLog[];
    books: Book[];
    reflections: WeeklyReflection[];
    planNotes: PlanNote[];
    countdowns: { id: string; title: string; note: string; targetDate: string }[];
  },
  currentArea: string,
): DashboardSearchResult[] {
  if (!query.trim()) return [];
  const results: DashboardSearchResult[] = [];
  const add = (area: string, id: string, title: string, detail: string, ...values: unknown[]) => {
    if (matchesDashboardSearch(query, title, detail, ...values))
      results.push({ area, id, title, detail });
  };
  data.products.forEach((item) => add('工作', item.id, item.name, item.category, item.stage, item.status, item.supplyChain, item.patent, item.reviews));
  data.goals.forEach((item) => add(item.area, item.id, item.title, `目标 · ${item.metric}`, item.status, item.result));
  data.profits.forEach((item) => add('副业', item.id, `${item.project} · ${item.platform}`, item.week, item.note));
  data.health.forEach((item) => add('身体', item.id, `体重 ${item.weight} kg`, item.date, item.bodyFat));
  data.finance.forEach((item) => add('个人财务', item.id, `${item.type} · ${item.category}`, item.date, item.amount, item.note));
  data.books.forEach((item) => add('读书清单', item.id, item.title, item.author, item.category, item.status, item.notes));
  data.reflections.forEach((item) => add(item.area, item.id, '每周复盘', item.weekStart, item.review, item.insight));
  data.planNotes.forEach((item) => add('计划和感悟', item.id, item.title || '未命名记录', `${item.noteDate} · ${item.category} · ${item.content.slice(0, 80)}`, item.content));
  data.countdowns.forEach((item) => add('总目标', item.id, item.title, `倒计时 · ${item.targetDate}`, item.note));
  githubUsageEditions.forEach((edition) => {
    [...edition.rising, ...edition.established].forEach((pick) =>
      add('github使用', `${edition.publishedAtIso}:${pick.url}`, pick.name, `${edition.publishedAt} · ${pick.audience}`, pick.functionZh, pick.reasonZh),
    );
  });
  return results.filter((result) =>
    result.area === currentArea ||
    (currentArea === '总目标' && data.goals.some((goal) => goal.id === result.id)),
  );
}
