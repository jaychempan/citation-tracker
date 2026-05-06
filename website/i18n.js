const ZH = {
  nav_features: '功能',
  nav_install: '安装',
  hero_title: '追踪引用，发现影响力',
  hero_desc: '极简 Chrome 扩展，在工具栏实时监控你的 Google Scholar 引用量。',
  hero_btn: '安装 Chrome 扩展',
  hero_github: 'GitHub',
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
  nav_home: '首页',
  privacy_title: '隐私政策',
  privacy_updated: '最后更新：2026 年 5 月 5 日',
  privacy_intro_title: '概述',
  privacy_intro_desc: 'Citation Tracker（"我们"）尊重您的隐私。本隐私政策说明我们在您使用 Chrome 扩展时收集、使用和保护哪些信息。',
  privacy_collect_title: '我们收集的信息',
  privacy_collect_desc: 'Citation Tracker 不收集、存储或传输任何个人身份信息。具体而言：',
  privacy_collect_1: '我们不收集姓名、电子邮件地址或其他联系信息',
  privacy_collect_2: '我们不收集浏览历史或访问过的网页',
  privacy_collect_3: '我们不使用 Cookie 或任何第三方追踪技术',
  privacy_collect_4: '我们不与任何第三方共享数据',
  privacy_local_title: '本地存储的数据',
  privacy_local_desc: '扩展在您的浏览器本地存储以下数据，用于实现核心功能：',
  privacy_local_1: '<strong>Google Scholar 用户 ID</strong> — 您主动输入的 Scholar ID，用于获取引用数据',
  privacy_local_2: '<strong>引用计数</strong> — 从 Google Scholar 获取的引用数量，用于显示徽章和趋势',
  privacy_local_3: '<strong>上次刷新时间</strong> — 记录最后一次数据更新的时间',
  privacy_local_note: '以上所有数据均保存在 Chrome 本地存储（chrome.storage.local）中，不会离开您的设备。您可以随时通过移除扩展来清除这些数据。',
  privacy_third_title: '第三方服务',
  privacy_third_desc: '扩展仅与 Google Scholar（scholar.google.com）通信，以获取公开可用的引用数据。我们不使用任何分析服务、广告网络或其他第三方 API。',
  privacy_perm_title: '所需权限',
  privacy_perm_desc: '扩展请求的权限及其用途：',
  privacy_perm_1: '<strong>访问 scholar.google.com</strong> — 读取公开引用数据所必需',
  privacy_perm_2: '<strong>徽章（Badge）显示</strong> — 在工具栏图标上显示引用计数',
  privacy_perm_3: '<strong>后台刷新（Alarms）</strong> — 定期自动更新引用数据',
  privacy_children_title: '儿童隐私',
  privacy_children_desc: '我们的扩展不面向 13 岁以下儿童，也不会故意收集儿童的个人信息。',
  privacy_changes_title: '政策变更',
  privacy_changes_desc: '我们可能会不时更新本隐私政策。重大变更将通过扩展更新说明或本页面进行通知。继续使用扩展即表示您同意修订后的政策。',
  privacy_contact_title: '联系我们',
  privacy_contact_desc: '如果您对本隐私政策有任何疑问，请通过 GitHub 仓库提交 Issue：',
  footer_copy: 'Citation Tracker © 2026',
  footer_privacy: '隐私政策'
};

const EN = {
  nav_features: 'Features',
  nav_install: 'Install',
  hero_title: 'Track citations, discover impact',
  hero_desc: 'A minimal Chrome extension that monitors your Google Scholar citations — right from the toolbar.',
  hero_btn: 'Install for Chrome',
  hero_github: 'GitHub',
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
  nav_home: 'Home',
  privacy_title: 'Privacy Policy',
  privacy_updated: 'Last updated: May 5, 2026',
  privacy_intro_title: 'Overview',
  privacy_intro_desc: 'Citation Tracker ("we") respects your privacy. This policy explains what information we collect, use, and protect when you use our Chrome extension.',
  privacy_collect_title: 'Information We Collect',
  privacy_collect_desc: 'Citation Tracker does not collect, store, or transmit any personal identification information. Specifically:',
  privacy_collect_1: 'We do not collect names, email addresses, or other contact information',
  privacy_collect_2: 'We do not collect browsing history or visited pages',
  privacy_collect_3: 'We do not use cookies or any third-party tracking technologies',
  privacy_collect_4: 'We do not share any data with third parties',
  privacy_local_title: 'Data Stored Locally',
  privacy_local_desc: 'The extension stores the following data locally in your browser to provide core functionality:',
  privacy_local_1: '<strong>Google Scholar User ID</strong> — the Scholar ID you enter, used to fetch citation data',
  privacy_local_2: '<strong>Citation counts</strong> — citation numbers fetched from Google Scholar, used for badge display and trends',
  privacy_local_3: '<strong>Last refresh time</strong> — records when data was last updated',
  privacy_local_note: 'All data above is stored in Chrome local storage (chrome.storage.local) and never leaves your device. You can clear this data at any time by removing the extension.',
  privacy_third_title: 'Third-Party Services',
  privacy_third_desc: 'The extension only communicates with Google Scholar (scholar.google.com) to fetch publicly available citation data. We do not use any analytics services, advertising networks, or other third-party APIs.',
  privacy_perm_title: 'Permissions Required',
  privacy_perm_desc: 'Permissions requested by the extension and their purposes:',
  privacy_perm_1: '<strong>Access to scholar.google.com</strong> — required to read public citation data',
  privacy_perm_2: '<strong>Badge display</strong> — shows citation count on the toolbar icon',
  privacy_perm_3: '<strong>Background refresh (Alarms)</strong> — periodically auto-updates citation data',
  privacy_children_title: 'Children\'s Privacy',
  privacy_children_desc: 'Our extension is not directed at children under 13, and we do not knowingly collect personal information from children.',
  privacy_changes_title: 'Changes to This Policy',
  privacy_changes_desc: 'We may update this privacy policy from time to time. Significant changes will be communicated through extension update notes or this page. Continued use of the extension constitutes acceptance of the revised policy.',
  privacy_contact_title: 'Contact Us',
  privacy_contact_desc: 'If you have questions about this privacy policy, please open an issue on our GitHub repository:',
  footer_copy: 'Citation Tracker © 2026',
  footer_privacy: 'Privacy Policy'
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

function toggleNav() {
  document.querySelector('.nav-links').classList.toggle('open');
  document.querySelector('.nav-toggle').classList.toggle('active');
}

// Close mobile nav on link click
document.addEventListener('click', (e) => {
  const navLinks = document.querySelector('.nav-links');
  const navToggle = document.querySelector('.nav-toggle');
  if (!navLinks || !navToggle) return;
  if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
  }
});

applyLang(currentLang);