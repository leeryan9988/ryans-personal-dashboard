# 全球早报归档

侧栏“全球早报”读取 `public/news/index.json`，再按需读取每天的 `YYYY-MM-DD.json`。所有日期以北京时间为准，最新一期默认展开，历史期默认折叠。归档保留原早报的来源链接和核验说明；聊天界面的引用占位符不进入页面。2026 年 10 月 20、21 日的旧期仍按当时的十二国口径保留，之后取消国别限制。

后续早报优先检索下列媒体，重点关注 AI、跨境贸易、经济与全球重大事件；新闻取舍以重要性为准，不按国家或每国条数分配。取得完整早报文本后，保存为临时 Markdown 文件，运行：

```bash
node scripts/import-news-report.mjs path/to/report.md
```

目标是每天北京时间 08:00 在看板显示新一期。新口径报道截止到 07:50，以便预先部署；从 2026 年 10 月 22 日起第一期承接上一期的 08:00 截点，之后每期为前一天 07:50 至当天 07:50，时间段连续。脚本只追加新日期；同一日期重复运行会跳过，内容变化或日期不连续时会报错，避免覆盖旧期或跳过一天。检查差异后提交到 `main`，仓库现有 GitHub Pages 工作流会自动发布。页面根据 `publishedAt` 到 08:00 才显示预先部署的新一期。若预部署未在 08:00 前完成，则当天无法准点显示，需报告失败。此归档不写入个人记录数据库。

## 优先检索的媒体

用户提供的 30 家媒体及官网；它们是检索范围，不表示每家每天必须入选。核对所引文章确实存在、发布时间与原文链接后按其报道写中文摘要，不要求找第二家媒体交叉核验。核验标记写明“依据该媒体报道，未独立核验”；转载、评论和预测须按其原本性质呈现。

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

