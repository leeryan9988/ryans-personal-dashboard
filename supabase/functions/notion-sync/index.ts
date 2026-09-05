import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('请先登录');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('登录已失效');
    const allowedUserId = Deno.env.get('ALLOWED_USER_ID');
    if (!allowedUserId || user.id !== allowedUserId) throw new Error('该账户无权同步 Notion');

    const [products, profits, goals, health, finance, books, reflections, notes] = await Promise.all([
      supabase.from('work_products').select('*').eq('user_id', user.id),
      supabase.from('profit_logs').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('health_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
      supabase.from('finance_logs').select('*').eq('user_id', user.id),
      supabase.from('books').select('*').eq('user_id', user.id),
      supabase.from('weekly_reflections').select('*').eq('user_id', user.id).order('week_start', { ascending: false }).limit(7),
      supabase.from('plan_notes').select('*').eq('user_id', user.id).order('note_date', { ascending: false }).limit(5),
    ]);
    const sideProfit = (profits.data ?? []).reduce((sum, row) => sum + Number(row.profit), 0);
    const productRows = products.data ?? [];
    const averageMargin = productRows.length ? productRows.reduce((sum, row) => sum + Number(row.margin), 0) / productRows.length : 0;
    const income = (finance.data ?? []).filter((row) => row.type === '收入').reduce((sum, row) => sum + Number(row.amount), 0);
    const expense = (finance.data ?? []).filter((row) => row.type === '支出').reduce((sum, row) => sum + Number(row.amount), 0);
    const currentGoals = (goals.data ?? []).filter((row) => row.status === '进行中');
    const latestHealth = health.data?.[0];
    const finishedBooks = (books.data ?? []).filter((row) => row.status === '已读').length;
    const reflectionCount = reflections.data?.length ?? 0;
    const noteCount = notes.data?.length ?? 0;

    const notionToken = Deno.env.get('NOTION_API_KEY');
    const parentPageId = Deno.env.get('NOTION_PARENT_PAGE_ID');
    if (!notionToken || !parentPageId) throw new Error('Notion 密钥或父页面 ID 尚未配置');
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: { title: { title: [{ text: { content: `Ryan's 个人看板复盘 · ${today}` } }] } },
        children: [
          { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '阶段数据摘要' } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '工作' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `候选产品：${productRows.length} 个；平均预估毛利率：${averageMargin.toFixed(2)}%` } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '副业' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `副业累计净利润：¥${sideProfit.toFixed(2)}` } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '身体' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: latestHealth ? `最新身体数据：${Number(latestHealth.weight).toFixed(2)} kg / 体脂 ${Number(latestHealth.body_fat).toFixed(2)}%` : '身体数据：待记录' } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '个人财务' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `个人财务结余：¥${(income - expense).toFixed(2)}` } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '读书清单' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `已读：${finishedBooks} 本` } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '总目标' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `当前目标：${currentGoals.length} 个` } }] } },
          { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: '计划和感悟' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `近期复盘：${reflectionCount} 条；计划与感悟：${noteCount} 条` } }] } },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Notion 同步失败：${await response.text()}`);
    return new Response(JSON.stringify({ ok: true, syncedAt: new Date().toISOString() }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : '同步失败' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
