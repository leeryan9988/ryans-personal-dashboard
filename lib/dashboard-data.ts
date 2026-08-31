export type WorkProduct = {
  id: string;
  name: string;
  category: string;
  margin: number;
  supplyChain: string;
  patent: string;
  reviews: string;
  stage: string;
  status: string;
};

export type ProfitLog = {
  id: string;
  project: '自媒体' | '网盘拉新' | '抖音电商';
  platform: string;
  week: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type HealthLog = {
  id: string;
  date: string;
  weight: number;
  bodyFat: number;
  workouts: number;
};

export type Goal = {
  id: string;
  area: '工作' | '副业' | '身体' | '个人财务' | '读书清单';
  title: string;
  metric: string;
  current: number | null;
  target: number | null;
  unit: string;
  startedAt: string;
  deadline: string;
  status: '进行中' | '已达成' | '已归档';
  result?: string;
};

export type FinanceLog = {
  id: string;
  date: string;
  type: '收入' | '支出';
  category: string;
  amount: number;
  note: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  status: '想读' | '在读' | '已读';
  progress: number;
  rating: number | null;
  notes: string;
  finishedAt?: string;
};

export const initialGoals: Goal[] = [];
export const initialProducts: WorkProduct[] = [];
export const initialProfits: ProfitLog[] = [];
export const initialHealth: HealthLog[] = [];
export const initialFinance: FinanceLog[] = [];
export const initialBooks: Book[] = [];
