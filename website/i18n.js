const ZH = {
  nav_features: '功能',
  nav_install: '安装',
  hero_title: '追踪引用，发现影响力',
  hero_desc: '极简 Chrome 扩展，在工具栏实时监控你的 Google Scholar 引用量。',
  hero_btn: '安装 Chrome 扩展',
  feat1_title: '自动刷新',
  feat1_desc: '每 30 分钟自动更新引用数据，无需手动查看。',
  feat2_title: '徽章计数',
  feat2_desc: '引用数直接显示在工具栏徽章上，一目了然。',
  feat3_title: '多账号追踪',
  feat3_desc: '同时追踪自己和他人主页，一个弹窗全掌握。',
  install_title: '安装',
  install_step1: '从 Chrome 应用商店安装扩展 <em>（即将上线）</em>',
  install_step2: '点击工具栏图标，输入你的 Google Scholar 用户 ID',
  install_step3: '完成 — 引用数即刻显示在徽章上',
  hint_label: '从 Scholar 主页 URL 中获取你的 ID：',
  dev_title: '开发者模式安装',
  dev_step1: '克隆或下载本项目到本地',
  dev_step2: '打开 Chrome，地址栏输入 <code>chrome://extensions</code>',
  dev_step3: '开启右上角「开发者模式」开关',
  dev_step4: '点击「加载已解压的扩展程序」，选择项目的 <code>chrome</code> 目录',
  dev_step5: '安装完成，工具栏出现 Citation Tracker 图标',
  footer: 'Citation Tracker — 开源、无分析、无追踪。'
};

const EN = {
  nav_features: 'Features',
  nav_install: 'Install',
  hero_title: 'Track citations, discover impact',
  hero_desc: 'A minimal Chrome extension that monitors your Google Scholar citations — right from the toolbar.',
  hero_btn: 'Install for Chrome',
  feat1_title: 'Auto Refresh',
  feat1_desc: 'Citations update every 30 minutes. No manual checks needed.',
  feat2_title: 'Badge Count',
  feat2_desc: 'Your citation count sits in the toolbar badge — always visible.',
  feat3_title: 'Multi Profile',
  feat3_desc: 'Track your own profile and watch others in one popup.',
  install_title: 'Install',
  install_step1: 'Download the extension from the Chrome Web Store <em>(coming soon)</em>',
  install_step2: 'Click the toolbar icon and enter your Google Scholar user ID',
  install_step3: 'Done — your citation count appears in the badge',
  hint_label: 'Find your ID from your Scholar profile URL:',
  dev_title: 'Install in Developer Mode',
  dev_step1: 'Clone or download this project locally',
  dev_step2: 'Open Chrome and go to <code>chrome://extensions</code>',
  dev_step3: 'Enable the "Developer mode" toggle in the top right',
  dev_step4: 'Click "Load unpacked" and select the <code>chrome</code> directory',
  dev_step5: 'Done — the Citation Tracker icon appears in your toolbar',
  footer: 'Citation Tracker — open source, no analytics, no tracking.'
};

let currentLang = localStorage.getItem('lang') || 'zh';

function applyLang(lang) {
  const dict = lang === 'en' ? EN : ZH;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.innerHTML = dict[key];
  });
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelector('.lang-toggle').textContent = lang === 'en' ? '中文' : 'EN';
  localStorage.setItem('lang', lang);
  currentLang = lang;
}

function toggleLang() {
  applyLang(currentLang === 'zh' ? 'en' : 'zh');
}

applyLang(currentLang);