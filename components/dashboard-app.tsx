'use client';

import {
  Activity,
  Archive,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  Dumbbell,
  FileClock,
  BookOpen,
  CalendarDays,
  ImagePlus,
  LayoutDashboard,
  LineChart,
  LogOut,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react';
import { type SyntheticEvent, useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Line,
  Legend,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  initialBooks,
  initialFinance,
  initialHealth,
  initialProducts,
  initialProfits,
  initialGoals,
  type Book,
  type FinanceLog,
  type Goal,
  type HealthLog,
  type PlanNote,
  type ProfitLog,
  type WeeklyReflection,
  type WorkProduct,
} from '@/lib/dashboard-data';
import { getSupabase, isCloudConfigured } from '@/lib/supabase';

type Area =
  | '总目标'
  | '工作'
  | '副业'
  | '身体'
  | '个人财务'
  | '读书清单'
  | '计划和感悟';
type RecordKind =
  | '工作产品'
  | '副业利润'
  | '身体数据'
  | '财务流水'
  | '读书记录'
  | '新目标'
  | '更新目标';

function formText(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function encodeBytes(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function createHandoff() {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return { id: crypto.randomUUID(), key: encodeBytes(key) };
}

async function importHandoffKey(encoded: string) {
  return crypto.subtle.importKey('raw', decodeBytes(encoded), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function encryptSession(session: Session, encodedKey: string) {
  const key = await importHandoffKey(encodedKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
  );
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
  return `${encodeBytes(iv)}.${encodeBytes(new Uint8Array(encrypted))}`;
}

async function decryptSession(value: string, encodedKey: string) {
  const [encodedIv, encodedPayload] = value.split('.');
  if (!encodedIv || !encodedPayload) throw new Error('Invalid handoff payload');
  const key = await importHandoffKey(encodedKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBytes(encodedIv) },
    key,
    decodeBytes(encodedPayload),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as {
    access_token: string;
    refresh_token: string;
  };
}

const navigation: { label: Area; icon: typeof LayoutDashboard }[] = [
  { label: '总目标', icon: Target },
  { label: '工作', icon: BriefcaseBusiness },
  { label: '副业', icon: TrendingUp },
  { label: '身体', icon: Dumbbell },
  { label: '个人财务', icon: WalletCards },
  { label: '读书清单', icon: BookOpen },
  { label: '计划和感悟', icon: NotebookPen },
];

function currentWeekStart() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

function incomePeriodKey(dateValue: string, granularity: '日' | '周' | '月' | '季度') {
  const date = new Date(`${dateValue}T12:00:00`);
  if (granularity === '日') return dateValue;
  if (granularity === '月') return dateValue.slice(0, 7);
  if (granularity === '季度') return `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}`;
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return `${localDateString(date)} 周`;
}

export default function DashboardApp() {
  const [active, setActive] = useState<Area>('总目标');
  const [products, setProducts] = useState<WorkProduct[]>(initialProducts);
  const [profits, setProfits] = useState<ProfitLog[]>(initialProfits);
  const [health, setHealth] = useState<HealthLog[]>(initialHealth);
  const [finance, setFinance] = useState<FinanceLog[]>(initialFinance);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [planNotes, setPlanNotes] = useState<PlanNote[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [recordKind, setRecordKind] = useState<RecordKind | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isCloudConfigured);
  const [email, setEmail] = useState('');
  const [handoffPending, setHandoffPending] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [query, setQuery] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const loadCloudData = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    const [p, r, h, g, f, b, w, n] = await Promise.all([
      client.from('work_products').select('*').order('created_at'),
      client.from('profit_logs').select('*').order('week_start'),
      client.from('health_logs').select('*').order('logged_at'),
      client.from('goals').select('*').order('started_at'),
      client.from('finance_logs').select('*').order('occurred_at'),
      client.from('books').select('*').order('created_at'),
      client.from('weekly_reflections').select('*').order('week_start', { ascending: false }),
      client.from('plan_notes').select('*').order('note_date', { ascending: false }),
    ]);
    setProducts(
        (p.data ?? []).map((x) => ({
          id: x.id,
          name: x.name,
          category: x.category,
          margin: Number(x.margin),
          supplyChain: x.supply_chain,
          patent: x.patent_review,
          reviews: x.review_insights,
          stage: x.stage,
          status: x.status,
        })),
      );
    setProfits(
        (r.data ?? []).map((x) => ({
          id: x.id,
          project: x.project,
          platform: x.platform,
          week: x.week_label,
          weekStart: x.week_start,
          revenue: Number(x.revenue),
          cost: Number(x.cost),
          profit: Number(x.profit),
        })),
      );
    setHealth(
        (h.data ?? []).map((x) => ({
          id: x.id,
          date: x.date_label,
          weight: Number(x.weight),
          bodyFat: Number(x.body_fat),
          workouts: Number(x.workouts),
        })),
      );
    setGoals(
        (g.data ?? []).map((x) => ({
          id: x.id,
          area: x.area,
          title: x.title,
          metric: x.metric,
          current: x.current_value == null ? null : Number(x.current_value),
          target: x.target_value == null ? null : Number(x.target_value),
          unit: x.unit,
          startedAt: x.started_at,
          deadline: x.deadline,
          status: x.status,
          result: x.result,
        })),
      );
    setFinance(
        (f.data ?? []).map((x) => ({
          id: x.id,
          date: x.date_label,
          type: x.type,
          category: x.category,
          amount: Number(x.amount),
          note: x.note,
        })),
      );
    setBooks(
        (b.data ?? []).map((x) => ({
          id: x.id,
          title: x.title,
          author: x.author,
          status: x.status,
          progress: Number(x.progress),
          rating: x.rating == null ? null : Number(x.rating),
          notes: x.notes,
          finishedAt: x.finished_at,
        })),
      );
    setReflections((w.data ?? []).map((x) => ({
      id: x.id,
      area: x.area,
      weekStart: x.week_start,
      review: x.review_text,
      insight: x.insight_text,
    })));
    const nextNotes = (n.data ?? []).map((x) => ({
      id: x.id,
      title: x.title,
      content: x.content,
      noteDate: x.note_date,
      imagePaths: x.image_paths ?? [],
    }));
    setPlanNotes(nextNotes);
    const paths = nextNotes.flatMap((note) => note.imagePaths);
    if (paths.length) {
      const { data: signed } = await client.storage.from('journal-images').createSignedUrls(paths, 3600);
      setImageUrls(Object.fromEntries((signed ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl])));
    } else setImageUrls({});
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client || session) return;
    const stored = window.localStorage.getItem('ryan-login-handoff');
    if (!stored) return;
    let handoff: { id: string; key: string };
    try {
      handoff = JSON.parse(stored) as { id: string; key: string };
    } catch {
      window.localStorage.removeItem('ryan-login-handoff');
      return;
    }
    setHandoffPending(true);
    setAuthMessage('等待手机验证。点击手机邮件中的登录链接后，电脑会自动登录。');
    let stopped = false;
    const check = async () => {
      const { data } = await client
        .from('session_handoffs')
        .select('encrypted_session')
        .eq('id', handoff.id)
        .maybeSingle();
      if (stopped || !data?.encrypted_session) return;
      try {
        const transferred = await decryptSession(data.encrypted_session, handoff.key);
        const { error } = await client.auth.setSession(transferred);
        if (error) throw error;
        window.localStorage.removeItem('ryan-login-handoff');
        setAuthMessage('手机验证成功，电脑已登录。');
        await client.from('session_handoffs').delete().eq('id', handoff.id);
      } catch {
        setAuthMessage('跨设备登录信息无效，请重新发送登录链接。');
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 2500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [session, handoffPending]);

  useEffect(() => {
    const client = getSupabase();
    if (!client || !session) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('handoff');
    const key = params.get('handoff_key');
    if (!id || !key) return;
    const publish = async () => {
      try {
        const encrypted = await encryptSession(session, key);
        const { error } = await client
          .from('session_handoffs')
          .update({ encrypted_session: encrypted, approved_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        setAuthMessage('手机验证成功，电脑正在自动登录。');
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('handoff');
        cleanUrl.searchParams.delete('handoff_key');
        window.history.replaceState({}, '', cleanUrl.toString());
      } catch {
        setAuthMessage('手机验证成功，但同步到电脑失败，请重新尝试。');
      }
    };
    void publish();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => void loadCloudData(), 0);
    return () => window.clearTimeout(timer);
  }, [session, loadCloudData]);

  useEffect(() => {
    const client = getSupabase();
    if (!client || !session) return;
    const channel = client
      .channel(`dashboard-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_products',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profit_logs',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_logs',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'finance_logs',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${session.user.id}`,
        },
        loadCloudData,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_reflections', filter: `user_id=eq.${session.user.id}` }, loadCloudData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_notes', filter: `user_id=eq.${session.user.id}` }, loadCloudData)
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [session, loadCloudData]);

  async function sendLoginLink(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabase();
    if (!client || !email) return;
    setAuthMessage('正在发送…');
    const handoff = createHandoff();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: rowError } = await client
      .from('session_handoffs')
      .insert({ id: handoff.id, expires_at: expiresAt });
    if (rowError) {
      setAuthMessage(`创建跨设备登录失败：${rowError.message}`);
      return;
    }
    window.localStorage.setItem('ryan-login-handoff', JSON.stringify(handoff));
    const redirect = new URL(window.location.href);
    redirect.searchParams.set('handoff', handoff.id);
    redirect.searchParams.set('handoff_key', handoff.key);
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirect.toString() },
    });
    if (error) {
      window.localStorage.removeItem('ryan-login-handoff');
      await client.from('session_handoffs').delete().eq('id', handoff.id);
      setAuthMessage(error.message);
      return;
    }
    setHandoffPending(true);
    setAuthMessage('登录链接已发送。请在手机邮箱点击链接，电脑会自动登录。');
  }

  async function syncNotion() {
    const client = getSupabase();
    if (!client || !session) {
      setSyncMessage('请先连接云端并登录');
      return;
    }
    setSyncMessage('正在同步 Notion…');
    const { data, error } = await client.functions.invoke('notion-sync');
    setSyncMessage(
      error || !data?.ok
        ? (data?.error ?? error?.message ?? '同步失败')
        : 'Notion 已更新',
    );
    window.setTimeout(() => setSyncMessage(''), 4000);
  }

  async function saveReflection(area: Area, weekStart: string, review: string, insight: string) {
    const client = getSupabase();
    if (!client || !session) return '请先登录';
    const { error } = await client.from('weekly_reflections').upsert({
      user_id: session.user.id,
      area,
      week_start: weekStart,
      review_text: review,
      insight_text: insight,
    }, { onConflict: 'user_id,area,week_start' });
    if (error) return error.message;
    await loadCloudData();
    return '已保存';
  }

  if (!authReady)
    return (
      <CenteredMessage title="正在确认登录状态" detail="连接你的云端数据…" />
    );
  if (isCloudConfigured && !session)
    return (
      <Login
        email={email}
        setEmail={setEmail}
        handoffPending={handoffPending}
        message={authMessage}
        submit={sendLoginLink}
      />
    );

  const currentGoals = goals.filter((goal) => goal.status === '进行中');
  const archivedGoals = goals.filter((goal) => goal.status !== '进行中');
  const filteredProducts = products.filter((row) =>
    `${row.name}${row.category}${row.stage}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#eef7ff] text-[#18221d]">
      <Sidebar active={active} setActive={setActive} session={session} />
      <div className="lg:pl-[232px]">
        <Header
          query={query}
          setQuery={setQuery}
          session={session}
          onAdd={() => setRecordKind('工作产品')}
          onNotionSync={syncNotion}
          syncMessage={syncMessage}
        />
        <div className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
          {!isCloudConfigured && <CloudSetupBanner />}
          {active === '总目标' && (
            <TotalGoalsView goals={goals} openRecord={setRecordKind} onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }} />
          )}
          {active === '工作' && (
            <WorkView
              products={filteredProducts}
              goals={currentGoals.filter((goal) => goal.area === '工作')}
              history={archivedGoals.filter((goal) => goal.area === '工作')}
              openRecord={setRecordKind}
              onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }}
            />
          )}
          {active === '副业' && (
            <SideView
              profits={profits}
              goals={currentGoals.filter((goal) => goal.area === '副业')}
              history={archivedGoals.filter((goal) => goal.area === '副业')}
              openRecord={setRecordKind}
              onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }}
            />
          )}
          {active === '身体' && (
            <HealthView
              health={health}
              goals={currentGoals.filter((item) => item.area === '身体')}
              history={archivedGoals.filter((goal) => goal.area === '身体')}
              openRecord={setRecordKind}
              onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }}
            />
          )}
          {active === '个人财务' && (
            <FinanceView
              logs={finance}
              goals={currentGoals.filter((goal) => goal.area === '个人财务')}
              history={archivedGoals.filter((goal) => goal.area === '个人财务')}
              openRecord={setRecordKind}
              onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }}
            />
          )}
          {active === '读书清单' && (
            <ReadingView
              books={books}
              goals={currentGoals.filter((goal) => goal.area === '读书清单')}
              history={archivedGoals.filter((goal) => goal.area === '读书清单')}
              openRecord={setRecordKind}
              onEditGoal={(goal) => { setEditingGoal(goal); setRecordKind('更新目标'); }}
            />
          )}
          {active === '计划和感悟' && (
            <PlanAndReflectionView
              notes={planNotes}
              imageUrls={imageUrls}
              session={session}
              onSaved={loadCloudData}
            />
          )}
          <WeeklyReflectionPanel
            area={active}
            records={reflections.filter((item) => item.area === active)}
            onSave={saveReflection}
          />
        </div>
        <MobileNav active={active} setActive={setActive} />
      </div>
      {recordKind && (
        <RecordDialog
          kind={recordKind}
          close={() => { setRecordKind(null); setEditingGoal(null); }}
          products={products}
          setProducts={setProducts}
          profits={profits}
          setProfits={setProfits}
          health={health}
          setHealth={setHealth}
          finance={finance}
          setFinance={setFinance}
          books={books}
          setBooks={setBooks}
          goals={goals}
          setGoals={setGoals}
          session={session}
          editingGoal={editingGoal}
        />
      )}
    </main>
  );
}

function Header({
  query,
  setQuery,
  session,
  onAdd,
  onNotionSync,
  syncMessage,
}: {
  query: string;
  setQuery: (v: string) => void;
  session: Session | null;
  onAdd: () => void;
  onNotionSync: () => void;
  syncMessage: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#d9e9f7] bg-[#eef7ff]/90 px-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="grid size-9 place-items-center rounded-xl bg-[#153e32] text-[#d9f99d]">
          <Target className="size-4" />
        </div>
        <span className="font-semibold">Ryan's 个人看板</span>
      </div>
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87928b]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-xl border border-[#dfe5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f8f80]"
          placeholder="搜索产品、目标或记录"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-[#dfe5df] bg-white px-3 py-1.5 text-xs text-[#647168] sm:flex">
          <RefreshCw className="size-3" />{' '}
          {syncMessage || (session ? '实时同步中' : '等待接入云端')}
        </span>
        <button
          onClick={onNotionSync}
          title="把当前阶段摘要同步到 Notion"
          className="hidden h-9 items-center gap-1.5 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-medium text-[#506158] md:flex"
        >
          <NotebookPen className="size-3.5" /> Notion
        </button>
        <button
          onClick={onAdd}
          className="hidden h-9 items-center gap-2 rounded-xl bg-[#153e32] px-3 text-xs font-medium text-white sm:flex"
        >
          <Plus className="size-3.5" /> 新增记录
        </button>
        <div className="grid size-9 place-items-center rounded-full bg-[#e0ebe5] text-sm font-semibold text-[#153e32]">
          我
        </div>
      </div>
    </header>
  );
}

function Sidebar({
  active,
  setActive,
  session,
}: {
  active: Area;
  setActive: (area: Area) => void;
  session: Session | null;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[#183866] bg-[#102a56] text-white lg:flex">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid size-10 place-items-center rounded-xl bg-[#b9dcff] text-[#102a56]">
          <Target className="size-5" />
        </div>
        <div>
          <div className="font-semibold tracking-tight">Ryan's 个人看板</div>
          <div className="text-xs text-white/55">记录 · 分析 · 达标</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 pt-5">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActive(label)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active === label ? 'bg-white/12 text-white' : 'text-white/60 hover:bg-white/7 hover:text-white'}`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/8 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-[#b9dcff]">
          <Sparkles className="size-3.5" /> 本周复盘
        </div>
        <p className="text-sm leading-6 text-white/80">
          用真实记录判断进度，目标达成后再与你商定下一阶段。
        </p>
      </div>
      <button
        onClick={() => getSupabase()?.auth.signOut()}
        disabled={!session}
        className="m-3 flex items-center gap-3 px-3 py-2 text-sm text-white/50 disabled:opacity-30"
      >
        <LogOut className="size-4" />
        退出登录
      </button>
    </aside>
  );
}

function CloudSetupBanner() {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#dbcfa8] bg-[#fff9e8] px-4 py-3 text-sm sm:flex-row sm:items-center">
      <div className="flex items-start gap-2">
        <Database className="mt-0.5 size-4 text-[#8a6c1d]" />
        <div>
          <b>当前为空白看板</b>
          <span className="ml-2 text-[#756c52]">
            可先规划目标；接入 Supabase 后，记录将在不同设备间实时同步。
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-[#876b1d]">没有演示数据</span>
    </div>
  );
}

const goalAreas: Goal['area'][] = ['工作', '副业', '身体', '个人财务', '读书清单'];
const chartColors = ['#2f6d57', '#c8753b', '#7d65a7', '#d6a63f', '#5d7fa3'];

function TotalGoalsView({
  goals,
  openRecord,
  onEditGoal,
}: {
  goals: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const completed = goals.filter((goal) => goal.status === '已达成').length;
  const activeGoals = goals.filter((goal) => goal.status === '进行中');
  const overall = goals.length ? Math.round((completed / goals.length) * 100) : 0;
  const statusData = [
    { name: '进行中', value: activeGoals.length },
    { name: '已达成', value: completed },
    { name: '已归档', value: goals.filter((goal) => goal.status === '已归档').length },
  ].filter((item) => item.value > 0).map((item, index) => ({ ...item, fill: chartColors[index] }));
  const areaData = goalAreas.map((area) => {
    const rows = goals.filter((goal) => goal.area === area);
    const progress = rows.length
      ? Math.round(
          rows.reduce((sum, goal) => {
            if (goal.status === '已达成') return sum + 100;
            if (goal.target && goal.current != null)
              return sum + Math.min(100, (goal.current / goal.target) * 100);
            return sum;
          }, 0) / rows.length,
        )
      : 0;
    return { area, progress, count: rows.length };
  });

  return (
    <>
      <PageIntro
        eyebrow="总目标"
        title="所有目标的总体达成情况"
        detail="集中查看各目标板块的目标数量、平均进度和状态分布；具体分析与历史仍保留在各自板块。"
        action="设立新目标"
        onAction={() => openRecord('新目标')}
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric label="总体达成率" value={`${overall}%`} note="按已达成目标数量计算" />
        <Metric label="进行中" value={`${activeGoals.length} 个`} note="跨板块汇总" />
        <Metric label="累计目标" value={`${goals.length} 个`} note="包含达成和归档历史" />
      </section>
      <section className="mb-5 grid gap-5 lg:grid-cols-2">
        <ChartCard title="目标状态分布" detail="进行中、已达成与已归档">
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4} label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartEmpty label="设立目标后显示状态分布" />}
        </ChartCard>
        <ChartCard title="各板块平均进度" detail="按目标当前值与目标值计算">
          {goals.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <ReBarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
                <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="progress" name="平均进度 %" fill="#2f6d57" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty label="设立目标后显示板块进度" />}
        </ChartCard>
      </section>
      <AreaGoalSection area="全部" goals={activeGoals} history={goals.filter((goal) => goal.status !== '进行中')} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function AreaGoalSection({
  area,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  area: Goal['area'] | '全部';
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-[#dfe5df] bg-white p-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">{area === '全部' ? '目标清单与历史' : `${area} · 目标与历史`}</h2>
          <p className="text-xs text-[#7b887f]">达成后保留结果和周期，新目标由你确认后继续建立</p>
        </div>
        <button onClick={() => openRecord('新目标')} className="rounded-xl bg-[#153e32] px-3 py-2 text-xs font-medium text-white">新增目标</button>
      </div>
      {goals.length ? (
        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={() => onEditGoal(goal)} />)}
        </div>
      ) : <p className="mb-5 rounded-xl bg-[#f6f7f4] px-4 py-6 text-center text-sm text-[#7b887f]">还没有进行中的目标</p>}
      <div className="border-t border-[#edf0ec] pt-4">
        <h3 className="mb-3 text-sm font-semibold">历史记录</h3>
        {history.length ? (
          <div className="space-y-2">
            {history.map((goal) => (
              <div key={goal.id} className="flex flex-col justify-between gap-2 rounded-xl bg-[#fafbf9] px-4 py-3 text-sm sm:flex-row sm:items-center">
                <div><b>{goal.title}</b><p className="mt-1 text-xs text-[#7b887f]">{goal.startedAt} — {goal.deadline}{goal.result ? ` · ${goal.result}` : ''}</p></div>
                <span className="w-fit rounded-full bg-[#e9f4ed] px-2.5 py-1 text-xs text-[#286444]">{goal.status}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[#7b887f]">达成或归档后的目标会保留在这里。</p>}
      </div>
    </section>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return <div className="grid h-[250px] place-items-center rounded-xl bg-[#fafbf9] text-sm text-[#7b887f]">{label}</div>;
}

function _Overview({
  products,
  profits,
  health,
  goals,
  monthProfit,
  openRecord,
  setActive,
}: {
  products: WorkProduct[];
  profits: ProfitLog[];
  health: HealthLog[];
  goals: Goal[];
  monthProfit: number;
  openRecord: (k: RecordKind) => void;
  setActive: (a: Area) => void;
}) {
  const latestHealth = health.at(-1);
  const previousProfit = profits
    .slice(0, -2)
    .reduce((sum, item) => sum + item.profit, 0);
  const recentProfit = profits
    .slice(-2)
    .reduce((sum, item) => sum + item.profit, 0);
  return (
    <>
      <PageIntro
        eyebrow="2026 · 第 36 周"
        title="用记录看清进度，用结果推动下一目标。"
        detail="所有汇总、趋势和判断都来自你的真实记录；历史数据永久保留。"
        action="新增记录"
        onAction={() => openRecord('副业利润')}
      />
      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={BriefcaseBusiness}
          tone="work"
          label="工作 · 产品池"
          value={`${products.length} 个候选产品`}
          meta={`${products.filter((x) => x.margin >= 30).length} 个毛利率达到 30%+`}
          progress={68}
        />
        <SummaryCard
          icon={CircleDollarSign}
          tone="side"
          label="副业 · 累计利润"
          value={`¥${monthProfit.toLocaleString()}`}
          meta={
            recentProfit >= previousProfit
              ? '最近两周贡献正在提升'
              : '最近两周增速需要关注'
          }
          progress={Math.min(100, Math.round(monthProfit / 30))}
        />
        <SummaryCard
          icon={Activity}
          tone="health"
          label="身体 · 最近记录"
          value={latestHealth ? `${latestHealth.weight} kg` : '待记录'}
          meta={
            latestHealth
              ? `体脂率 ${latestHealth.bodyFat}% · 本周 ${latestHealth.workouts} 练`
              : '设置当前值与目标值'
          }
          progress={22}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.2fr_.9fr]">
        <GoalPulse goals={goals} onArchive={() => setActive('总目标')} />
        <AnalysisPanel products={products} profits={profits} health={health} />
      </section>
      <section className="mt-5 rounded-2xl border border-[#dfe5df] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0ec] p-5">
          <div>
            <h2 className="font-semibold">最近记录</h2>
            <p className="text-xs text-[#7b887f]">
              每条数据都可追溯，汇总结果不会覆盖原始记录
            </p>
          </div>
          <button
            onClick={() => setActive('副业')}
            className="text-xs font-medium text-[#2f6d57]"
          >
            查看全部 →
          </button>
        </div>
        <div className="grid gap-px bg-[#edf0ec] md:grid-cols-3">
          {profits
            .slice(-3)
            .reverse()
            .map((item) => (
              <div key={item.id} className="bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-[#7b887f]">{item.week}</span>
                  <span className="rounded-full bg-[#eef4ef] px-2 py-1 text-[11px]">
                    {item.platform}
                  </span>
                </div>
                <b>{item.project}</b>
                <div className="mt-2 text-xl font-semibold text-[#236c4d]">
                  +¥{item.profit}
                </div>
                <div className="mt-1 text-xs text-[#8b948f]">
                  收入 ¥{item.revenue} · 成本 ¥{item.cost}
                </div>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}

function WorkView({
  products,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  products: WorkProduct[];
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const avgMargin = products.length
    ? products.reduce((sum, p) => sum + p.margin, 0) / products.length
    : 0;
  return (
    <>
      <PageIntro
        eyebrow="工作看板"
        title="亚马逊产品开发（精铺）"
        detail="记录每个候选产品从类目判断、供应链到专利与评论分析的完整证据链。"
        action="新增候选产品"
        onAction={() => openRecord('工作产品')}
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="平均预估毛利率"
          value={`${avgMargin.toFixed(1)}%`}
          note="建议持续保持 30% 以上"
        />
        <Metric
          label="专利待确认"
          value={String(products.filter((x) => x.patent.includes('中')).length)}
          note="进入打样前完成复核"
        />
        <Metric
          label="高潜机会品"
          value={String(products.filter((x) => x.status === '机会品').length)}
          note="综合毛利与评论痛点"
        />
      </section>
      <section className="mb-5">
        <ChartCard title="候选产品毛利率" detail="柱状图对比每个候选产品的预估毛利率">
          {products.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <ReBarChart data={products}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="margin" name="毛利率 %" fill="#2f6d57" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty label="新增候选产品后显示毛利率对比" />}
        </ChartCard>
      </section>
      <div className="overflow-hidden rounded-2xl border border-[#dfe5df] bg-white">
        <div className="border-b border-[#edf0ec] p-5">
          <h2 className="font-semibold">产品开发记录</h2>
          <p className="text-xs text-[#7b887f]">
            保留每次判断依据，方便后续复盘成功与失败原因
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#fafbf9] text-xs text-[#7b887f]">
              <tr>
                {[
                  '目标产品',
                  '目标类目',
                  '毛利率',
                  '供应链情况',
                  '专利审查',
                  '评论洞察',
                  '当前环节',
                  '状态',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id} className="border-t border-[#edf0ec]">
                  <td className="px-4 py-4 font-medium">{row.name}</td>
                  <td className="px-4 py-4 text-[#647168]">{row.category}</td>
                  <td className="px-4 py-4 font-semibold text-[#236c4d]">
                    {row.margin}%
                  </td>
                  <td className="px-4 py-4">{row.supplyChain}</td>
                  <td className="px-4 py-4">{row.patent}</td>
                  <td className="max-w-48 px-4 py-4 text-[#647168]">
                    {row.reviews}
                  </td>
                  <td className="px-4 py-4">{row.stage}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#eef4ef] px-2 py-1 text-xs">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AreaGoalSection area="工作" goals={goals} history={history} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function SideView({
  profits,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  profits: ProfitLog[];
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const today = localDateString();
  const [granularity, setGranularity] = useState<'日' | '周' | '月' | '季度'>('日');
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(shiftDate(today, 6));
  const validRange = Boolean(rangeStart && rangeEnd && rangeStart <= rangeEnd);
  const platformTotals = Object.entries(
    profits.reduce<Record<string, number>>((acc, row) => {
      acc[row.platform] = (acc[row.platform] || 0) + row.revenue;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const incomeBuckets: Record<string, { label: string; 自媒体: number; 网盘拉新: number; 抖音电商: number }> = {};
  if (granularity === '日' && validRange) {
    for (let cursor = rangeStart; cursor <= rangeEnd; cursor = shiftDate(cursor, 1)) {
      incomeBuckets[cursor] = { label: cursor, 自媒体: 0, 网盘拉新: 0, 抖音电商: 0 };
      if (Object.keys(incomeBuckets).length > 366) break;
    }
  }
  profits.forEach((row) => {
    const date = row.weekStart || row.week;
    if (!validRange || !date || date < rangeStart || date > rangeEnd) return;
    const key = incomePeriodKey(date, granularity);
    incomeBuckets[key] ??= { label: key, 自媒体: 0, 网盘拉新: 0, 抖音电商: 0 };
    incomeBuckets[key][row.project] += row.revenue;
  });
  const incomeByDate = Object.values(incomeBuckets).sort((a, b) => a.label.localeCompare(b.label));
  return (
    <>
      <PageIntro
        eyebrow="副业看板"
        title="盈利记录与增长分析"
        detail="自媒体、网盘拉新和抖音电商按日期记录收入，数据自动分类汇总。"
        action="记录一笔收入"
        onAction={() => openRecord('副业利润')}
      />
      <section className="mb-5 rounded-2xl border border-[#dfe5df] bg-white p-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="mb-2 text-xs font-medium text-[#657169]">收入汇总粒度</p>
            <div className="flex flex-wrap gap-2">
              {(['日', '周', '月', '季度'] as const).map((item) => (
                <button key={item} onClick={() => setGranularity(item)} className={`rounded-xl px-4 py-2 text-sm ${granularity === item ? 'bg-[#174578] text-white' : 'bg-[#edf3f9] text-[#4d6277]'}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-xs text-[#657169]">开始日期<input type="date" value={rangeStart} onChange={(event) => { const value = event.target.value; setRangeStart(value); if (value && value > rangeEnd) setRangeEnd(value); }} className="mt-1 block h-10 rounded-xl border border-[#d7e3ef] bg-white px-3 text-sm text-[#18221d]" /></label>
            <label className="text-xs text-[#657169]">结束日期<input type="date" value={rangeEnd} min={rangeStart} onChange={(event) => setRangeEnd(event.target.value)} className="mt-1 block h-10 rounded-xl border border-[#d7e3ef] bg-white px-3 text-sm text-[#18221d]" /></label>
            <button onClick={() => { setGranularity('日'); setRangeStart(today); setRangeEnd(shiftDate(today, 6)); }} className="h-10 rounded-xl border border-[#b9cbe0] px-4 text-sm text-[#174578]">恢复默认 7 天</button>
          </div>
        </div>
      </section>
      <section className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <ChartCard
          title={`按${granularity}分类收入`}
          detail={`${rangeStart} 至 ${rangeEnd} · 不同颜色对应不同收入来源`}
        >
          {incomeByDate.length ? <ResponsiveContainer width="100%" height={250}>
            <ReBarChart data={incomeByDate} margin={{ left: 4, right: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
              <XAxis
                dataKey="label"
                interval={0}
                padding={{ left: 24, right: 24 }}
                tick={{ fontSize: 11, textAnchor: 'middle' }}
                tickMargin={10}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="自媒体" stackId="income" fill="#2563eb" maxBarSize={52} />
              <Bar dataKey="网盘拉新" stackId="income" fill="#f59e0b" maxBarSize={52} />
              <Bar dataKey="抖音电商" stackId="income" fill="#8b5cf6" maxBarSize={52} />
            </ReBarChart>
          </ResponsiveContainer> : <ChartEmpty label="所选日期范围内暂无收入" />}
        </ChartCard>
        <div className="rounded-2xl border border-[#dfe5df] bg-white p-5">
          <h2 className="font-semibold">平台贡献分析</h2>
          <p className="mb-4 text-xs text-[#7b887f]">按累计收入排序</p>
          <div className="space-y-4">
            {platformTotals.map(([platform, total], i) => (
              <div key={platform}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>
                    {i + 1}. {platform}
                  </span>
                  <b>¥{total}</b>
                </div>
                <div className="h-2 rounded-full bg-[#edf0ec]">
                  <div
                    className="h-full rounded-full bg-[#6c8f7f]"
                    style={{
                      width: `${Math.max(12, (total / (platformTotals[0]?.[1] || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!platformTotals.length && <ChartEmpty label="记录盈利后显示平台贡献" />}
        </div>
      </section>
      <div className="overflow-hidden rounded-2xl border border-[#dfe5df] bg-white">
        <div className="p-5">
          <h2 className="font-semibold">收入明细</h2>
          <p className="text-xs text-[#7b887f]">
            原始记录永久保留，可用于后续月度和目标周期复盘
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafbf9] text-xs text-[#7b887f]">
            <tr>
              {['日期', '项目', '平台', '收入'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profits
              .slice()
              .reverse()
              .map((row) => (
                <tr key={row.id} className="border-t border-[#edf0ec]">
                  <td className="px-4 py-3">{row.weekStart || row.week}</td>
                  <td className="px-4 py-3 font-medium">{row.project}</td>
                  <td className="px-4 py-3">{row.platform}</td>
                  <td className="px-4 py-3">¥{row.revenue}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <AreaGoalSection area="副业" goals={goals} history={history} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function HealthView({
  health,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  health: HealthLog[];
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const latest = health.at(-1);
  const first = health[0];
  return (
    <>
      <PageIntro
        eyebrow="身体看板"
        title="六个月身体目标"
        detail="记录体重、体脂率和训练次数，关注长期趋势与执行稳定性。"
        action="记录身体数据"
        onAction={() => openRecord('身体数据')}
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="最新体重"
          value={latest ? `${latest.weight} kg` : '待记录'}
          note={
            first && latest
              ? `阶段变化 ${(latest.weight - first.weight).toFixed(1)} kg`
              : '—'
          }
        />
        <Metric
          label="最新体脂率"
          value={latest ? `${latest.bodyFat}%` : '待记录'}
          note={
            first && latest
              ? `阶段变化 ${(latest.bodyFat - first.bodyFat).toFixed(1)}%`
              : '—'
          }
        />
        <Metric
          label="本周训练"
          value={latest ? `${latest.workouts} 次` : '待记录'}
          note="建议关注每周稳定性"
        />
      </section>
      {goals.some((goal) => goal.target == null) && (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#dbcfa8] bg-[#fff9e8] p-5 sm:flex-row sm:items-center">
          <div>
            <b>还需要你设定具体体重和体脂目标</b>
            <p className="mt-1 text-sm text-[#756c52]">
              六个月期限已经保留，目标数值会与你确认后写入。
            </p>
          </div>
          <button
            onClick={() => openRecord('新目标')}
            className="rounded-xl bg-[#7e6729] px-4 py-2 text-sm text-white"
          >
            设置目标
          </button>
        </div>
      )}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="体重趋势" detail="每周记录值">
          {health.length ? <ResponsiveContainer width="100%" height={260}>
            <ReLineChart data={health}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                name="体重 kg"
                stroke="#2f6d57"
                strokeWidth={3}
              />
            </ReLineChart>
          </ResponsiveContainer> : <ChartEmpty label="记录身体数据后显示体重趋势" />}
        </ChartCard>
        <ChartCard title="体脂率趋势" detail="与训练频率一起复盘">
          {health.length ? <ResponsiveContainer width="100%" height={260}>
            <ReLineChart data={health}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bodyFat"
                name="体脂率 %"
                stroke="#c8753b"
                strokeWidth={3}
              />
            </ReLineChart>
          </ResponsiveContainer> : <ChartEmpty label="记录身体数据后显示体脂趋势" />}
        </ChartCard>
      </section>
      <AreaGoalSection area="身体" goals={goals} history={history} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function FinanceView({
  logs,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  logs: FinanceLog[];
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const income = logs
    .filter((x) => x.type === '收入')
    .reduce((sum, x) => sum + x.amount, 0);
  const expense = logs
    .filter((x) => x.type === '支出')
    .reduce((sum, x) => sum + x.amount, 0);
  const balance = income - expense;
  const categories = Object.entries(
    logs
      .filter((x) => x.type === '支出')
      .reduce<Record<string, number>>((acc, x) => {
        acc[x.category] = (acc[x.category] || 0) + x.amount;
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCategory = categories[0]?.[1] || 1;
  return (
    <>
      <PageIntro
        eyebrow="个人财务"
        title="看清钱流向哪里"
        detail="收入与支出都保留原始流水，按月汇总结余、支出结构和预算执行情况。"
        action="记录一笔流水"
        onAction={() => openRecord('财务流水')}
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="本月收入"
          value={`¥${income.toLocaleString()}`}
          note="工资、副业及其他收入"
        />
        <Metric
          label="本月支出"
          value={`¥${expense.toLocaleString()}`}
          note={
            income ? `占收入 ${Math.round((expense / income) * 100)}%` : '—'
          }
        />
        <Metric
          label="本月结余"
          value={`¥${balance.toLocaleString()}`}
          note={balance >= 0 ? '现金流保持为正' : '本月支出超过收入'}
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-[#dfe5df] bg-white p-5">
          <h2 className="font-semibold">支出结构</h2>
          <p className="mb-5 text-xs text-[#7b887f]">识别最值得优化的类别</p>
          {categories.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categories.map(([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] }))} dataKey="value" nameKey="name" outerRadius={82} label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartEmpty label="记录支出后显示扇形图" />}
          <div className="space-y-4">
            {categories.map(([category, amount]) => (
              <div key={category}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{category}</span>
                  <b>¥{amount.toLocaleString()}</b>
                </div>
                <div className="h-2 rounded-full bg-[#edf0ec]">
                  <div
                    className="h-full rounded-full bg-[#7d65a7]"
                    style={{ width: `${(amount / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="py-8 text-center text-sm text-[#7b887f]">
              记录支出后生成结构分析
            </p>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#dfe5df] bg-white">
          <div className="p-5">
            <h2 className="font-semibold">财务流水</h2>
            <p className="text-xs text-[#7b887f]">
              历史流水不会因新月份开始而清空
            </p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fafbf9] text-xs text-[#7b887f]">
              <tr>
                {['日期', '类型', '分类', '说明', '金额'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs
                .slice()
                .reverse()
                .map((row) => (
                  <tr key={row.id} className="border-t border-[#edf0ec]">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${row.type === '收入' ? 'bg-[#e9f4ed] text-[#286444]' : 'bg-[#f8ece7] text-[#9b5336]'}`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3 text-[#6f7973]">{row.note}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${row.type === '收入' ? 'text-[#286444]' : 'text-[#9b5336]'}`}
                    >
                      {row.type === '收入' ? '+' : '-'}¥
                      {row.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <AreaGoalSection area="个人财务" goals={goals} history={history} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function ReadingView({
  books,
  goals,
  history,
  openRecord,
  onEditGoal,
}: {
  books: Book[];
  goals: Goal[];
  history: Goal[];
  openRecord: (k: RecordKind) => void;
  onEditGoal: (goal: Goal) => void;
}) {
  const reading = books.filter((book) => book.status === '在读');
  const finished = books.filter((book) => book.status === '已读');
  const averageRating = finished.filter((b) => b.rating).length
    ? finished.reduce((sum, b) => sum + (b.rating || 0), 0) /
      finished.filter((b) => b.rating).length
    : 0;
  const readingStatus = ['想读', '在读', '已读'].map((status) => ({
    status,
    count: books.filter((book) => book.status === status).length,
  }));
  return (
    <>
      <PageIntro
        eyebrow="读书清单"
        title="从书单到可复用的认知"
        detail="记录想读、在读和已读状态，保留进度、评分与核心笔记，并统计年度阅读成果。"
        action="添加一本书"
        onAction={() => openRecord('读书记录')}
      />
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <Metric
          label="在读"
          value={`${reading.length} 本`}
          note="建议同时在读不超过 3 本"
        />
        <Metric
          label="今年已读"
          value={`${finished.length} 本`}
          note="完成后进入永久历史"
        />
        <Metric
          label="平均评分"
          value={averageRating ? `${averageRating.toFixed(1)} / 5` : '待评分'}
          note="只统计已读书目"
        />
      </section>
      <section className="mb-5">
        <ChartCard title="阅读状态分布" detail="书单在想读、在读与已读阶段的数量">
          {books.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <ReBarChart data={readingStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ede9" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="书籍数量" fill="#7d65a7" radius={[8, 8, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty label="添加书籍后显示阅读状态" />}
        </ChartCard>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <article
            key={book.id}
            className="flex min-h-64 flex-col rounded-2xl border border-[#dfe5df] bg-white p-5"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="grid size-11 place-items-center rounded-xl bg-[#eee9f7] text-[#694aa0]">
                <BookOpen className="size-5" />
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${book.status === '已读' ? 'bg-[#e9f4ed] text-[#286444]' : book.status === '在读' ? 'bg-[#fff4db] text-[#80651f]' : 'bg-[#eef0ee] text-[#66716a]'}`}
              >
                {book.status}
              </span>
            </div>
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="mt-1 text-sm text-[#7b887f]">{book.author}</p>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs">
                <span>阅读进度</span>
                <span>{book.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#edf0ec]">
                <div
                  className="h-full rounded-full bg-[#8063ad]"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-[#657169]">
              {book.notes || '暂未记录笔记'}
            </p>
            <div className="mt-4 border-t border-[#edf0ec] pt-3 text-xs text-[#7b887f]">
              {book.rating
                ? `评分 ${book.rating} / 5`
                : book.status === '已读'
                  ? '待评分'
                  : '完成后可评分'}
            </div>
          </article>
        ))}
      </section>
      <AreaGoalSection area="读书清单" goals={goals} history={history} openRecord={openRecord} onEditGoal={onEditGoal} />
    </>
  );
}

function WeeklyReflectionPanel({
  area,
  records,
  onSave,
}: {
  area: Area;
  records: WeeklyReflection[];
  onSave: (area: Area, weekStart: string, review: string, insight: string) => Promise<string>;
}) {
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const current = records.find((item) => item.weekStart === weekStart);
  const [review, setReview] = useState('');
  const [insight, setInsight] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setReview(current?.review ?? '');
    setInsight(current?.insight ?? '');
    setMessage('');
  }, [area, weekStart, current?.id, current?.review, current?.insight]);

  return (
    <section className="mt-5 rounded-2xl border border-[#d7e3ef] bg-white p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">{area} · 每周复盘与感悟</h2>
          <p className="text-xs text-[#718078]">按周保存，后续修改只更新所选周，历史记录持续保留</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#607184]">
          <CalendarDays className="size-4" />
          <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="h-9 rounded-xl border border-[#d7e3ef] px-3" />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm">
          <span className="mb-2 block font-medium">每周复盘</span>
          <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={5} placeholder="本周完成了什么、数据发生了什么变化、哪些地方需要调整……" className="w-full resize-y rounded-xl border border-[#d7e3ef] p-3 outline-none focus:border-[#4672a8]" />
        </label>
        <label className="text-sm">
          <span className="mb-2 block font-medium">感悟</span>
          <textarea value={insight} onChange={(event) => setInsight(event.target.value)} rows={5} placeholder="记录判断、经验、灵感和下一步想法……" className="w-full resize-y rounded-xl border border-[#d7e3ef] p-3 outline-none focus:border-[#4672a8]" />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-[#607184]">{message}</span>
        <button onClick={async () => setMessage(await onSave(area, weekStart, review, insight))} className="rounded-xl bg-[#174578] px-4 py-2 text-sm font-medium text-white">保存本周记录</button>
      </div>
      {records.length > 0 && (
        <details className="mt-5 border-t border-[#e6edf4] pt-4">
          <summary className="cursor-pointer text-sm font-medium">查看历史复盘（{records.length}）</summary>
          <div className="mt-3 space-y-3">
            {records.map((item) => (
              <article key={item.id} className="rounded-xl bg-[#f4f8fc] p-4 text-sm">
                <b>{item.weekStart}</b>
                <p className="mt-2 whitespace-pre-wrap text-[#536477]">复盘：{item.review || '—'}</p>
                <p className="mt-1 whitespace-pre-wrap text-[#536477]">感悟：{item.insight || '—'}</p>
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function PlanAndReflectionView({
  notes,
  imageUrls,
  session,
  onSaved,
}: {
  notes: PlanNote[];
  imageUrls: Record<string, string>;
  session: Session | null;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');

  async function saveNote(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabase();
    if (!client || !session) return;
    if (!content.trim() && !title.trim() && files.length === 0) {
      setMessage('请输入文字或选择图片');
      return;
    }
    setMessage('正在保存…');
    const imagePaths: string[] = [];
    for (const file of files.slice(0, 4)) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage(`${file.name} 超过 5MB`);
        return;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await client.storage.from('journal-images').upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setMessage(error.message);
        return;
      }
      imagePaths.push(path);
    }
    const { error } = await client.from('plan_notes').insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      note_date: noteDate,
      image_paths: imagePaths,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setTitle('');
    setContent('');
    setFiles([]);
    setMessage('已保存');
    await onSaved();
  }

  return (
    <>
      <PageIntro eyebrow="计划和感悟" title="把计划、想法和图片留在同一处" detail="直接写下阶段计划、灵感与复盘材料；文字和私密图片都会随账户跨设备同步。" action="写一条记录" onAction={() => document.getElementById('plan-note-editor')?.scrollIntoView({ behavior: 'smooth' })} />
      <form id="plan-note-editor" onSubmit={saveNote} className="mb-5 rounded-2xl border border-[#d7e3ef] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <label className="text-sm"><span className="mb-1.5 block font-medium">标题（可选）</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 w-full rounded-xl border border-[#d7e3ef] px-3" placeholder="例如：下周内容计划" /></label>
          <label className="text-sm"><span className="mb-1.5 block font-medium">日期</span><input type="date" value={noteDate} onChange={(event) => setNoteDate(event.target.value)} className="h-10 w-full rounded-xl border border-[#d7e3ef] px-3" /></label>
        </div>
        <label className="mt-4 block text-sm"><span className="mb-1.5 block font-medium">计划与感悟</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={7} className="w-full resize-y rounded-xl border border-[#d7e3ef] p-3" placeholder="直接输入文字……" /></label>
        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#b9cbe0] px-4 py-2 text-sm text-[#174578]"><ImagePlus className="size-4" />选择图片（最多 4 张）<input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 4))} /></label>
          <div className="flex items-center gap-3"><span className="text-xs text-[#607184]">{files.length ? `已选 ${files.length} 张 · ` : ''}{message}</span><button className="rounded-xl bg-[#174578] px-5 py-2 text-sm font-medium text-white">保存记录</button></div>
        </div>
      </form>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl border border-[#d7e3ef] bg-white p-5">
            <p className="text-xs text-[#718078]">{note.noteDate}</p>
            <h2 className="mt-1 font-semibold">{note.title || '未命名记录'}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#536477]">{note.content || '（图片记录）'}</p>
            {note.imagePaths.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{note.imagePaths.map((path) => imageUrls[path] ? <img key={path} src={imageUrls[path]} alt={note.title || '计划和感悟图片'} className="aspect-square w-full rounded-xl object-cover" /> : null)}</div>}
          </article>
        ))}
        {notes.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-[#b9cbe0] bg-white/60 p-10 text-center text-sm text-[#718078]">还没有计划和感悟记录</div>}
      </section>
    </>
  );
}

function _GoalArchive({
  current,
  archived,
  openRecord,
}: {
  current: Goal[];
  archived: Goal[];
  openRecord: (k: RecordKind) => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="目标档案"
        title="每一个目标都有完整生命周期"
        detail="达标后锁定结果并进入历史；新目标由你确认后创建，绝不覆盖旧数据。"
        action="设立新目标"
        onAction={() => openRecord('新目标')}
      />
      <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {current.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
      <section className="rounded-2xl border border-[#dfe5df] bg-white">
        <div className="flex items-center gap-3 border-b border-[#edf0ec] p-5">
          <div className="grid size-9 place-items-center rounded-xl bg-[#eef1ee]">
            <Archive className="size-4" />
          </div>
          <div>
            <h2 className="font-semibold">历史目标</h2>
            <p className="text-xs text-[#7b887f]">
              达成结果、目标周期及当期记录永久保留
            </p>
          </div>
        </div>
        {archived.length ? (
          <div className="divide-y divide-[#edf0ec]">
            {archived.map((goal) => (
              <div
                key={goal.id}
                className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <b>{goal.title}</b>
                  <p className="mt-1 text-sm text-[#6e7973]">
                    {goal.startedAt} — {goal.deadline} · {goal.result}
                  </p>
                </div>
                <span className="rounded-full bg-[#e9f4ed] px-3 py-1 text-xs text-[#286444]">
                  {goal.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <FileClock className="mx-auto mb-3 size-8 text-[#9aa39e]" />
            <b>还没有历史目标</b>
            <p className="mt-1 text-sm text-[#7b887f]">
              第一个目标达成后，会在这里生成不可覆盖的阶段总结。
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function GoalPulse({
  goals,
  onArchive,
}: {
  goals: Goal[];
  onArchive: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">进行中的目标</h2>
          <p className="text-xs text-[#7b887f]">
            记录自动推动进度，达标后等待新目标确认
          </p>
        </div>
        <button
          onClick={onArchive}
          className="text-xs font-medium text-[#2f6d57]"
        >
          目标档案 →
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} compact />
        ))}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  compact = false,
  onEdit,
}: {
  goal: Goal;
  compact?: boolean;
  onEdit?: () => void;
}) {
  const percent =
    goal.target && goal.current != null
      ? Math.min(100, Math.round((goal.current / goal.target) * 100))
      : 0;
  return (
    <article
      className={`rounded-xl border border-[#e3e8e3] bg-[#fafbf9] ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-medium text-[#738078]">
            {goal.area} · {goal.metric}
          </span>
          <h3 className="mt-1 font-semibold">{goal.title}</h3>
        </div>
        <span className="whitespace-nowrap rounded-full bg-[#e8efe9] px-2 py-1 text-[10px] text-[#3a6652]">
          {goal.status}
        </span>
      </div>
      {goal.target != null && goal.current != null ? (
        <>
          <div className="mb-1.5 flex items-end justify-between">
            <b className="text-lg">
              {goal.current.toLocaleString()}{' '}
              <small className="font-normal text-[#7b887f]">
                / {goal.target.toLocaleString()} {goal.unit}
              </small>
            </b>
            <span className="text-xs">{percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#e7ebe7]">
            <div
              className="h-full rounded-full bg-[#39765e]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-[#fff6dc] px-3 py-2 text-xs text-[#776331]">
          具体数值待与你确认
        </div>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#7d8881]">
        <Clock3 className="size-3" /> 截止 {goal.deadline}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="mt-3 w-full rounded-lg border border-[#d9e1da] bg-white px-3 py-2 text-xs font-medium text-[#2f6d57]">
          更新进度或完成状态
        </button>
      )}
      {percent >= 100 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#e8f4ec] p-2 text-xs font-medium text-[#286444]">
          <CheckCircle2 className="size-3.5" /> 已达标，请确认阶段总结与新目标
        </div>
      )}
    </article>
  );
}

function AnalysisPanel({
  products,
  profits,
  health,
}: {
  products: WorkProduct[];
  profits: ProfitLog[];
  health: HealthLog[];
}) {
  const topProduct = products.slice().sort((a, b) => b.margin - a.margin)[0];
  const topPlatform = Object.entries(
    profits.reduce<Record<string, number>>((a, r) => {
      a[r.platform] = (a[r.platform] || 0) + r.revenue;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0];
  const first = health[0];
  const last = health.at(-1);
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-[#153e32] p-5 text-white">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-white/10">
          <BarChart3 className="size-4 text-[#d9f99d]" />
        </div>
        <div>
          <h2 className="font-semibold">阶段数据结论</h2>
          <p className="text-xs text-white/50">由现有记录自动归纳</p>
        </div>
      </div>
      <div className="space-y-3">
        <Insight
          label="工作"
          text={
            topProduct
              ? `${topProduct.name} 的预估毛利率最高（${topProduct.margin}%），下一步优先验证供应链与专利风险。`
              : '先新增产品记录，才能形成机会排序。'
          }
        />
        <Insight
          label="副业"
          text={
            topPlatform
              ? `${topPlatform[0]} 当前累计收入最高（¥${topPlatform[1]}），建议复盘其内容与转化路径。`
              : '先记录收入，才能分析平台贡献。'
          }
        />
        <Insight
          label="身体"
          text={
            first && last
              ? `体重阶段变化 ${(last.weight - first.weight).toFixed(1)} kg，体脂率变化 ${(last.bodyFat - first.bodyFat).toFixed(1)}%，继续看 4 周趋势。`
              : '连续记录至少 4 周后生成趋势结论。'
          }
        />
      </div>
    </div>
  );
}

function Insight({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/7 p-3">
      <span className="text-[11px] font-medium text-[#d9f99d]">{label}</span>
      <p className="mt-1 text-sm leading-6 text-white/75">{text}</p>
    </div>
  );
}
function ChartCard({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <LineChart className="size-4 text-[#39765e]" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-[#7b887f]">{detail}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe5df] bg-white p-5">
      <p className="text-xs text-[#728078]">{label}</p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <p className="mt-2 text-xs text-[#8a948e]">{note}</p>
    </div>
  );
}
function SummaryCard({
  icon: Icon,
  label,
  value,
  meta,
  progress,
  tone,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
  meta: string;
  progress: number;
  tone: 'work' | 'side' | 'health';
}) {
  const colors = {
    work: 'bg-[#e5eee9] text-[#1d5a43]',
    side: 'bg-[#eee9f7] text-[#694aa0]',
    health: 'bg-[#f7eadf] text-[#a55b27]',
  };
  const bars = {
    work: 'bg-[#35775d]',
    side: 'bg-[#8063ad]',
    health: 'bg-[#c8753b]',
  };
  return (
    <article className="rounded-2xl border border-[#dfe5df] bg-white p-5">
      <div className="mb-5 flex items-start justify-between">
        <div
          className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}
        >
          <Icon className="size-5" />
        </div>
        <span className="text-xs text-[#89928d]">{progress}%</span>
      </div>
      <p className="text-xs text-[#728078]">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold">{value}</h2>
      <div className="mt-4 h-1.5 rounded-full bg-[#edf0ec]">
        <div
          className={`h-full rounded-full ${bars[tone]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[#87918b]">{meta}</p>
    </article>
  );
}
function PageIntro({
  eyebrow,
  title,
  detail,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[.18em] text-[#738078]">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#718078]">{detail}</p>
      </div>
      <button
        onClick={onAction}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#153e32] px-4 text-sm font-medium text-white"
      >
        <Plus className="size-4" />
        {action}
      </button>
    </section>
  );
}

function MobileNav({
  active,
  setActive,
}: {
  active: Area;
  setActive: (a: Area) => void;
}) {
  return (
    <nav className="fixed inset-x-2 bottom-2 z-40 flex justify-start gap-1 overflow-x-auto rounded-2xl border border-[#dfe5df] bg-white/95 p-1.5 shadow-xl backdrop-blur lg:hidden">
      {navigation.map(({ label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => setActive(label)}
          className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] ${active === label ? 'bg-[#e5eee9] text-[#153e32]' : 'text-[#78837d]'}`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}

function RecordDialog({
  kind,
  close,
  products,
  setProducts,
  profits,
  setProfits,
  health,
  setHealth,
  finance,
  setFinance,
  books,
  setBooks,
  goals,
  setGoals,
  session,
  editingGoal,
}: {
  kind: RecordKind;
  close: () => void;
  products: WorkProduct[];
  setProducts: (v: WorkProduct[]) => void;
  profits: ProfitLog[];
  setProfits: (v: ProfitLog[]) => void;
  health: HealthLog[];
  setHealth: (v: HealthLog[]) => void;
  finance: FinanceLog[];
  setFinance: (v: FinanceLog[]) => void;
  books: Book[];
  setBooks: (v: Book[]) => void;
  goals: Goal[];
  setGoals: (v: Goal[]) => void;
  session: Session | null;
  editingGoal: Goal | null;
}) {
  const [selected, setSelected] = useState<RecordKind>(kind);
  const [sideProject, setSideProject] = useState<ProfitLog['project']>('自媒体');
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = crypto.randomUUID();
    const client = getSupabase();
    if (selected === '工作产品') {
      const row: WorkProduct = {
        id,
        name: formText(data, 'name'),
        category: formText(data, 'category'),
        margin: Number(data.get('margin')),
        supplyChain: formText(data, 'supplyChain'),
        patent: formText(data, 'patent'),
        reviews: formText(data, 'reviews'),
        stage: formText(data, 'stage'),
        status: '进行中',
      };
      setProducts([...products, row]);
      if (client && session)
        await client.from('work_products').insert({
          user_id: session.user.id,
          name: row.name,
          category: row.category,
          margin: row.margin,
          supply_chain: row.supplyChain,
          patent_review: row.patent,
          review_insights: row.reviews,
          stage: row.stage,
          status: row.status,
        });
    }
    if (selected === '副业利润') {
      const revenue = Number(data.get('revenue'));
      const date = formText(data, 'date');
      const row: ProfitLog = {
        id,
        project: formText(data, 'project') as ProfitLog['project'],
        platform: formText(data, 'platform'),
        week: date,
        weekStart: date,
        revenue,
        cost: 0,
        profit: revenue,
      };
      setProfits([...profits, row]);
      if (client && session)
        await client.from('profit_logs').insert({
          user_id: session.user.id,
          project: row.project,
          platform: row.platform,
          week_label: row.weekStart,
          week_start: row.weekStart,
          revenue,
          cost: 0,
          profit: row.profit,
        });
    }
    if (selected === '身体数据') {
      const row: HealthLog = {
        id,
        date: formText(data, 'date'),
        weight: Number(data.get('weight')),
        bodyFat: Number(data.get('bodyFat')),
        workouts: Number(data.get('workouts')),
      };
      setHealth([...health, row]);
      if (client && session)
        await client.from('health_logs').insert({
          user_id: session.user.id,
          date_label: row.date,
          logged_at: new Date().toISOString().slice(0, 10),
          weight: row.weight,
          body_fat: row.bodyFat,
          workouts: row.workouts,
        });
    }
    if (selected === '财务流水') {
      const row: FinanceLog = {
        id,
        date: formText(data, 'date'),
        type: formText(data, 'type') as FinanceLog['type'],
        category: formText(data, 'category'),
        amount: Number(data.get('amount')),
        note: formText(data, 'note'),
      };
      setFinance([...finance, row]);
      if (client && session)
        await client.from('finance_logs').insert({
          user_id: session.user.id,
          date_label: row.date,
          occurred_at: new Date().toISOString().slice(0, 10),
          type: row.type,
          category: row.category,
          amount: row.amount,
          note: row.note,
        });
    }
    if (selected === '读书记录') {
      const status = formText(data, 'status') as Book['status'];
      const row: Book = {
        id,
        title: formText(data, 'title'),
        author: formText(data, 'author'),
        status,
        progress: Number(data.get('progress')),
        rating: data.get('rating') ? Number(data.get('rating')) : null,
        notes: formText(data, 'notes'),
        finishedAt:
          status === '已读' ? new Date().toISOString().slice(0, 10) : undefined,
      };
      setBooks([...books, row]);
      if (client && session)
        await client.from('books').insert({
          user_id: session.user.id,
          title: row.title,
          author: row.author,
          status: row.status,
          progress: row.progress,
          rating: row.rating,
          notes: row.notes,
          finished_at: row.finishedAt,
        });
    }
    if (selected === '新目标') {
      const target = data.get('target') ? Number(data.get('target')) : null;
      const row: Goal = {
        id,
        area: formText(data, 'area') as Goal['area'],
        title: formText(data, 'title'),
        metric: formText(data, 'metric'),
        current: data.get('current') ? Number(data.get('current')) : null,
        target,
        unit: formText(data, 'unit'),
        startedAt: new Date().toISOString().slice(0, 10),
        deadline: formText(data, 'deadline'),
        status: '进行中',
      };
      setGoals([...goals, row]);
      if (client && session)
        await client.from('goals').insert({
          user_id: session.user.id,
          area: row.area,
          title: row.title,
          metric: row.metric,
          current_value: row.current,
          target_value: row.target,
          unit: row.unit,
          started_at: row.startedAt,
          deadline: row.deadline,
          status: row.status,
        });
    }
    if (selected === '更新目标' && editingGoal) {
      const updated: Goal = {
        ...editingGoal,
        current: data.get('current') ? Number(data.get('current')) : null,
        target: data.get('target') ? Number(data.get('target')) : null,
        deadline: formText(data, 'deadline'),
        status: formText(data, 'status') as Goal['status'],
        result: formText(data, 'result'),
      };
      setGoals(goals.map((goal) => goal.id === updated.id ? updated : goal));
      if (client && session)
        await client.from('goals').update({
          current_value: updated.current,
          target_value: updated.target,
          deadline: updated.deadline,
          status: updated.status,
          result: updated.result,
        }).eq('id', updated.id);
    }
    close();
  }
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e8ece8] bg-white p-5">
          <div>
            <h2 className="font-semibold">新增记录</h2>
            <p className="text-xs text-[#7b887f]">
              保存后立即进入汇总与历史分析
            </p>
          </div>
          <button
            onClick={close}
            className="grid size-8 place-items-center rounded-lg bg-[#f1f3f1]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1 border-b border-[#e8ece8] p-2">
          {(
            (kind === '更新目标' ? ['更新目标'] : [
              '工作产品',
              '副业利润',
              '身体数据',
              '财务流水',
              '读书记录',
              '新目标',
            ]) as RecordKind[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => setSelected(item)}
              className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs ${selected === item ? 'bg-[#153e32] text-white' : 'text-[#6f7973] hover:bg-[#f1f3f1]'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          {selected === '工作产品' && (
            <>
              <Field name="name" label="目标产品" required />
              <Field name="category" label="目标类目" required />
              <Field
                name="margin"
                label="预估毛利率（%）"
                type="number"
                required
              />
              <Field name="supplyChain" label="供应链情况" />
              <Field name="patent" label="专利审查" />
              <Field name="reviews" label="评论洞察" />
              <Field name="stage" label="当前环节" required />
            </>
          )}
          {selected === '副业利润' && (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">副业项目</span>
                <select
                  name="project"
                  value={sideProject}
                  onChange={(event) => setSideProject(event.target.value as ProfitLog['project'])}
                  className="h-10 w-full rounded-xl border border-[#dfe5df] bg-white px-3"
                >
                  {(['自媒体', '网盘拉新', '抖音电商'] as ProfitLog['project'][]).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <PlatformPicker project={sideProject} />
              <Field name="date" label="收入日期" type="date" required />
              <Field
                name="revenue"
                label="收入金额（元）"
                type="number"
                step="0.01"
                required
              />
            </>
          )}
          {selected === '身体数据' && (
            <>
              <Field name="date" label="记录日期（如 09/07）" required />
              <Field
                name="weight"
                label="体重（kg）"
                type="number"
                step="0.1"
                required
              />
              <Field
                name="bodyFat"
                label="体脂率（%）"
                type="number"
                step="0.1"
                required
              />
              <Field
                name="workouts"
                label="本周训练次数"
                type="number"
                required
              />
            </>
          )}
          {selected === '财务流水' && (
            <>
              <Field name="date" label="日期（如 09/07）" required />
              <SelectField
                name="type"
                label="流水类型"
                options={['收入', '支出']}
              />
              <Field
                name="category"
                label="分类（工资/居住/餐饮/学习等）"
                required
              />
              <Field
                name="amount"
                label="金额（元）"
                type="number"
                step="0.01"
                required
              />
              <Field name="note" label="说明" />
            </>
          )}
          {selected === '读书记录' && (
            <>
              <Field name="title" label="书名" required />
              <Field name="author" label="作者" required />
              <SelectField
                name="status"
                label="阅读状态"
                options={['想读', '在读', '已读']}
              />
              <Field
                name="progress"
                label="阅读进度（0-100）"
                type="number"
                required
              />
              <Field
                name="rating"
                label="评分（0-5，可稍后填写）"
                type="number"
                step="0.5"
              />
              <Field name="notes" label="核心笔记或阅读目的" />
            </>
          )}
          {selected === '新目标' && (
            <>
              <SelectField
                name="area"
                label="所属板块"
                options={['工作', '副业', '身体', '个人财务', '读书清单']}
              />
              <Field name="title" label="目标名称" required />
              <Field name="metric" label="衡量指标" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="current" label="当前值" type="number" />
                <Field name="target" label="目标值" type="number" />
              </div>
              <Field name="unit" label="单位" required />
              <Field name="deadline" label="截止日期" type="date" required />
              <div className="rounded-xl bg-[#fff8e4] p-3 text-xs leading-5 text-[#796634]">
                新目标应在复盘旧目标后与你确认。系统会保留旧目标的全部记录和阶段结论。
              </div>
            </>
          )}
          {selected === '更新目标' && editingGoal && (
            <>
              <div className="rounded-xl bg-[#f4f7f4] p-4">
                <p className="text-xs text-[#7b887f]">{editingGoal.area} · {editingGoal.metric}</p>
                <b className="mt-1 block">{editingGoal.title}</b>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="current" label="当前值" type="number" step="0.01" defaultValue={editingGoal.current?.toString() ?? ''} />
                <Field name="target" label="目标值" type="number" step="0.01" defaultValue={editingGoal.target?.toString() ?? ''} />
              </div>
              <Field name="deadline" label="截止日期" type="date" required defaultValue={editingGoal.deadline} />
              <SelectField name="status" label="目标状态" options={['进行中', '已达成', '已归档']} defaultValue={editingGoal.status} />
              <Field name="result" label="阶段总结 / 达成结果" defaultValue={editingGoal.result ?? ''} />
              <div className="rounded-xl bg-[#fff8e4] p-3 text-xs leading-5 text-[#796634]">
                标记为已达成或已归档后，这个目标会进入当前板块的历史记录；原目标不会被新目标覆盖。
              </div>
            </>
          )}
          <button className="h-10 w-full rounded-xl bg-[#153e32] text-sm font-medium text-white">
            保存记录
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  step,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        step={step}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-xl border border-[#dfe5df] px-3 outline-none focus:border-[#6f8f80]"
      />
    </label>
  );
}
function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-xl border border-[#dfe5df] bg-white px-3"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

const platformsByProject: Record<ProfitLog['project'], string[]> = {
  自媒体: ['抖音', '小红书', 'YouTube', 'B站', '视频号', '快手', '其他平台'],
  网盘拉新: ['夸克网盘', '百度网盘', '阿里云盘', '迅雷云盘', '其他网盘'],
  抖音电商: ['抖音商城', '抖音直播', '抖音橱窗', '其他渠道'],
};

function PlatformPicker({ project }: { project: ProfitLog['project'] }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState(platformsByProject[project][0]);
  useEffect(() => {
    setPlatform(platformsByProject[project][0]);
    setOpen(false);
  }, [project]);
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">平台</span>
      <input type="hidden" name="platform" value={platform} readOnly />
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex h-12 w-full items-center justify-between rounded-xl border border-[#cfdbe7] bg-[#f8fbfe] px-4 text-left font-medium text-[#174578]">
        <span>{platform}</span>
        <span className="text-xs text-[#71869b]">{open ? '收起平台' : '点击选择平台'}</span>
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#d7e3ef] bg-white p-3 sm:grid-cols-3">
          {platformsByProject[project].map((option) => (
            <button key={option} type="button" aria-pressed={platform === option} onClick={() => { setPlatform(option); setOpen(false); }} className={`rounded-xl border px-3 py-3 text-sm transition ${platform === option ? 'border-[#174578] bg-[#e7f0fa] font-medium text-[#174578]' : 'border-[#dfe7ef] bg-white text-[#566b7f] hover:border-[#89a9c9]'}`}>
              {option}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
function Login({
  email,
  setEmail,
  handoffPending,
  message,
  submit,
}: {
  email: string;
  setEmail: (v: string) => void;
  handoffPending: boolean;
  message: string;
  submit: (e: SyntheticEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef7ff] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#153e32] text-[#d9f99d]">
          <Target />
        </div>
        <h1 className="text-2xl font-semibold">登录 Ryan's 个人看板</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7973]">
          电脑输入邮箱后，用手机点击邮件里的登录链接；验证成功后，这台电脑会自动登录。
        </p>
        <form onSubmit={submit} className="mt-6">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">登录邮箱</span>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-xl border border-[#dfe5df] px-3 outline-none focus:border-[#6f8f80]"
            />
          </label>
          <button className="mt-4 h-11 w-full rounded-xl bg-[#153e32] text-sm font-medium text-white">
            {handoffPending ? '重新发送登录链接' : '发送登录链接'}
          </button>
        </form>
        {message && (
          <p className="mt-4 rounded-xl bg-[#eef4ef] p-3 text-sm">{message}</p>
        )}
        <p className="mt-5 text-xs text-[#8a948e]">
          Notion 邮箱可以不同；你的邮箱和数据不会写入公开代码。
        </p>
      </div>
    </main>
  );
}
function CenteredMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef7ff]">
      <div className="text-center">
        <RefreshCw className="mx-auto mb-3 size-6 animate-spin text-[#39765e]" />
        <b>{title}</b>
        <p className="mt-1 text-sm text-[#7b887f]">{detail}</p>
      </div>
    </main>
  );
}

