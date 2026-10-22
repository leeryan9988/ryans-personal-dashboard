# 全球早报归档

侧栏“全球早报”读取 `public/news/index.json`，再按需读取每天的 `YYYY-MM-DD.json`。所有日期以北京时间为准，最新一期默认展开，历史期默认折叠。归档保留原早报的来源链接和核验说明；聊天界面的引用占位符不进入页面。2026 年 10 月 20、21 日的旧期仍按当时的十二国口径保留，之后取消国别限制。

自 2026 年 10 月 23 日起，云端版使用媒体官方 RSS 自动采集，按发布时间、原文链接和标题相似度筛选并去重，不按国家分配条数。每天发布当期实际取得的全部合格新闻，不设最低条数或固定上限；零条时不发布空白期。每条列原文标题、媒体名、北京时间、可点击原文及来源标记。根据用户最新要求，不生成中文摘要或逐条简析；历史期原有内容保持原样。重点仍是 AI、跨境贸易、经济与全球重大事件。当前接入的订阅源覆盖下表中的部分媒体及《世界报》，下表 30 家是可继续扩充的优先来源，并不表示已接入全部 30 家。

历史期或人工采编的完整早报文本仍可保存为临时 Markdown 文件，运行：

```bash
node scripts/import-news-report.mjs path/to/report.md
```

目标是每天北京时间 08:00 在看板显示新一期。GitHub 云端定时任务在 07:50 截稿后运行，窗口从上一期 `windowEnd` 连续接到当天 07:50。脚本只追加新日期；同一天重复运行跳过，日期缺口会报错，避免覆盖旧期。提交到 `main` 后显式启动仓库现有的 GitHub Pages 工作流。页面依 `publishedAt` 在 08:00 打开新一期，但 GitHub 定时启动或部署可能延迟；延迟补发不得冒称准点发布。此归档不写入个人记录数据库。

## 优先检索的媒体

用户提供的 30 家媒体及官网；它们是优先扩充来源，不表示每家每天必须入选。云端 RSS 流程只收录带可解析时间戳、官方域名原文链接的条目，不对媒体内容作第二媒体交叉核验。只有日期、没有具体时分的报道，当前自动流程无法精确归入窗口，因此不会自动收录；若以后人工补录，须标记“时间待核实”。核验标记说明“依据该媒体发布信息，未独立核验”。

| 媒体 | 官网 |
| --- | --- |
| 美联社 AP | https://apnews.com/ |
| 路透社 Reuters | https://www.reuters.com/ |
| 法新社 AFP | https://www.afp.com/ |
| 新华社 Xinhua | https://www.xinhuanet.com/ |
| BBC News | https://www.bbc.com/news |
| 纽约时报 | https://www.nytimes.com/ |
| 华盛顿邮报 | https://www.washingtonpost.com/ |
| 华尔街日报 | https://www.wsj.com/ |
| 彭博社 | https://www.bloomberg.com/ |
| 卫报 | https://www.theguardian.com/ |
| 金融时报 | https://www.ft.com/ |
| 半岛电视台 | https://www.aljazeera.com/ |
| NPR | https://www.npr.org/ |
| CNN | https://www.cnn.com/ |
| France 24 | https://www.france24.com/ |
| 德国通讯社 DPA | https://www.dpa.com/ |
| 塔斯社 TASS | https://tass.com/ |
| 共同社 Kyodo | https://english.kyodonews.net/ |
| 安纳多卢通讯社 | https://www.aa.com.tr/ |
| 中国日报 | https://www.chinadaily.com.cn/ |
| 洛杉矶时报 | https://www.latimes.com/ |
| 独立报 | https://www.independent.co.uk/ |
| 天空新闻 | https://news.sky.com/ |
| 今日俄罗斯 RT | https://www.rt.com/ |
| 福布斯 | https://www.forbes.com/ |
| 韩联社 Yonhap | https://en.yonhapnews.co.kr/ |
| 环球集团 Grupo Globo | https://www.globo.com/ |
| 澳大利亚广播公司 ABC | https://www.abc.net.au/ |
| 经济学人 | https://www.economist.com/ |
| NBC News | https://www.nbcnews.com/ |

