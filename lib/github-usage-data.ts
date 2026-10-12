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


