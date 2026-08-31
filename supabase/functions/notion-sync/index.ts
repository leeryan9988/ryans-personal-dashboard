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

    const [profits, goals, health, finance, books] = await Promise.all([
      supabase.from('profit_logs').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('health_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
      supabase.from('finance_logs').select('*').eq('user_id', user.id),
      supabase.from('books').select('*').eq('user_id', user.id),
    ]);
    const sideProfit = (profits.data ?? []).reduce((sum, row) => sum + Number(row.profit), 0);
    const income = (finance.data ?? []).filter((row) => row.type === '收入').reduce((sum, row) => sum + Number(row.amount), 0);
    const expense = (finance.data ?? []).filter((row) => row.type === '支出').reduce((sum, row) => sum + Number(row.amount), 0);
    const currentGoals = (goals.data ?? []).filter((row) => row.status === '进行中');
    const latestHealth = health.data?.[0];
    const finishedBooks = (books.data ?? []).filter((row) => row.status === '已读').length;

    const notionToken = Deno.env.get('NOTION_API_KEY');
    const databaseId = Deno.env.get('NOTION_DATABASE_ID');
    if (!notionToken || !databaseId) throw new Error('Notion 密钥或数据库 ID 尚未配置');
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${notionToken}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: { Name: { title: [{ text: { content: `向上看板复盘 · ${today}` } }] }, Date: { date: { start: today } } },
        children: [
          { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: '阶段数据摘要' } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `副业累计净利润：¥${sideProfit}` } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `个人财务结余：¥${income - expense}` } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `当前目标：${currentGoals.length} 个；已读：${finishedBooks} 本` } }] } },
          { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: latestHealth ? `最新身体数据：${latestHealth.weight} kg / 体脂 ${latestHealth.body_fat}%` : '身体数据：待记录' } }] } },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Notion 同步失败：${await response.text()}`);
    return new Response(JSON.stringify({ ok: true, syncedAt: new Date().toISOString() }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : '同步失败' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
