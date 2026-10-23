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


