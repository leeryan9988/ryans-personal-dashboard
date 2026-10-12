export type GithubPick = {
  name: string;
  url: string;
  stars: number;
  weeklyGain: number | null;
  functionZh: string;
  reasonZh: string;
  audience: string;
};

export const githubUsageEdition = {
  title: 'GitHub 使用',
  publishedAt: '2026-10-12 20:22 北京时间',
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
};

