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
  area: '工作' | '副业' | '身体';
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

export const initialGoals: Goal[] = [
  { id: 'g1', area: '副业', title: '自媒体稳定盈利', metric: '月利润', current: 860, target: 2000, unit: '元/月', startedAt: '2026-08-31', deadline: '2026-11-29', status: '进行中' },
  { id: 'g2', area: '副业', title: '网盘拉新稳定盈利', metric: '月利润', current: 420, target: 1000, unit: '元/月', startedAt: '2026-08-31', deadline: '2026-10-30', status: '进行中' },
  { id: 'g3', area: '身体', title: '完成身体阶段目标', metric: '体重 / 体脂率', current: null, target: null, unit: '待设定', startedAt: '2026-08-31', deadline: '2027-02-28', status: '进行中' },
];

export const demoProducts: WorkProduct[] = [
  { id: 'p1', name: '厨房收纳架', category: '家居收纳', margin: 31.8, supplyChain: '2 家已报价', patent: '初筛通过', reviews: '差评痛点 4 个', stage: '供应链核价', status: '进行中' },
  { id: 'p2', name: '宠物慢食碗', category: '宠物用品', margin: 28.5, supplyChain: '待寄样', patent: '人工审查中', reviews: '高频需求 3 个', stage: '专利审查', status: '待确认' },
  { id: 'p3', name: '旅行分装瓶', category: '旅行配件', margin: 34.2, supplyChain: '成本可控', patent: '低风险', reviews: '漏液是核心痛点', stage: '评论分析', status: '机会品' },
];

export const demoProfits: ProfitLog[] = [
  { id: 'r1', project: '自媒体', platform: '小红书', week: '08/03', revenue: 180, cost: 30, profit: 150 },
  { id: 'r2', project: '自媒体', platform: '抖音', week: '08/10', revenue: 300, cost: 60, profit: 240 },
  { id: 'r3', project: '网盘拉新', platform: '夸克网盘', week: '08/17', revenue: 260, cost: 20, profit: 240 },
  { id: 'r4', project: '自媒体', platform: 'YouTube', week: '08/24', revenue: 510, cost: 40, profit: 470 },
  { id: 'r5', project: '网盘拉新', platform: '百度网盘', week: '08/31', revenue: 420, cost: 60, profit: 360 },
];

export const demoHealth: HealthLog[] = [
  { id: 'h1', date: '08/03', weight: 72.8, bodyFat: 23.4, workouts: 2 },
  { id: 'h2', date: '08/10', weight: 72.2, bodyFat: 22.9, workouts: 3 },
  { id: 'h3', date: '08/17', weight: 71.7, bodyFat: 22.5, workouts: 3 },
  { id: 'h4', date: '08/24', weight: 71.4, bodyFat: 22.1, workouts: 4 },
  { id: 'h5', date: '08/31', weight: 71.1, bodyFat: 21.8, workouts: 3 },
];

export const demoFinance: FinanceLog[] = [
  { id: 'f1', date: '08/03', type: '收入', category: '工资', amount: 12000, note: '本月工资' },
  { id: 'f2', date: '08/08', type: '支出', category: '居住', amount: 2600, note: '房租与水电' },
  { id: 'f3', date: '08/15', type: '支出', category: '餐饮', amount: 980, note: '日常餐饮' },
  { id: 'f4', date: '08/23', type: '收入', category: '副业', amount: 860, note: '内容与拉新收入' },
  { id: 'f5', date: '08/29', type: '支出', category: '学习', amount: 299, note: '课程与书籍' },
];

export const demoBooks: Book[] = [
  { id: 'b1', title: '纳瓦尔宝典', author: '埃里克·乔根森', status: '已读', progress: 100, rating: 4.5, notes: '关于财富、判断力与长期主义。', finishedAt: '2026-08-12' },
  { id: 'b2', title: '定位', author: '艾·里斯 / 杰克·特劳特', status: '在读', progress: 62, rating: null, notes: '结合产品开发和内容账号定位做笔记。' },
  { id: 'b3', title: '掌控习惯', author: '詹姆斯·克利尔', status: '想读', progress: 0, rating: null, notes: '为健身与内容发布建立稳定系统。' },
];
