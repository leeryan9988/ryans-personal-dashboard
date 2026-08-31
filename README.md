# 向上看板

一个以“记录 → 汇总分析 → 达成目标 → 确认新目标 → 保留历史”为核心的个人成长看板。

## 已包含的板块

- 工作：亚马逊产品开发（精铺），记录类目、产品、毛利率、供应链、专利审查和评论洞察。
- 副业：自媒体、网盘拉新、抖音电商，按周记录收入、成本和利润，自动分析平台贡献。
- 身体：体重、体脂率、训练次数和六个月目标趋势。
- 个人财务：收入、支出、结余、支出分类与历史流水。
- 读书清单：想读、在读、已读、进度、评分和核心笔记。
- 总目标：用扇形图和柱状图汇总五大板块的总体达成情况。
- 每个板块内置自己的目标更新、数据分析、阶段总结、图表与历史目标，不再设置独立分析或目标档案页面。

## 登录与实时同步

网站使用 Supabase 邮箱免密登录。用户在手机或电脑上使用同一个邮箱即可查看同一份数据。数据库启用了行级安全策略，每个账户只能访问自己的记录；数据库变更会通过 Realtime 触发看板刷新。

1. 在 Supabase 新建项目。
2. 在 SQL Editor 执行 `supabase/migrations/20260831190000_initial_dashboard.sql`。
3. 在 GitHub 仓库的 Actions secrets 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. 在 Supabase Authentication → URL Configuration 中添加 GitHub Pages 地址作为 Redirect URL。

未配置上述变量时，网站保持为空白看板，不加载任何演示记录。

## Notion 周复盘同步

项目包含 `supabase/functions/notion-sync` Edge Function。它只把当前阶段汇总写入指定 Notion 父页面下的新复盘页面，Notion 密钥不会进入 GitHub Pages 前端。

在 Supabase Edge Function secrets 中配置：

- `NOTION_API_KEY`
- `NOTION_PARENT_PAGE_ID`

然后部署 `notion-sync` 函数。登录后点击顶部 Notion 按钮即可生成一条阶段复盘。

## GitHub Pages

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动构建并发布独立 GitHub Pages。前端是静态站点，登录和数据服务由 Supabase 提供。

## 本地开发

```bash
pnpm install
pnpm dev
```

验证 GitHub Pages 静态构建：

```bash
pnpm exec vite build --config vite.pages.config.ts
```
