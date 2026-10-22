# 全球早报云端自动更新

原看板的早报由 GitHub Actions 和 GitHub Pages 自动更新，不需要个人电脑或 Codex 客户端保持运行。每天只追加一个新日期的 JSON 文件，并更新 `public/news/index.json`；已发布的旧期不会被自动覆盖。

## 运行方式

- GitHub 在北京时间每天 07:50（UTC 前一天 23:50）启动 `.github/workflows/cloud-news-briefing.yml`。
- `scripts/cloud-news-feed-only.mjs` 读取媒体官方 RSS，使用来源给出的发布时间，只收录从上一期 `windowEnd` 到本期 07:50 的报道。按原文链接和标题相似度去重，过滤明显的体育、娱乐及生活类标题，优先排列 AI、跨境贸易、经济和重大事件。
- 当期有多少条合格新闻就发布多少条，没有 50 条门槛或 60 条上限；若一条都没有，流程失败且不发布空白期。标题保留媒体原文语言。每条列媒体、北京时间、官方 RSS 来源标记和可点击原文；不生成中文摘要或简析，也不调用 OpenAI API。
- 新日期文件写入 `main` 后，流程显式启动现有 `deploy-pages.yml`。这是必要步骤，因为 GitHub Actions 自带令牌推送的提交不会自动触发另一个 `push` 工作流。
- 页面按 `publishedAt` 在北京时间 08:00 显示当期。GitHub 定时任务和 Pages 部署可能延迟，不能保证秒级准点；若生成时间已晚于 08:00，正文明确标记“延迟补发”。实际对外可见时间以 Pages 部署完成时间为准。

可在仓库 **Actions → Publish global news from official feeds → Run workflow** 选择 `check`，只核对最近 24 小时的来源覆盖数，不修改早报。`publish` 只追加尚不存在的当天日期；当天已存在时直接跳过。

## 数据边界

官方 RSS 中的标题、链接和时间戳只是该媒体的发布信息，不能代替对报道内容的独立核验。自动去重依据链接与标题相似度，无法保证识别所有跨语言或不同表述的同一事件。媒体可能晚于发布时间才把文章放入 RSS，或临时停止提供订阅源；当前流程无法保证发现网上每一条新闻。出现异常可查看 GitHub Actions 运行日志，旧期会保留。

