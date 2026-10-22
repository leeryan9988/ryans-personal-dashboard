# 全球早报云端自动更新

这个流程运行在 GitHub 托管的 Actions 机器上，不依赖个人电脑或 Codex 客户端保持启动。它只为现有看板追加每日早报，沿用 `public/news/index.json` 和每天一个 JSON 文件的页面结构。

## 一次性配置

1. 在 OpenAI API 平台创建可用的 API Key，并确认 API 账户可计费。ChatGPT/Codex 订阅与 API 计费分开。
2. 打开这个仓库的 **Settings → Secrets and variables → Actions → New repository secret**，名称填 `OPENAI_API_KEY`，值填 API Key。不要把 Key 写进文件、Issue 或聊天消息。
3. 在 **Actions → Prepare and publish global news briefing → Run workflow** 手动运行 `draft`。检查日志中找到足够的不同原文链接，且 `.github/news-drafts/当天日期.json` 已追加。再运行 `finalize` 验证 50 条门槛、目录追加和 Pages 部署。当天若早报已存在，流程会跳过，不覆盖。

## 每日运行

- 北京时间 05:05 先搜索新闻并保存不对外展示的草稿。
- 北京时间 07:50 补搜到截稿时刻，至少选出 50 条不同报道，生成中文摘要及“机制、受影响对象、不能得出的结论”三部分分析，写入当天新文件并追加目录。
- 提交后显式触发仓库现有的 Pages 部署流程。因为 GitHub 内置 `GITHUB_TOKEN` 推送的提交不会自动触发另一个工作流，仅靠 `push` 不够。
- 页面用 `publishedAt` 在北京时间 08:00 打开新一期。GitHub 定时任务和部署都可能延迟，08:00 准点不能由 GitHub Actions 保证；若晚于 08:00 生成，正文会明确标为延迟补发。最终发布时间应以 Pages 部署记录为准。

若 API Key 不可用、找不到至少 50 条可打开原文、日期衔接不连续，或任一文章缺少摘要、来源、日期与三段分析，流程报错并停止，不覆盖旧期。打开仓库 Actions 的失败运行可见原因。原站找不到精确时分的报道标为“时间待核实”，不冒称精确时间已证实。OpenAI 模型与网页搜索会产生 API 费用，费用由 API 账户承担。

