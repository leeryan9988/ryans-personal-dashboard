export type GithubPick = {
  name: string;
  url: string;
  stars: number;
  weeklyGain: number | null;
  functionZh: string;
  reasonZh: string;
  audience: string;
};

export type GithubUsageEdition = {
  title: string;
  publishedAt: string;
  publishedAtIso: string;
  growthWindow: string;
  risingSource: string;
  rising: GithubPick[];
  established: GithubPick[];
};

export const githubUsageEditions: GithubUsageEdition[] = [
{
  "title": "GitHub 使用",
  "publishedAt": "2026-11-09 08:06:19 北京时间",
  "publishedAtIso": "2026-11-09T00:06:19Z",
  "growthWindow": "2026.11.03—2026.11.08（OpenGithubs 周榜统计区间）；高星实用项目无可靠周增量，填 null",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/f76afca5f43a41961361507b449c02fb90f0fbcd/README.md",
  "rising": [
    {
      "name": "heydamir/unslop",
      "url": "https://github.com/heydamir/unslop",
      "stars": 11965,
      "weeklyGain": 3945,
      "functionZh": "面向 Codex、Claude Code 等工具的界面改版技能，可检查页面的排版、间距和视觉元素，再按选定方向逐步修改。",
      "reasonZh": "适合给已有看板或落地页做视觉审阅；近期仍在修复网页快照。分析在线页面需要 Playwright 和 Chromium，改动仍应通过真实设备和可访问性检查。",
      "audience": "网页设计、前端开发与 AI 辅助建站用户"
    },
    {
      "name": "storytold/craft-anything",
      "url": "https://github.com/storytold/craft-anything",
      "stars": 22557,
      "weeklyGain": 3836,
      "functionZh": "通过可见的网页、界面截图等资料研究软件行为，组织编程智能体构建独立原型，并检查原型与参考目标的差异。",
      "reasonZh": "适合学习产品交互和验证原型；近期有发布并持续修复。仍处于早期 Alpha，部分智能体接入未充分验证；只应使用有权使用的参考资料。",
      "audience": "独立开发者、产品原型和交互研究人员"
    },
    {
      "name": "wangzan101/Mika",
      "url": "https://github.com/wangzan101/Mika",
      "stars": 7737,
      "weeklyGain": 3339,
      "functionZh": "运行在安卓手机上的 AI 助手，可处理网页和文件，并在配对手机控制后，通过后台画面操作应用。",
      "reasonZh": "适合试验移动端重复操作；近期有版本发布和兼容性修复。需要配置模型，控制应用通常要配对无线调试；发送消息、下单等操作应先人工核对。",
      "audience": "安卓自动化和手机 AI 助手探索者"
    },
    {
      "name": "anhao/ai-pose-gallery-zh",
      "url": "https://github.com/anhao/ai-pose-gallery-zh",
      "stars": 6441,
      "weeklyGain": 2667,
      "functionZh": "把姿势白模、深度图、服装及人像参考整理为中文图库，并提供角色参考组合界面和 ComfyUI 节点。",
      "reasonZh": "适合快速找姿势和构图参考；近期仍整理素材索引。图库含默认隐藏的成人向素材，原图版权属于原作者；商用或使用真人肖像前应另行核对授权。",
      "audience": "插画、角色设计与 ComfyUI 工作流用户"
    },
    {
      "name": "CopilotKit/OpenBot",
      "url": "https://github.com/CopilotKit/OpenBot",
      "stars": 10478,
      "weeklyGain": 2813,
      "functionZh": "可自建的 AI 助手工作台，为助手提供浏览器、文件和工具，可接入 AG-UI 智能体并记录操作。",
      "reasonZh": "适合试验可审阅的助手流程；近期有新版本及安装更新修复。需配置模型与运行环境；多人使用前应设置登录和工具权限，敏感操作仍需人工审批。",
      "audience": "智能体开发、自动化与内部工具维护团队"
    }
  ],
  "established": [
    {
      "name": "qgis/QGIS",
      "url": "https://github.com/qgis/QGIS",
      "stars": 14797,
      "weeklyGain": null,
      "functionZh": "跨平台地理信息系统，管理矢量、栅格等空间数据，可制作专题地图并执行空间分析。",
      "reasonZh": "适合把地理数据整理成可解释的地图；近期仍有测试和界面维护。分析前应核对数据来源与坐标参考系，插件需确认版本兼容。",
      "audience": "地图制作者、地理研究及空间数据分析人员"
    },
    {
      "name": "OpenRefine/OpenRefine",
      "url": "https://github.com/OpenRefine/OpenRefine",
      "stars": 12090,
      "weeklyGain": null,
      "functionZh": "在本机浏览器中导入、检查和清洗杂乱数据，支持对齐外部数据源并补充信息。",
      "reasonZh": "适合清理表格中的拼写差异、重复项及格式问题；近期仍修复数据关联功能。批量转换前应保留原始文件，使用在线对齐服务时应核对发送的数据范围。",
      "audience": "表格清洗、数据分析与资料整理人员"
    },
    {
      "name": "prusa3d/PrusaSlicer",
      "url": "https://github.com/prusa3d/PrusaSlicer",
      "stars": 9467,
      "weeklyGain": null,
      "functionZh": "把三维模型切片成打印指令，支持 FDM 和 mSLA 打印机，可调整打印参数并预览生成的指令。",
      "reasonZh": "适合检查模型布局和打印设置；近期仍更新配置及测试版。应按实际打印机和材料选择配置，日常打印宜优先使用稳定版。",
      "audience": "三维打印用户、创客与原型制作人员"
    },
    {
      "name": "KDE/krita",
      "url": "https://github.com/KDE/krita",
      "stars": 10717,
      "weeklyGain": null,
      "functionZh": "开源数字绘画软件，用于从草图到成稿的插画、漫画、概念设计及贴图绘制。",
      "reasonZh": "适合在桌面上完成绘画项目；GitHub 镜像近期仍同步构建修复。主仓库和问题跟踪由 KDE 维护，日常创作可从官网选择稳定版。",
      "audience": "插画师、漫画作者与数字绘画学习者"
    },
    {
      "name": "google-deepmind/mujoco",
      "url": "https://github.com/google-deepmind/mujoco",
      "stars": 16392,
      "weeklyGain": null,
      "functionZh": "通用物理仿真引擎，模拟多关节结构与环境的接触和运动，提供交互可视化、C API 和 Python 绑定。",
      "reasonZh": "适合在实物实验前测试机器人或运动模型；近期有版本发布和文档维护。需要建模和编程基础，仿真精度取决于参数，结果仍应与实测对照。",
      "audience": "机器人、生物力学及物理仿真研究开发人员"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-11-06 08:00:03 北京时间",
  "publishedAtIso": "2026-11-06T00:00:03Z",
  "growthWindow": "2026.10.27—2026.11.01（OpenGithubs 最新可用周榜）；2026.11.06 Trending 日榜仅作热度参考，auto-ontology 无可靠周增量，填 null",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/618073b7ea027551ee5eee0b193d59d5dbdda3a9/README.md",
  "rising": [
    {
      "name": "DuarteSantos8/openGym",
      "url": "https://github.com/DuarteSantos8/openGym",
      "stars": 19718,
      "weeklyGain": 2471,
      "functionZh": "开源健身与体重记录工具，可安排训练计划、记录组数重量、查看训练肌群和进度，并支持手机独立使用或自建同步服务。",
      "reasonZh": "适合把训练历史留在自己掌握的设备上；近期仍更新文档与版本。自建同步需要维护服务器和备份，训练建议与估算指标应结合个人情况判断。",
      "audience": "健身记录、力量训练与自建服务用户"
    },
    {
      "name": "anthropics/knowledge-work-plugins",
      "url": "https://github.com/anthropics/knowledge-work-plugins",
      "stars": 34860,
      "weeklyGain": 1896,
      "functionZh": "面向 Claude Cowork 和 Claude Code 的岗位插件集合，把技能、命令及工具连接组织为营销、销售、数据、产品等工作流程。",
      "reasonZh": "适合参考和定制自己的业务助手；近期仍更新连接组件。需要匹配的 Claude 环境和外部服务权限，插件模板不能保证业务结果，重要输出仍需审核。",
      "audience": "知识工作者、运营与业务流程维护人员"
    },
    {
      "name": "citrolabs/ego-lite",
      "url": "https://github.com/citrolabs/ego-lite",
      "stars": 21786,
      "weeklyGain": 1843,
      "functionZh": "为人与 AI 智能体提供独立工作空间的浏览器，通过配套技能让智能体操作网页，同时使用迁移的登录状态与浏览器资料。",
      "reasonZh": "适合探索浏览器自动化；近期仍有 Beta 发布维护。提供 Windows 和 macOS 客户端，Linux 尚在路线图；迁移账号会扩大智能体可访问范围，应控制授权并检查重要操作。",
      "audience": "网页自动化与 AI 助手工作流用户"
    },
    {
      "name": "vorssaint/vorssaint-utils",
      "url": "https://github.com/vorssaint/vorssaint-utils",
      "stars": 33086,
      "weeklyGain": 1665,
      "functionZh": "macOS 菜单栏工具箱，集合应用音量、系统监测、窗口布局、剪贴板历史和卸载等功能，可按需启用模块。",
      "reasonZh": "适合希望集中管理桌面工具的人；近期仍更新改进记录。要求 Apple Silicon 与 macOS 14 或更新版本，部分功能需要辅助功能或录屏权限，麦克风静音不是隐私隔离保证。",
      "audience": "Apple Silicon Mac 用户与桌面效率爱好者"
    },
    {
      "name": "NVIDIA/auto-ontology",
      "url": "https://github.com/NVIDIA/auto-ontology",
      "stars": 7264,
      "weeklyGain": null,
      "functionZh": "从企业数据与元数据构建语义目录和知识图谱，为自然语言查询、SQL 生成、定义核验及数据来源追溯提供上下文层。",
      "reasonZh": "适合研究跨数据源的智能查询；近期发布版本更新。需要部署数据库和服务并配置模型端点/API 密钥，接入业务数据前应核对权限，不能保证生成查询始终正确。",
      "audience": "数据平台、知识图谱与企业 AI 应用开发者"
    }
  ],
  "established": [
    {
      "name": "mltframework/shotcut",
      "url": "https://github.com/mltframework/shotcut",
      "stars": 15612,
      "weeklyGain": null,
      "functionZh": "免费的跨平台视频编辑器，基于 MLT、FFmpeg 和 Qt 提供桌面视频剪辑环境，可从官方渠道直接下载安装。",
      "reasonZh": "适合制作演示、短片和日常视频；近期仍修复音频混音问题。建议使用稳定版，复杂工程先用实际素材测试，并保存项目和源文件备份。",
      "audience": "视频剪辑入门者、教程与内容创作者"
    },
    {
      "name": "localsend/localsend",
      "url": "https://github.com/localsend/localsend",
      "stars": 97441,
      "weeklyGain": null,
      "functionZh": "在同一局域网的设备之间发送文件和消息，支持 Windows、macOS、Linux、Android 和 iOS，无需第三方中转服务器。",
      "reasonZh": "适合手机与电脑之间快速传照片和资料；近期仍修复桌面兼容问题。设备必须能够在局域网互通，防火墙和访客网络隔离可能影响发现与传输。",
      "audience": "多设备用户、照片与文件传输用户"
    },
    {
      "name": "immich-app/immich",
      "url": "https://github.com/immich-app/immich",
      "stars": 118340,
      "weeklyGain": null,
      "functionZh": "自建照片与视频管理服务，提供手机备份、相册共享、元数据查看、人脸及对象搜索等功能。",
      "reasonZh": "适合集中整理个人或家庭影像；近期持续维护。需要服务器和存储规划，官方提醒采用 3-2-1 备份，不能把单个相册服务当作唯一副本。",
      "audience": "摄影爱好者、家庭相册与 NAS 用户"
    },
    {
      "name": "Kareadita/Kavita",
      "url": "https://github.com/Kareadita/Kavita",
      "stars": 12061,
      "weeklyGain": null,
      "functionZh": "可自建的跨平台阅读服务器，管理 EPUB、PDF、漫画和图片合集，提供网页阅读、搜索、阅读清单及用户权限。",
      "reasonZh": "适合把已有电子书和漫画集中阅读；近期仍有版本更新。项目仍处 Beta，升级前应备份数据库；部分在线元数据等功能属于付费 Kavita+，分享内容需有相应权利。",
      "audience": "电子书、漫画阅读与家庭书库用户"
    },
    {
      "name": "nomacs/nomacs",
      "url": "https://github.com/nomacs/nomacs",
      "stars": 3300,
      "weeklyGain": null,
      "functionZh": "免费的跨平台图片查看器，支持常见图片、RAW 与 PSD 等格式，可用于浏览照片及查看图像信息。",
      "reasonZh": "适合快速查看本地照片与设计文件；近期仍修复文件排序。具体格式和功能取决于安装包及可选组件，应以所用平台稳定版的支持情况为准。",
      "audience": "摄影爱好者、图片整理与设计素材用户"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-11-04 08:00:45 北京时间",
  "publishedAtIso": "2026-11-04T00:00:45Z",
  "growthWindow": "2026.10.27—2026.11.01（OpenGithubs 周榜统计区间）",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/618073b7ea027551ee5eee0b193d59d5dbdda3a9/README.md",
  "rising": [
    {
      "name": "unclebob/ub-mode",
      "url": "https://github.com/unclebob/ub-mode",
      "stars": 6784,
      "weeklyGain": 3164,
      "functionZh": "为编程智能体提供工程实践技能，组织从实现、测试到重构的流程，并结合复杂度、重复代码和变异测试等配套检查工具。",
      "reasonZh": "适合希望约束 AI 编程过程、把工作拆成可验证小步骤的人；近期仍有维护。技能和配套工具需分别配置，检查阈值也应结合项目判断，不能替代代码审阅。",
      "audience": "AI 辅助开发、测试与代码质量管理人员"
    },
    {
      "name": "xiaoyang111222/cn-math-taxonomy",
      "url": "https://github.com/xiaoyang111222/cn-math-taxonomy",
      "stars": 6376,
      "weeklyGain": 2703,
      "functionZh": "把中小学及高中多学科知识组织成知识点和先修关系图谱，附题库、在线探索和前置知识诊断演示。",
      "reasonZh": "适合研究知识图谱和学习路径；近期仍补充题目与图示。部分课标映射和题目仍待核验，先修关系需要教师审核，商业使用需另获授权。",
      "audience": "教师、家长与教育应用开发者"
    },
    {
      "name": "NVIDIA/SkillSpector",
      "url": "https://github.com/NVIDIA/SkillSpector",
      "stars": 24208,
      "weeklyGain": 2439,
      "functionZh": "扫描 AI 智能体技能中的危险模式与依赖风险，结合静态分析和可选的模型语义分析，输出风险评分及多种格式报告。",
      "reasonZh": "适合安装第三方技能前进行初筛；近期仍修复分析误报。静态扫描可不调用模型，语义分析需配置服务；报告可能有误报或漏报，不能保证技能绝对安全。",
      "audience": "Codex 等工具用户、技能维护者与安全团队"
    },
    {
      "name": "rddmwmddr/android-ad-cleaner",
      "url": "https://github.com/rddmwmddr/android-ad-cleaner",
      "stars": 6070,
      "weeklyGain": 1851,
      "functionZh": "通过 ADB 和机型适配流程调整安卓系统及应用自带的广告、推荐和营销通知开关，提供 Windows、Mac 桌面客户端及恢复说明。",
      "reasonZh": "适合希望减少手机营销干扰的人；近期发布了兼容性修复。需要开启 USB 调试并核对具体机型，部分适配仍待复测，执行前应保存备份并逐项确认更改。",
      "audience": "国产安卓手机用户与设备维护人员"
    },
    {
      "name": "baidu/Unlimited-OCR",
      "url": "https://github.com/baidu/Unlimited-OCR",
      "stars": 30478,
      "weeklyGain": 1667,
      "functionZh": "提供面向长文档的 OCR 与多页解析模型和推理代码，支持按页序输入图像，利用跨页上下文输出解析结果。",
      "reasonZh": "适合研究长篇扫描件和文档解析；近期仍更新模型资料。示例使用高显存 NVIDIA GPU，属于需要部署的模型项目，识别结果与跨页合并仍需人工核对。",
      "audience": "文档处理、知识库与 OCR 开发者"
    }
  ],
  "established": [
    {
      "name": "musescore/MuseScore",
      "url": "https://github.com/musescore/MuseScore",
      "stars": 15352,
      "weeklyGain": null,
      "functionZh": "开源制谱与作曲软件，可输入和编辑乐谱、播放乐谱，导入导出 MusicXML 和 MIDI，并打印或生成 PDF。",
      "reasonZh": "适合学习制谱、编曲和整理演奏谱；近期仍修复编辑功能。日常使用优先选择官方稳定版，复杂谱面的导入与排版应逐页检查。",
      "audience": "音乐学习者、教师、作曲与编曲人员"
    },
    {
      "name": "LMMS/lmms",
      "url": "https://github.com/LMMS/lmms",
      "stars": 10595,
      "weeklyGain": null,
      "functionZh": "跨平台音乐制作软件，提供钢琴卷帘、节拍编排、歌曲编辑器、混音器及乐器效果插件，用于创作和编排音乐。",
      "reasonZh": "适合尝试电子音乐、节奏和伴奏制作；近期仍有修复提交。插件格式与平台兼容性需核对，想取得稳定效果仍需要学习编曲和混音基础。",
      "audience": "音乐制作入门者与电子音乐创作者"
    },
    {
      "name": "TriliumNext/Trilium",
      "url": "https://github.com/TriliumNext/Trilium",
      "stars": 38691,
      "weeklyGain": null,
      "functionZh": "跨平台层级笔记应用，支持深层树状组织、全文搜索、笔记版本、关系图、画布及自建同步服务，用于构建个人知识库。",
      "reasonZh": "适合长期整理大量关联资料；近期仍有维护。提供中文界面和稳定版，若使用自建同步，需要自行安排服务器、升级与备份。",
      "audience": "个人知识管理、研究笔记与自建服务用户"
    },
    {
      "name": "FreeTubeApp/FreeTube",
      "url": "https://github.com/FreeTubeApp/FreeTube",
      "stars": 22311,
      "weeklyGain": null,
      "functionZh": "面向隐私的桌面 YouTube 播放器，可在不登录账号的情况下管理订阅、播放列表和历史，并将这些记录保存在本机。",
      "reasonZh": "适合希望把观看记录留在本地的人；近期仍维护翻译与程序。项目处于 Beta，依赖第三方提取方式，源站变化可能影响播放，也不能消除视频请求本身的网络可见性。",
      "audience": "YouTube 桌面观看与本地订阅管理用户"
    },
    {
      "name": "files-community/Files",
      "url": "https://github.com/files-community/Files",
      "stars": 46479,
      "weeklyGain": null,
      "functionZh": "为 Windows 提供文件与文件夹管理界面，支持多任务操作、文件标签和系统集成，便于组织日常资料。",
      "reasonZh": "适合想改进文件整理体验的 Windows 用户；近期仍更新依赖。可选 Microsoft Store 购买或官方经典安装程序，预览版与稳定版应按需求区分。",
      "audience": "Windows 文件整理与桌面效率用户"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-11-02 08:00:06 北京时间",
  "publishedAtIso": "2026-11-02T00:00:06Z",
  "growthWindow": "2026.11.02 Trending 日榜热度参考；OpenGithubs 最新可用周榜仍为 2026.10.20—2026.10.25，未获得本期可靠周增量，均为 null",
  "risingSource": "https://github.com/trending",
  "rising": [
    {
      "name": "cjpais/Handy",
      "url": "https://github.com/cjpais/Handy",
      "stars": 36519,
      "weeklyGain": null,
      "functionZh": "跨平台离线语音转文字工具，按快捷键录音后在本机识别，再把文字输入当前应用，支持 Whisper 等模型。",
      "reasonZh": "适合口述笔记、长文本和面试回答草稿；近期仍修复平台兼容问题。需要麦克风及相关系统权限，准确度和速度受模型、语言与硬件影响；它提供转写，不等于双向语音对话。",
      "audience": "经常口述输入的 Windows、macOS 与 Linux 用户"
    },
    {
      "name": "lightpanda-io/browser",
      "url": "https://github.com/lightpanda-io/browser",
      "stars": 40088,
      "weeklyGain": null,
      "functionZh": "面向 AI 和自动化的无头浏览器，可执行网页脚本、提取内容，并通过 CDP 与自动化客户端连接。",
      "reasonZh": "适合研究网页自动化与内容提取；近期仍有代码维护。Windows 需通过 WSL 使用，网页兼容性应实测；项目方的性能基准不能代表所有网站。",
      "audience": "网页自动化、智能体与数据采集开发者"
    },
    {
      "name": "thedotmack/claude-mem",
      "url": "https://github.com/thedotmack/claude-mem",
      "stars": 109203,
      "weeklyGain": null,
      "functionZh": "自动记录编程智能体会话中的工作观察，压缩并保存为可检索记忆，在后续会话中按需恢复项目上下文。",
      "reasonZh": "适合希望减少跨会话重复说明的人；近期仍有维护。需核对所用工具的集成方式、模型费用和保存范围，不能把项目宣传的额度节省比例当保证。",
      "audience": "长期使用编程智能体的个人与开发团队"
    },
    {
      "name": "kornia/kornia",
      "url": "https://github.com/kornia/kornia",
      "stars": 11772,
      "weeklyGain": null,
      "functionZh": "基于 PyTorch 的可微分计算机视觉库，提供图像变换、数据增强、几何视觉和批处理能力，并可使用 GPU 加速。",
      "reasonZh": "适合把图像处理步骤接入训练和推理流程；近期仍修复几何算法。它是 Python 开发库，需要编程基础，并非直接安装即可修图的桌面软件。",
      "audience": "计算机视觉、影像算法与 AI 开发者"
    },
    {
      "name": "hyprwm/Hyprland",
      "url": "https://github.com/hyprwm/Hyprland",
      "stars": 39355,
      "weeklyGain": null,
      "functionZh": "高度可配置的动态平铺 Wayland 合成器，提供工作区、窗口规则、动画、插件和进程间控制接口。",
      "reasonZh": "适合定制 Linux 桌面与键盘工作流；近期仍持续开发。需要相容的 Linux 图形环境及配置经验，不是 Windows 桌面替换程序。",
      "audience": "Linux 桌面定制与效率工具爱好者"
    }
  ],
  "established": [
    {
      "name": "mpv-player/mpv",
      "url": "https://github.com/mpv-player/mpv",
      "stars": 37663,
      "weeklyGain": null,
      "functionZh": "开源命令行媒体播放器，支持多种音视频格式、字幕、脚本和可调播放参数，可在 Windows、macOS 与 Linux 使用。",
      "reasonZh": "适合希望精细控制播放和复用脚本的人；近期仍维护音频与播放相关代码。界面较简洁，部分硬件解码和低性能设备参数需自行配置。",
      "audience": "影音播放、字幕与脚本工作流用户"
    },
    {
      "name": "notepad-plus-plus/notepad-plus-plus",
      "url": "https://github.com/notepad-plus-plus/notepad-plus-plus",
      "stars": 29759,
      "weeklyGain": null,
      "functionZh": "Windows 文本与源代码编辑器，支持多种编程语言和自然语言文件，可用于编辑文本、查看配置与阅读代码。",
      "reasonZh": "适合日常处理纯文本和配置文件；近期仍改进界面行为。它是文本编辑器，不能替代完整的构建或运行环境，应从官方发布渠道下载安装。",
      "audience": "Windows 文本处理与轻量代码编辑用户"
    },
    {
      "name": "openscad/openscad",
      "url": "https://github.com/openscad/openscad",
      "stars": 10567,
      "weeklyGain": null,
      "functionZh": "通过脚本描述几何形状并生成实体三维 CAD 模型，支持参数化修改、组合几何与二维轮廓挤出，可导入导出 STL 等格式。",
      "reasonZh": "适合制作尺寸明确的零件、可定制模型和三维打印原型；近期仍维护代码与构建。使用方式偏编程，需要学习建模语法并检查最终尺寸。",
      "audience": "参数化建模、三维打印与创客用户"
    },
    {
      "name": "DIYgod/RSSHub",
      "url": "https://github.com/DIYgod/RSSHub",
      "stars": 46753,
      "weeklyGain": null,
      "functionZh": "把多种网站和服务的内容转换成 RSS 订阅源，通过不同路由集中获取更新，也可自行部署实例。",
      "reasonZh": "适合建立信息订阅和阅读流程；近期仍修复路由。各来源可能需要账号、配置或受访问限制，源站变化会影响可用性，应检查所需路由。",
      "audience": "新闻订阅、研究资料收集与自建服务用户"
    },
    {
      "name": "Devolutions/UniGetUI",
      "url": "https://github.com/Devolutions/UniGetUI",
      "stars": 26806,
      "weeklyGain": null,
      "functionZh": "用统一图形界面搜索、安装、升级和卸载多个包管理器的软件，重点支持 Windows，也提供其他系统的构建。",
      "reasonZh": "适合集中管理电脑上的应用；近期仍修复仓库刷新问题。仓库已迁移到 Devolutions，安装包及软件源应核对发布者；不要将第三方同名网站当官方渠道。",
      "audience": "Windows 软件管理与多包管理器用户"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-30 08:03:54 北京时间",
  "publishedAtIso": "2026-10-30T00:03:54Z",
  "growthWindow": "2026.10.20—2026.10.25（OpenGithubs 最新可用周榜）；2026.10.30 Trending 日榜仅作热度参考，日增量不作周增量",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/0c3c92347fad09a8ba034f6cd55015f0080e0590/README.md",
  "rising": [
    {
      "name": "pbakaus/impeccable",
      "url": "https://github.com/pbakaus/impeccable",
      "stars": 95269,
      "weeklyGain": null,
      "functionZh": "供 Codex 等编程智能体使用的界面设计技能，提供布局、排版、打磨、审计等命令，并用确定性规则检查常见设计问题。",
      "reasonZh": "适合对已有网页逐块改进；近期仍有修复提交。技能能给出设计方向和检查结果，不能替代真实设备上的功能与可用性验收。",
      "audience": "使用编程智能体制作网页的开发者与设计者"
    },
    {
      "name": "JetBrains/thinkrail",
      "url": "https://github.com/JetBrains/thinkrail",
      "stars": 5988,
      "weeklyGain": null,
      "functionZh": "JetBrains 孵化中的智能体 IDE，围绕 pi 提供编辑器、终端、独立工作区、Git 变更审阅及随项目维护的规格文档。",
      "reasonZh": "适合希望在图形界面组织智能体开发任务的人；近期持续开发。项目仍处孵化阶段，模型服务与凭据需自行配置，应先用小项目评估稳定性。",
      "audience": "AI 辅助开发与项目维护人员"
    },
    {
      "name": "nightly-labs/openbot",
      "url": "https://github.com/nightly-labs/openbot",
      "stars": 3859,
      "weeklyGain": null,
      "functionZh": "本地优先的桌面智能体工作区，为 Codex、Claude 等工具提供独立会话、任务队列、文件交换、内置浏览器和智能体间通信。",
      "reasonZh": "适合管理多个持续工作的助手；近期仍有更新，提供 Windows 安装包。当前是开发预览，智能体可在较高权限下执行操作，许可也有非商业限制，试用前需认真核对。",
      "audience": "多智能体工作流探索者与开发者"
    },
    {
      "name": "Donchitos/Claude-Code-Game-Studios",
      "url": "https://github.com/Donchitos/Claude-Code-Game-Studios",
      "stars": 29148,
      "weeklyGain": null,
      "functionZh": "为 Claude Code 配置游戏工作室式分工，包含设计、程序、美术、音频和测试等角色，以及从策划到交付的技能、模板和检查流程。",
      "reasonZh": "适合独立游戏开发者参考如何组织 AI 协作；近期发布了流程重构版本。它是工作流配置，需要配合实际引擎、素材和测试，不能保证自动完成或交付游戏。",
      "audience": "独立游戏开发者与 AI 协作流程研究者"
    },
    {
      "name": "hypit-ai/hypit",
      "url": "https://github.com/hypit-ai/hypit",
      "stars": 26493,
      "weeklyGain": 2341,
      "functionZh": "让编程智能体用可编辑工作流制作视频，可从文字或模板开始，编排字幕、素材、动态图形和效果，并渲染成片。",
      "reasonZh": "适合尝试可重复的视频制作流程；近期仍有维护记录。生成模型是可选项，智能体及外部模型服务可能收费；参考素材和人物形象应取得相应授权，不应把宣传播放量当效果保证。",
      "audience": "视频创作者、营销素材制作与自动化开发者"
    }
  ],
  "established": [
    {
      "name": "blender/blender",
      "url": "https://github.com/blender/blender",
      "stars": 21420,
      "weeklyGain": null,
      "functionZh": "免费的三维创作套件，覆盖建模、骨骼绑定、动画、模拟、渲染、合成、运动跟踪和视频编辑等流程。",
      "reasonZh": "适合制作三维作品、产品展示和动画；官方 GitHub 镜像近期仍同步开发提交。功能广、学习成本较高，建议从单个小作品入门并优先使用稳定版。",
      "audience": "三维设计、动画与视觉内容创作者"
    },
    {
      "name": "gchq/CyberChef",
      "url": "https://github.com/gchq/CyberChef",
      "stars": 36250,
      "weeklyGain": null,
      "functionZh": "在浏览器中通过拖放步骤处理文本和文件，支持编码转换、哈希校验、压缩解压及多种数据解析，并可保存处理配方。",
      "reasonZh": "适合查看编码内容、转换数据和复用处理步骤；近期仍更新依赖。可自行部署，敏感数据应在可信环境处理，加密操作也需使用正确的算法和参数。",
      "audience": "开发者、数据整理与技术分析人员"
    },
    {
      "name": "ShareX/ShareX",
      "url": "https://github.com/ShareX/ShareX",
      "stars": 40510,
      "weeklyGain": null,
      "functionZh": "Windows 截图、录屏和文件分享工具，支持滚动截图、标注、GIF、OCR、颜色拾取以及按快捷键执行的捕获后处理流程。",
      "reasonZh": "适合写教程、反馈问题和录制短演示；近期仍改进界面。可只保存到本地，启用自动上传前应核对目标服务及截图中的隐私信息。",
      "audience": "Windows 用户、内容作者与技术支持人员"
    },
    {
      "name": "actualbudget/actual",
      "url": "https://github.com/actualbudget/actual",
      "stars": 29862,
      "weeklyGain": null,
      "functionZh": "本地优先的个人预算工具，支持记账、信封预算法和跨设备同步，可使用桌面应用、自建服务或第三方托管。",
      "reasonZh": "适合整理家庭收支和持续跟踪预算；近期仍修复交互问题。开源应用本身免费，选择托管服务仍可能收费，记账资料需要备份。",
      "audience": "个人与家庭预算管理用户"
    },
    {
      "name": "ente/ente",
      "url": "https://github.com/ente/ente",
      "stars": 29746,
      "weeklyGain": null,
      "functionZh": "提供端到端加密的跨平台应用与服务源码，包括照片备份管理、两步验证器和重要资料保管工具，也支持自建部署。",
      "reasonZh": "适合重视照片和账号资料隐私、需要跨设备使用的人；近期仍改进照片命令行功能。各产品收费与额度不同，云照片服务和自建运维都应提前评估成本及恢复方式。",
      "audience": "照片备份、两步验证与隐私管理用户"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-28 08:00:05 北京时间",
  "publishedAtIso": "2026-10-28T00:00:05Z",
  "growthWindow": "2026.10.20—2026.10.25（OpenGithubs 周榜）；2026.10.28 Trending 日榜仅作热度参考，日增量不作周增量",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/0c3c92347fad09a8ba034f6cd55015f0080e0590/README.md",
  "rising": [
    {
      "name": "gitroomhq/postiz-app",
      "url": "https://github.com/gitroomhq/postiz-app",
      "stars": 39347,
      "weeklyGain": null,
      "functionZh": "社交媒体内容管理平台，可安排多平台发帖、自动化发布流程并分析内容表现，提供自建版和托管服务。",
      "reasonZh": "适合集中管理海外内容渠道；近期仍有安全修复。自建部署需配置各平台授权，不能据此认定支持微信公众号或小红书，使用前应核对平台接口和部署版本。",
      "audience": "内容创作者、社媒运营与自动化团队"
    },
    {
      "name": "HKUDS/DeepTutor",
      "url": "https://github.com/HKUDS/DeepTutor",
      "stars": 45826,
      "weeklyGain": null,
      "functionZh": "可自建的 AI 学习工作区，把资料知识库、问答、练习题、引导学习、阅读与可视化串成同一套学习流程。",
      "reasonZh": "适合围绕自己的教材建立学习辅助系统；近期发布了学习路径和恢复能力更新。需配置模型服务，部分功能还需检索或嵌入服务，生成答案应对照原资料复核。",
      "audience": "自主学习者、教师与教育应用开发者"
    },
    {
      "name": "Nutlope/hallmark",
      "url": "https://github.com/Nutlope/hallmark",
      "stars": 38948,
      "weeklyGain": null,
      "functionZh": "供 Codex、Claude Code 等编程智能体使用的网页设计技能，包含主题、页面改版与审计流程，并在浏览器检查布局和可用性。",
      "reasonZh": "适合改善 AI 生成页面的重复模板感；近期仍有主题与修复更新。它提供设计指令和检查流程，最终效果仍需结合真实内容与项目功能验收。",
      "audience": "使用编程智能体制作网站的开发者与设计者"
    },
    {
      "name": "HeyPuter/everything",
      "url": "https://github.com/HeyPuter/everything",
      "stars": 4396,
      "weeklyGain": 1781,
      "functionZh": "集中开发多个开源网页应用，涵盖文档、表格、协作、创作等领域，部分应用附在线演示和独立源码入口。",
      "reasonZh": "适合寻找可运行原型或学习完整应用实现；近期仍更新表格功能。各应用成熟度不同，不能把整体目标当成已具备商业软件的全部能力，试用前需核对具体子项目。",
      "audience": "开源办公工具探索者与网页应用开发者"
    },
    {
      "name": "ly05010419/MacNativeGames",
      "url": "https://github.com/ly05010419/MacNativeGames",
      "stars": 6028,
      "weeklyGain": 2416,
      "functionZh": "研究在 Apple 芯片设备上直接运行自备 Switch 游戏 ARM64 代码，并将 NVN 图形接口映射到 Metal，提供实验与构建记录。",
      "reasonZh": "适合研究游戏图形兼容与移植；近期持续补充着色器兼容记录。项目不包含游戏内容，需自备游戏及设备导出的文件，不同游戏和系统版本的支持程度不同。",
      "audience": "Apple 芯片用户与游戏兼容技术研究者"
    }
  ],
  "established": [
    {
      "name": "darktable-org/darktable",
      "url": "https://github.com/darktable-org/darktable",
      "stars": 13345,
      "weeklyGain": null,
      "functionZh": "开源摄影工作流与非破坏性 RAW 处理工具，可管理数码底片、调整影像并导出成片，原始文件可保留。",
      "reasonZh": "适合系统学习摄影后期和批量处理照片；近期仍有维护提交，提供 Windows 等平台版本。操作方式有学习门槛，速度取决于硬件与所用处理模块。",
      "audience": "摄影爱好者、人像拍摄与 RAW 后期用户"
    },
    {
      "name": "HandBrake/HandBrake",
      "url": "https://github.com/HandBrake/HandBrake",
      "stars": 24805,
      "weeklyGain": null,
      "functionZh": "跨平台视频转码工具，把已有视频转换为 MP4、MKV 或 WebM 等格式，便于在电脑、手机、电视及网页播放。",
      "reasonZh": "适合整理手机视频、录屏和交付素材；近期仍改进 Windows 界面。转码画质、体积和耗时存在取舍，建议保留原片再选择参数。",
      "audience": "视频创作者与个人影像管理用户"
    },
    {
      "name": "ankitects/anki",
      "url": "https://github.com/ankitects/anki",
      "stars": 32342,
      "weeklyGain": null,
      "functionZh": "采用间隔重复方法的记忆卡片程序，按复习计划反复呈现学习内容，仓库提供桌面版源码与开发说明。",
      "reasonZh": "适合长期记忆词汇、知识点和面试材料；近期仍更新依赖。复习效果依赖卡片质量和持续使用，应把复杂知识拆成清晰、可检验的小问题。",
      "audience": "语言学习者、考试备考与面试练习者"
    },
    {
      "name": "laurent22/joplin",
      "url": "https://github.com/laurent22/joplin",
      "stars": 56908,
      "weeklyGain": null,
      "functionZh": "以本地优先方式保存 Markdown 笔记和待办，支持笔记本、标签、全文搜索、网页剪藏及多设备同步，可启用端到端加密。",
      "reasonZh": "适合建立个人笔记系统并在 Windows 和手机间使用；近期仍有维护提交。需自行选择同步服务并配置加密与备份，云服务费用取决于所选方案。",
      "audience": "个人知识管理与跨设备笔记用户"
    },
    {
      "name": "qbittorrent/qBittorrent",
      "url": "https://github.com/qbittorrent/qBittorrent",
      "stars": 41168,
      "weeklyGain": null,
      "functionZh": "基于 Qt 和 libtorrent 的开源 BitTorrent 客户端，用于管理种子下载与文件分享，提供图形界面和多语言支持。",
      "reasonZh": "适合分发或下载获授权的大型文件；近期仍维护构建流程。实际速度取决于可用节点与网络，应从官方渠道获取程序并核对来源。",
      "audience": "需要 BitTorrent 文件传输的个人与技术用户"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-26 08:06:56 北京时间",
  "publishedAtIso": "2026-10-26T08:06:56+08:00",
  "growthWindow": "2026.10.20—2026.10.25（OpenGithubs 周榜统计区间）",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank/blob/0c3c92347fad09a8ba034f6cd55015f0080e0590/README.md",
  "rising": [
    {
      "name": "deepseek-ai/DeepInfer",
      "url": "https://github.com/deepseek-ai/DeepInfer",
      "stars": 22386,
      "weeklyGain": 9823,
      "functionZh": "为 DeepSeek 模型提供高性能离线推理框架，包含并行执行、异步调度、结构化输出和确定性采样等能力。",
      "reasonZh": "适合研究大规模推理基础设施；近期仍有修复提交。目前支持特定高端 GPU/NPU，完整在线服务还需补齐缓存、负载均衡等组件，普通 Windows 电脑不适合直接运行。",
      "audience": "模型部署与推理基础设施开发者"
    },
    {
      "name": "akitaonrails/ai-memory",
      "url": "https://github.com/akitaonrails/ai-memory",
      "stars": 13513,
      "weeklyGain": 3408,
      "functionZh": "为 Codex、Claude Code 等编程智能体提供共享长期记忆和任务交接，把项目经验保存为可检索、可版本管理的 Markdown。",
      "reasonZh": "适合跨工具或跨设备接续项目，默认基础流程无需模型 API；近期持续维护。Windows 原生支持仍标为实验性，WSL2 路线更成熟，记忆服务需自行维护。",
      "audience": "经常切换编程智能体的个人与团队"
    },
    {
      "name": "pengchujin/aerial-tv",
      "url": "https://github.com/pengchujin/aerial-tv",
      "stars": 4979,
      "weeklyGain": 2316,
      "functionZh": "为 Android 电视、盒子和投影仪提供简洁桌面，支持应用整理、手机配置、壁纸和航拍屏保。",
      "reasonZh": "适合想减少首页推荐干扰的人；近期仍更新机型适配。需按机型开启 ADB 并设置桌面接管，有兼容性限制，固件开机广告不能因此去除。",
      "audience": "Android 电视与投影仪用户"
    },
    {
      "name": "withmarbleapp/os-taxonomy",
      "url": "https://github.com/withmarbleapp/os-taxonomy",
      "stars": 7355,
      "weeklyGain": 2026,
      "functionZh": "把小学阶段知识拆成细粒度主题和先修关系，提供 JSON 数据、课程标准映射与部分教学建议，并附交互学习内容制作技能。",
      "reasonZh": "适合构建学习路径、课程图谱和教学原型；近期有课程映射更新。部分内容由智能体编写，覆盖与证据均有限，需教师复核并遵守各层数据许可。",
      "audience": "教育开发者、课程设计者与教师"
    },
    {
      "name": "NVIDIA/OpenShell",
      "url": "https://github.com/NVIDIA/OpenShell",
      "stars": 19860,
      "weeklyGain": 2839,
      "functionZh": "为自主 AI 智能体提供隔离运行环境，按策略限制文件、网络与系统调用，并通过受控接口使用凭据。",
      "reasonZh": "适合需要管理智能体工具权限的开发团队；近期仍有维护提交。需要容器或虚拟化环境，Windows WSL2 支持仍属实验性，安全策略需结合实际环境配置。",
      "audience": "智能体平台与安全基础设施开发者"
    }
  ],
  "established": [
    {
      "name": "kovidgoyal/calibre",
      "url": "https://github.com/kovidgoyal/calibre",
      "stars": 26251,
      "weeklyGain": null,
      "functionZh": "跨平台电子书管理器，可整理书库、查看、编辑和转换多种电子书格式，并与阅读设备传输内容、获取书籍元数据。",
      "reasonZh": "适合电子书多、格式杂或使用多个阅读设备的人；近期仍修复电子书文件处理问题，Windows、macOS 和 Linux 均可使用。",
      "audience": "电子书读者与个人书库管理者"
    },
    {
      "name": "FreeCAD/FreeCAD",
      "url": "https://github.com/FreeCAD/FreeCAD",
      "stars": 34775,
      "weeklyGain": null,
      "functionZh": "跨平台参数化三维建模工具，可通过带约束的二维草图建立模型，调整尺寸参数，并从三维模型生成工程图。",
      "reasonZh": "适合设计零件、产品原型和学习 CAD；近期仍有工程图修复提交。提供稳定版安装包，参数建模有学习门槛，正式制造前需核对尺寸与导出结果。",
      "audience": "机械设计、三维打印与工程学习者"
    },
    {
      "name": "audacity/audacity",
      "url": "https://github.com/audacity/audacity",
      "stars": 18831,
      "weeklyGain": null,
      "functionZh": "跨平台多轨音频编辑与录音软件，可用于录制声音、编排多段音轨和编辑音频素材。",
      "reasonZh": "适合录制口述、访谈、播客和整理音频；近期仍有开发提交。主分支正在进行 Audacity 4 的界面与架构改造，日常使用优先选择官方稳定发行版。",
      "audience": "播客、录音与音频内容创作者"
    },
    {
      "name": "rclone/rclone",
      "url": "https://github.com/rclone/rclone",
      "stars": 60541,
      "weeklyGain": null,
      "functionZh": "在本机与多种网盘、对象存储之间复制或同步文件和目录，可连接 OneDrive、Google Drive、S3 等存储。",
      "reasonZh": "适合跨云搬运和自动备份；近期仍修复存储服务行为。它主要通过命令行使用，首次同步应检查方向和删除规则，避免误删目标文件。",
      "audience": "多网盘用户、备份与系统管理人员"
    },
    {
      "name": "paperless-ngx/paperless-ngx",
      "url": "https://github.com/paperless-ngx/paperless-ngx",
      "stars": 47096,
      "weeklyGain": null,
      "functionZh": "可自行部署的文档管理系统，把扫描件等纸质资料整理成可搜索的在线档案，提供集中归档与检索界面。",
      "reasonZh": "适合积累发票、合同和扫描件的个人或团队；近期仍有维护提交，可通过 Docker Compose 部署。敏感资料需使用可信主机并建立备份，文件并非默认加密存储。",
      "audience": "个人资料归档与小团队文档管理"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-23 09:33 北京时间",
  "publishedAtIso": "2026-10-23T01:33:00Z",
  "growthWindow": "2026.10.13—2026.10.18",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank",
  "rising": [
    {
      "name": "Gathin23/cleanyourtv",
      "url": "https://github.com/Gathin23/cleanyourtv",
      "stars": 24206,
      "weeklyGain": null,
      "functionZh": "通过局域网连接 Android TV 或 Google TV，备份原有设置、停用广告和预装服务，并安装简洁的电视桌面；提供恢复方法。",
      "reasonZh": "适合想清理电视首页广告的人；会更改电视的应用状态和默认桌面，先核对支持的机型并保存备份。",
      "audience": "Android TV 与 Google TV 用户"
    },
    {
      "name": "lyogavin/airllm",
      "url": "https://github.com/lyogavin/airllm",
      "stars": 40342,
      "weeklyGain": 3384,
      "functionZh": "用逐层加载方式降低大语言模型推理时占用的显存，让较小显卡也能尝试运行大型模型，并提供 Python 示例。",
      "reasonZh": "显存门槛降低对本地模型实验有用；模型文件仍可能占用大量磁盘，速度与可运行性取决于机器配置。",
      "audience": "本地 AI 模型研究与开发"
    },
    {
      "name": "storytold/cadcraft",
      "url": "https://github.com/storytold/cadcraft",
      "stars": 6472,
      "weeklyGain": 2948,
      "functionZh": "用 Rust 开发的开源 CAD 绘图应用，支持图层、标注、对象捕捉及 DXF 读写，可在 Windows 等系统运行。",
      "reasonZh": "提供可体验的传统 CAD 操作流程，也支持智能体通过命令控制绘图；项目仍处早期开发，正式生产图纸应核对兼容性。",
      "audience": "制图、建筑与机械设计爱好者"
    },
    {
      "name": "microsoft/mxc",
      "url": "https://github.com/microsoft/mxc",
      "stars": 2963,
      "weeklyGain": null,
      "functionZh": "微软开源的跨平台隔离执行组件，可为应用运行模型生成的代码、插件和工具设置文件、网络等权限，并提供多种沙箱后端。",
      "reasonZh": "适合正在开发 AI 智能体或插件执行环境的人；这是开发组件，需要通过 SDK 集成，不是给普通用户直接安装的桌面应用。",
      "audience": "AI 工具与安全沙箱开发者"
    },
    {
      "name": "storytold/gridcraft",
      "url": "https://github.com/storytold/gridcraft",
      "stars": 6258,
      "weeklyGain": 2719,
      "functionZh": "用 Rust 开发的开源电子表格应用，提供公式、图表、数据透视表等功能，可在 Windows 等系统运行。",
      "reasonZh": "适合关注可由智能体控制的表格工具的人；项目较新，复杂 Excel 文件的兼容性仍需自行测试。",
      "audience": "表格分析与开源办公"
    }
  ],
  "established": [
    {
      "name": "microsoft/markitdown",
      "url": "https://github.com/microsoft/markitdown",
      "stars": 191670,
      "weeklyGain": null,
      "functionZh": "把 PDF、Word、Excel、PPT、网页等内容转换为 Markdown，尽量保留标题、列表、表格与链接，方便交给 AI 分析。",
      "reasonZh": "适合批量整理资料或建立知识库；转换目标是机器可读文本，复杂排版未必能原样呈现。",
      "audience": "资料整理与 AI 文档处理"
    },
    {
      "name": "microsoft/terminal",
      "url": "https://github.com/microsoft/terminal",
      "stars": 105221,
      "weeklyGain": null,
      "functionZh": "微软维护的 Windows 终端程序，可在同一窗口使用 PowerShell、命令提示符和 WSL，并支持标签页与自定义外观。",
      "reasonZh": "Windows 用户可从 Microsoft Store 安装并自动更新；经常操作命令行时更方便管理多个会话。",
      "audience": "Windows 开发与系统管理"
    },
    {
      "name": "usememos/memos",
      "url": "https://github.com/usememos/memos",
      "stars": 64005,
      "weeklyGain": null,
      "functionZh": "可自行部署的轻量笔记应用，按时间线记录想法，支持 Markdown、标签、搜索和自主控制分享范围。",
      "reasonZh": "适合想长期保存零散笔记、自己管理数据的人；需要自行部署和备份，仓库提供体验站点。",
      "audience": "个人笔记与自建服务"
    },
    {
      "name": "n8n-io/n8n",
      "url": "https://github.com/n8n-io/n8n",
      "stars": 208350,
      "weeklyGain": null,
      "functionZh": "用可视化流程把应用、数据源和 AI 模型连接起来，构建自动通知、数据同步和多步骤智能体工作流；支持自建部署。",
      "reasonZh": "大量现成集成和模板便于把重复工作自动化；源代码可见，但采用公平代码许可证，商用前应查看许可条件。",
      "audience": "工作流自动化与 AI 应用"
    },
    {
      "name": "AppFlowy-IO/AppFlowy",
      "url": "https://github.com/AppFlowy-IO/AppFlowy",
      "stars": 77664,
      "weeklyGain": null,
      "functionZh": "跨平台笔记与协作工作区，提供文档、数据库、任务看板和 AI 功能，可下载 Windows 桌面版或自行部署。",
      "reasonZh": "适合想集中管理资料和项目、希望掌握数据存放方式的人；自建团队服务仍需要维护。",
      "audience": "知识管理与团队协作"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-21 13:20 北京时间",
  "publishedAtIso": "2026-10-21T05:20:00Z",
  "growthWindow": "2026.10.13—2026.10.18",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank",
  "rising": [
    {
      "name": "wheresryan22/anatomy",
      "url": "https://github.com/wheresryan22/anatomy",
      "stars": 17769,
      "weeklyGain": 11839,
      "functionZh": "供 Codex 等编程智能体使用的绘图技能，可根据技术概念制作可交互的等距插画，输出 SVG、独立网页，并可加入 WebGL 动效。",
      "reasonZh": "适合把抽象机制变成可操作的教学图；仓库附有可直接打开的示例，便于先判断效果再安装。",
      "audience": "技术讲解、教育和产品展示"
    },
    {
      "name": "storytold/wordcraft",
      "url": "https://github.com/storytold/wordcraft",
      "stars": 15122,
      "weeklyGain": 10884,
      "functionZh": "用 Rust 从零实现的开源文字处理项目，目标是提供类似 Word 的文档编辑体验。",
      "reasonZh": "在本周 GitHub 增长榜位居前列，适合关注开源文档工具的人；项目仍较新，复杂文档兼容性需自行验证。",
      "audience": "文档编辑与开源办公"
    },
    {
      "name": "mksglu/context-mode",
      "url": "https://github.com/mksglu/context-mode",
      "stars": 31420,
      "weeklyGain": 4273,
      "functionZh": "通过 MCP 与钩子把大量工具输出先在沙箱处理，提炼必要信息再交给编程智能体，并保存会话记忆。",
      "reasonZh": "长时间处理日志、网页和仓库资料时，可能减少无关内容占用上下文；节省比例是项目方报告，实际效果应自行验证。",
      "audience": "经常用 AI 智能体处理大项目的开发者"
    },
    {
      "name": "ARahim3/DigUp",
      "url": "https://github.com/ARahim3/DigUp",
      "stars": 5260,
      "weeklyGain": 2214,
      "functionZh": "在本机索引照片、PDF、文档、录音、视频和代码后，可用自然语言搜索内容，并跳到相关文件或片段；提供 Windows 测试版。",
      "reasonZh": "适合找忘了文件名的资料，索引在本地进行；Windows 版仍是测试版，建议先用非重要文件夹体验。",
      "audience": "文件多、需要跨格式检索的 Windows 用户"
    },
    {
      "name": "vercel-labs/skills",
      "url": "https://github.com/vercel-labs/skills",
      "stars": 35874,
      "weeklyGain": 1703,
      "functionZh": "提供搜索、安装、使用和更新智能体技能的命令行工具，支持 Codex、Claude Code、OpenCode 等多种开发工具。",
      "reasonZh": "能集中发现和管理可复用技能，适合先查看技能内容，再按项目需要安装；安装操作会将第三方指令带入智能体工作流。",
      "audience": "使用 Codex 等编程智能体的人"
    }
  ],
  "established": [
    {
      "name": "EbookFoundation/free-programming-books",
      "url": "https://github.com/EbookFoundation/free-programming-books",
      "stars": 399706,
      "weeklyGain": null,
      "functionZh": "按语言和主题整理免费编程书籍、课程及其他学习资源，包含中文资源目录。",
      "reasonZh": "适合按主题建立学习路径，直接访问原始资源；这是资源索引，具体内容质量仍需按个人目标挑选。",
      "audience": "自学编程与查找免费教材的人"
    },
    {
      "name": "Stirling-Tools/Stirling-PDF",
      "url": "https://github.com/Stirling-Tools/Stirling-PDF",
      "stars": 94644,
      "weeklyGain": null,
      "functionZh": "可作为桌面应用或自建网页服务使用的 PDF 工具，支持合并、拆分、转换、OCR、签名和自动化处理。",
      "reasonZh": "处理 PDF 的常见功能集中在一个项目里；本地或自建部署有利于避免把文件上传到陌生在线网站。",
      "audience": "经常处理 PDF 文件的个人和团队"
    },
    {
      "name": "ollama/ollama",
      "url": "https://github.com/ollama/ollama",
      "stars": 184097,
      "weeklyGain": null,
      "functionZh": "在 Windows 等系统上下载并运行开放模型，提供命令行、编程接口和与 Codex 等工具的集成。",
      "reasonZh": "适合在自己的电脑上试用和接入模型；运行速度、可用模型大小仍取决于电脑硬件。",
      "audience": "想体验本地 AI 模型的用户与开发者"
    },
    {
      "name": "rustdesk/rustdesk",
      "url": "https://github.com/rustdesk/rustdesk",
      "stars": 126474,
      "weeklyGain": null,
      "functionZh": "开源远程桌面应用，支持 Windows、macOS、Linux 和移动设备，并可自行部署中继服务器。",
      "reasonZh": "适合需要跨设备远程协助或控制自己电脑的人；若自建服务器，需要注意访问权限与网络安全配置。",
      "audience": "远程桌面与设备管理"
    },
    {
      "name": "ggml-org/llama.cpp",
      "url": "https://github.com/ggml-org/llama.cpp",
      "stars": 131870,
      "weeklyGain": null,
      "functionZh": "在本地运行大语言模型的 C/C++ 推理项目，支持多种模型格式与硬件加速方式。",
      "reasonZh": "是了解本地模型运行机制和构建自有推理服务的成熟基础项目；实际速度取决于设备与模型大小。",
      "audience": "本地 AI 与模型部署"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-16 10:53 北京时间",
  "publishedAtIso": "2026-10-16T02:53:00Z",
  "growthWindow": "2026.10.06—2026.10.11",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank",
  "rising": [
    {
      "name": "morluto/rea",
      "url": "https://github.com/morluto/rea",
      "stars": 273146,
      "weeklyGain": null,
      "functionZh": "让编程智能体分析应用行为、网页、JavaScript 程序和原生二进制文件，结合本地工具给出逆向分析结论及证据。",
      "reasonZh": "把行为观察和代码层面的分析串成一套可追溯流程；适合研究自己有权分析的软件，结论仍需人工复核。",
      "audience": "软件分析与开发"
    },
    {
      "name": "cathrynlavery/diagram-design",
      "url": "https://github.com/cathrynlavery/diagram-design",
      "stars": 55979,
      "weeklyGain": null,
      "functionZh": "为 Codex 等智能体提供画图技能，可按文字需求生成架构图、流程图等多种图表，输出可直接打开的 HTML 与 SVG。",
      "reasonZh": "图表可以按品牌配色制作，并作为独立文件继续修改，适合写产品文档、方案和技术说明。",
      "audience": "文档与可视化"
    },
    {
      "name": "heygen-com/hyperframes",
      "url": "https://github.com/heygen-com/hyperframes",
      "stars": 64635,
      "weeklyGain": null,
      "functionZh": "用 HTML、CSS、媒体素材和可控制时间的动画制作视频，再在本地渲染为 MP4；提供命令行与智能体技能。",
      "reasonZh": "把视频制作变成可编辑、可重复渲染的代码流程，适合批量制作演示、教程或数据动画。",
      "audience": "视频制作与自动化"
    },
    {
      "name": "tashfeenahmed/freellmapi",
      "url": "https://github.com/tashfeenahmed/freellmapi",
      "stars": 35811,
      "weeklyGain": 2502,
      "functionZh": "把多个模型服务商的免费额度和自定义兼容接口汇集到一个 API，提供模型路由、故障切换与密钥加密存储。",
      "reasonZh": "适合试验不同模型并减少接口切换；实际免费额度取决于各服务商，实时模型目录属于付费功能。",
      "audience": "AI 模型试验"
    }
  ],
  "established": [
    {
      "name": "home-assistant/core",
      "url": "https://github.com/home-assistant/core",
      "stars": 91541,
      "weeklyGain": null,
      "functionZh": "可在家中服务器或树莓派上运行的智能家居平台，把不同品牌设备接入统一界面并设置自动化。",
      "reasonZh": "强调本地控制和隐私，适合已经有多种智能设备、想统一管理并减少对厂商云端依赖的人。",
      "audience": "智能家居"
    },
    {
      "name": "microsoft/winget-cli",
      "url": "https://github.com/microsoft/winget-cli",
      "stars": 26506,
      "weeklyGain": null,
      "functionZh": "微软的 Windows 软件包管理器命令行，可搜索、安装、升级和卸载应用，也能用于批量配置电脑。",
      "reasonZh": "Windows 用户可直接用它更新常用软件；仓库有官方安装说明和持续维护的客户端。",
      "audience": "Windows 软件管理"
    },
    {
      "name": "keepassxreboot/keepassxc",
      "url": "https://github.com/keepassxreboot/keepassxc",
      "stars": 29251,
      "weeklyGain": null,
      "functionZh": "跨平台密码管理器，把密码、网址、附件和笔记保存在本地加密数据库中，并提供密码生成与搜索。",
      "reasonZh": "适合希望自行掌握密码库文件位置和备份方式的人，Windows 上有现成安装包与入门文档。",
      "audience": "密码与隐私"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-14 12:16 北京时间",
  "publishedAtIso": "2026-10-14T04:16:00Z",
  "growthWindow": "2026.10.06—2026.10.11",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank",
  "rising": [
    {
      "name": "boykopovar/AnyPS5",
      "url": "https://github.com/boykopovar/AnyPS5",
      "stars": 35608,
      "weeklyGain": 22512,
      "functionZh": "研究将 PS5 可执行文件转换为可在 Windows 或 Linux 运行的程序，并实现所需的系统库；项目提供兼容性记录和使用说明。",
      "reasonZh": "它探索了游戏跨平台运行的另一条技术路径，但兼容性仍在完善，适合关注底层技术的人跟进进展。",
      "audience": "游戏技术与兼容性研究"
    },
    {
      "name": "rehan-remade/universal-modder",
      "url": "https://github.com/rehan-remade/universal-modder",
      "stars": 7436,
      "weeklyGain": 3777,
      "functionZh": "为 Codex 等编程智能体提供游戏模组制作流程，协助分析游戏文件、修改资源、生成素材并测试结果。",
      "reasonZh": "把零散的逆向分析和素材修改步骤组织成可复用流程，适合有技术基础的模组作者试用。",
      "audience": "游戏模组开发"
    },
    {
      "name": "CopilotKit/OpenDots",
      "url": "https://github.com/CopilotKit/OpenDots",
      "stars": 5223,
      "weeklyGain": 2346,
      "functionZh": "可自行搭建的智能体工作空间模板，支持持续任务、工具调用、隔离运行环境，以及页面和外部消息入口。",
      "reasonZh": "适合参考完整智能体产品如何串起任务、界面和工具；项目仍处早期，部署前需看清所依赖的服务配置。",
      "audience": "智能体应用开发"
    },
    {
      "name": "NandhaKishorM/laya",
      "url": "https://github.com/NandhaKishorM/laya",
      "stars": 32789,
      "weeklyGain": 1704,
      "functionZh": "多语言文本判断与分类工具，可按预设选项返回类别、评分或是非答案，并提供 Python、HTTP 和 MCP 接口。",
      "reasonZh": "输出结构明确，容易接入自动化流程；适合需要批量分流、审核或标签判断的人先用自己的数据评估。",
      "audience": "文本处理与自动化"
    }
  ],
  "established": [
    {
      "name": "ventoy/Ventoy",
      "url": "https://github.com/ventoy/Ventoy",
      "stars": 80014,
      "weeklyGain": null,
      "functionZh": "把多个 ISO、WIM 等系统镜像直接放进 U 盘，开机时从菜单选择要启动的镜像，无须每换一个镜像就重做启动盘。",
      "reasonZh": "装机、系统维护和故障排查时非常省事，尤其适合经常携带多个安装或救援镜像的人。",
      "audience": "Windows 装机与系统维护"
    },
    {
      "name": "syncthing/syncthing",
      "url": "https://github.com/syncthing/syncthing",
      "stars": 89373,
      "weeklyGain": null,
      "functionZh": "在多台设备之间持续同步指定文件夹，设备彼此连接，并可由自己控制数据存放位置。",
      "reasonZh": "适合希望跨电脑同步资料、又想掌握文件副本和同步范围的人；可先用非关键文件夹试用。",
      "audience": "多设备文件同步"
    },
    {
      "name": "godotengine/godot",
      "url": "https://github.com/godotengine/godot",
      "stars": 118476,
      "weeklyGain": null,
      "functionZh": "开源的二维与三维游戏开发引擎，提供场景编辑器、脚本和跨平台导出能力。",
      "reasonZh": "文档、社区和项目生态成熟，适合用小型游戏或交互原型验证创意，也便于查看引擎源码。",
      "audience": "游戏与交互开发"
    }
  ]
},
{
  "title": "GitHub 使用",
  "publishedAt": "2026-10-12 22:49 北京时间",
  "publishedAtIso": "2026-10-12T14:49:00Z",
  "growthWindow": "2026.10.06—2026.10.11",
  "risingSource": "https://github.com/OpenGithubs/github-weekly-rank",
  "rising": [
    {
      "name": "storytold/artcraft",
      "url": "https://github.com/storytold/artcraft",
      "stars": 20389,
      "weeklyGain": 6359,
      "functionZh": "面向创作者的图像与视频工作台，可在二维画布和三维场景里安排构图、人物与镜头，再调用不同模型生成或修改素材。",
      "reasonZh": "比单纯输入提示词多了可视化编排，适合需要反复调整画面、保持场景一致性的设计与视频工作。",
      "audience": "图像与视频创作"
    },
    {
      "name": "cloudflare/security-audit-skill",
      "url": "https://github.com/cloudflare/security-audit-skill",
      "stars": 28603,
      "weeklyGain": 3637,
      "functionZh": "给编程智能体使用的安全审计流程，涵盖代码侦察、覆盖检查、漏洞候选复核和结构化报告。",
      "reasonZh": "将发现与独立验证分开，并记录未证实的问题；适合想建立可追溯代码审计流程的团队。",
      "audience": "开发与安全"
    },
    {
      "name": "earthtojake/text-to-cad",
      "url": "https://github.com/earthtojake/text-to-cad",
      "stars": 19515,
      "weeklyGain": 2348,
      "functionZh": "为 AI 助手加入 CAD 建模能力，可在对话中生成、查看和继续修改三维模型，并提供浏览器模型查看器。",
      "reasonZh": "把文字需求连接到可查看的设计结果，适合快速制作零件原型或探索 AI 辅助建模。",
      "audience": "三维设计与制作"
    },
    {
      "name": "pingdotgg/t3code",
      "url": "https://github.com/pingdotgg/t3code",
      "stars": 27145,
      "weeklyGain": 2209,
      "functionZh": "集中控制本机的 Codex、Claude Code 等编程智能体，可用桌面、网页及手机端查看与接续任务。",
      "reasonZh": "有 Windows 安装方式与移动端入口，适合同时使用多个编程智能体、需要远程跟进任务的人。",
      "audience": "编程与效率"
    }
  ],
  "established": [
    {
      "name": "microsoft/PowerToys",
      "url": "https://github.com/microsoft/PowerToys",
      "stars": 139220,
      "weeklyGain": null,
      "functionZh": "微软的 Windows 实用工具合集，包含窗口分区、批量重命名、文字提取、颜色拾取和快捷启动等功能。",
      "reasonZh": "直接改善常见桌面操作，官方持续维护；Windows 用户可以先挑一两个工具试用。",
      "audience": "Windows 效率"
    },
    {
      "name": "obsproject/obs-studio",
      "url": "https://github.com/obsproject/obs-studio",
      "stars": 77383,
      "weeklyGain": null,
      "functionZh": "免费的屏幕录制与直播软件，可组合多个画面和音频来源，制作场景并进行实时切换。",
      "reasonZh": "录教程、演示软件或直播都用得上，生态成熟且跨平台。",
      "audience": "录屏与直播"
    },
    {
      "name": "jellyfin/jellyfin",
      "url": "https://github.com/jellyfin/jellyfin",
      "stars": 58021,
      "weeklyGain": null,
      "functionZh": "可自行部署的媒体服务器，用来整理、管理和在多种设备上播放个人电影、剧集与音乐库。",
      "reasonZh": "适合已有本地媒体收藏、想在家中设备间统一浏览播放的人。",
      "audience": "家庭媒体管理"
    }
  ]
},
{
  title: 'GitHub 使用',
  publishedAt: '2026-10-12 20:22 北京时间',
  publishedAtIso: '2026-10-12T12:22:00Z',
  growthWindow: '2026.10.06—2026.10.11',
  risingSource: 'https://github.com/OpenGithubs/github-weekly-rank',
  rising: [
    {
      name: 'tester-army/e2e',
      url: 'https://github.com/tester-army/e2e',
      stars: 9331,
      weeklyGain: 5695,
      functionZh: '用自然语言描述测试目标，让智能体操作网页或手机应用，再用断言检查结果；后续运行可回放已验证的操作。',
      reasonZh: '把难维护的端到端测试步骤和可验证的结果结合起来，适合需要频繁改版的产品团队。',
      audience: '开发与测试',
    },
    {
      name: 'DuarteSantos8/openGym',
      url: 'https://github.com/DuarteSantos8/openGym',
      stars: 10083,
      weeklyGain: 5050,
      functionZh: '可自行部署的训练与体重记录工具，支持制定计划、记录每组动作、查看肌群状态，并能导入常见健身应用的数据。',
      reasonZh: '功能完整，数据由自己掌控；已有演示站和安装说明，可以先体验再决定是否部署。',
      audience: '健身与自托管',
    },
    {
      name: 'anthropics/knowledge-work-plugins',
      url: 'https://github.com/anthropics/knowledge-work-plugins',
      stars: 29210,
      weeklyGain: 2680,
      functionZh: '面向销售、客服、产品、营销、财务等工作的 Claude 插件集合，内含对应的流程、工具连接和命令。',
      reasonZh: '能直接参考成熟的角色工作流设计，尤其适合寻找 AI 如何融入日常业务的人。',
      audience: '知识工作与 AI',
    },
    {
      name: 'TencentCloud/Octop',
      url: 'https://github.com/TencentCloud/Octop',
      stars: 8834,
      weeklyGain: 1940,
      functionZh: '可本地部署的多用户、多智能体助手，提供网页控制台，并连接飞书、钉钉、微信等聊天入口。',
      reasonZh: '把多人使用、智能体协作和常见中文通讯平台放在同一套开源方案中，值得关注其实际部署体验。',
      audience: '团队助手与自托管',
    },
  ] satisfies GithubPick[],
  established: [
    {
      name: 'yt-dlp/yt-dlp',
      url: 'https://github.com/yt-dlp/yt-dlp',
      stars: 197103,
      weeklyGain: null,
      functionZh: '支持众多网站的命令行音视频下载工具，可选择格式、字幕和元数据，并提供丰富的后处理选项。',
      reasonZh: '生态成熟且持续维护，是需要合法保存可下载音视频素材时很实用的基础工具。',
      audience: '音视频处理',
    },
    {
      name: 'immich-app/immich',
      url: 'https://github.com/immich-app/immich',
      stars: 116088,
      weeklyGain: null,
      functionZh: '自托管照片和视频管理平台，支持手机备份、相册分享、去重，以及按人物、地点和内容检索。',
      reasonZh: '适合希望把家庭影像留在自己服务器的人；功能覆盖了日常相册管理的关键场景。',
      audience: '照片备份与管理',
    },
    {
      name: 'localsend/localsend',
      url: 'https://github.com/localsend/localsend',
      stars: 94076,
      weeklyGain: null,
      functionZh: '让 Windows、macOS、Linux、Android 和 iOS 设备在同一局域网内互传文件与文字，无需登录或联网。',
      reasonZh: '安装后就能解决跨设备传文件的常见麻烦，使用门槛低，适合作为第一个试用项目。',
      audience: '跨设备文件传输',
    },
  ] satisfies GithubPick[],
},
];


