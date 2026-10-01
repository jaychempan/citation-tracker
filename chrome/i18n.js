(function exposeCitationI18n(root) {
  // The English strings also let saved errors from older releases be localized.
  const messages = {
    // Keep product names and standard academic metric names in their original form.
    appName: ['Citation Tracker', 'Citation Tracker'],
    pageTitle: ['Google Scholar Citations', 'Google Scholar Citations'],
    tagline: ['Track citations. Discover impact.', '追踪被引变化，了解学术影响。'],
    switchLanguage: ['Switch to Chinese', '切换到英文'],
    theme: ['Theme', '主题'],
    themeLabel: ['Choose a theme', '选择外观主题'],
    themeForest: ['Forest', '松绿'],
    themeGraphite: ['Graphite', '石墨'],
    themeSaveFailed: ['Could not save the theme. Please try again.', '无法保存外观主题，请重试。'],
    refresh: ['Refresh', '刷新'],
    refreshLabel: ['Refresh citations', '刷新被引数据'],
    editIds: ['Edit IDs', '编辑 ID'],
    editIdsLabel: ['Edit Scholar IDs', '编辑 Scholar 学者 ID'],
    idsLabel: ['Google Scholar IDs', 'Google Scholar 学者 ID'],
    ownId: ['My Scholar ID', '我的 Scholar ID'],
    ownIdPlaceholder: ['Your Scholar user ID', '输入你的 Scholar 学者 ID'],
    fromUrl: ['From URL:', '在学者主页网址中查找：'],
    otherIds: ['Other Scholar IDs', '关注的学者 ID'],
    otherIdsLabel: ['Other Scholar user IDs', '关注的 Scholar 学者 ID'],
    otherIdsPlaceholder: ['Add others, separated by new lines or commas', '输入其他学者的 ID，用换行或逗号分隔'],
    save: ['Save', '保存'],
    cancel: ['Cancel', '取消'],
    metricsLabel: ['Citation update summary', '被引次数与变化'],
    myCitations: ['My citations', '我的被引次数'],
    allProfiles: ['All profiles', '全部学者'],
    allProfilesDelta: ['This refresh', '本次被引变化'],
    allProfilesDeltaHint: ['Change in total citations across all added profiles since the previous successful refresh.', '所有已添加学者的总被引次数，与上次成功刷新相比的增减。'],
    monitorLabel: ['Article monitoring summary', '论文被引监测概况'],
    watchedLabel: ['papers watched', '追踪论文数'],
    increasedLabel: ['papers increased', '被引增长论文'],
    gainedLabel: ['citations gained', '新增被引次数'],
    viewsLabel: ['Citation tracker views', '被引追踪视图'],
    profiles: ['Profiles', '学者'],
    insights: ['Insights', '分析'],
    papers: ['Papers', '论文'],
    activity: ['Activity', '动态'],
    activityHeading: ['Citation activity', '被引动态'],
    checkingArticles: ['Checking article-level changes...', '正在检查论文被引变化…'],
    profile: ['Profile', '学者'],
    activityFilterLabel: ['Filter citation activity by profile', '按学者筛选被引动态'],
    insightsHeading: ['Impact insights', '影响力分析'],
    insightsDescription: ['Annual citations and research profile signals', '年度被引趋势与学术影响力指标'],
    insightsFilterLabel: ['Select impact profile', '选择要分析的学者'],
    papersHeading: ['Scholar papers', '论文列表'],
    loadingPapers: ['Loading saved paper citations...', '正在加载已保存的论文及被引次数…'],
    paperControlsLabel: ['Paper list controls', '论文列表筛选与排序'],
    filterPapers: ['Filter saved papers', '筛选已保存的论文'],
    filterPapersHint: ['Filters papers already saved from tracked profiles', '仅搜索本地已保存的论文'],
    scholarSearch: ['Search Scholar online', '在 Scholar 中搜索'],
    sort: ['Sort', '排序'],
    sortCitations: ['Most cited', '被引最多'],
    sortYear: ['Newest year', '年份最新'],
    sortChange: ['Latest gain', '本次被引增量'],
    sortTitle: ['Title A-Z', '按标题排序'],
    showMore: ['Show {count} more', '再显示 {count} 篇'],
    profilesHeading: ['Tracked profiles', '追踪的学者'],
    profilesDescription: ['Profile metrics and article coverage', '学者指标与论文同步状态'],
    homepage: ['Homepage', '项目首页'],
    loading: ['Loading...', '正在加载…'],
    notUpdated: ['Not updated yet', '尚未更新'],
    updated: ['Updated {date}', '更新于 {date}'],
    you: ['Your profile', '我的主页'],
    ownName: ['{name} (You)', '{name}（我的主页）'],
    checkFailedHistory: ['The last check failed. Showing saved history.', '上次更新失败，当前显示已保存的历史记录。'],
    checkFailedTotals: ['The last check failed. Previous citation totals were preserved.', '上次更新失败，已保留之前的被引数据。'],
    baselineCreated: ['Baseline created for {count} papers. Changes appear after the next check.', '已保存 {count} 篇论文的初始被引次数，后续刷新将显示变化。'],
    activityGains: ['{papers} paper{paperSuffix} gained {citations} citation{citationSuffix} on this check.', '本次更新有 {papers} 篇论文的被引次数增加，合计新增 {citations} 次。'],
    noNewIncreases: ['No new increases on this check. Showing recent history.', '本次更新没有新增被引，当前显示历史记录。'],
    watchingPapers: ['Watching {count} papers every 30 minutes.', '正在追踪 {count} 篇论文，每 30 分钟更新一次。'],
    startMonitoring: ['Add a public Scholar profile to start monitoring papers.', '添加公开的 Scholar 学者主页，即可开始追踪论文被引变化。'],
    partialProfiles: [' Coverage is partial for {count} profile{suffix}.', ' 有 {count} 位学者的论文列表尚未获取完整。'],
    newCitations: ['{count} new citations', '被引次数增加 {count} 次'],
    citationChange: ['{before} to {current} citations', '被引次数：{before} → {current}'],
    latestCheck: ['Latest check', '最近一次更新'],
    before: ['Before', '更新前'],
    current: ['Current', '更新后'],
    year: ['Year', '发表年份'],
    notListed: ['Not listed', '未列出'],
    articleDetails: ['Article details', '论文详情'],
    citingWorks: ['Citing works', '引用该论文的文献'],
    scholarCheckFailed: ['Could not check Google Scholar', '无法获取 Google Scholar 数据'],
    baselineReady: ['First sync complete', '首次同步完成'],
    noIncreases: ['No citation increases yet', '暂无被引增长记录'],
    nextRefresh: ['The next successful refresh will identify exactly which papers gained citations.', '下次成功刷新后，将对比被引次数并显示增长记录。'],
    activityEmpty: ['Citation increases will appear here with article details and before-and-after counts.', '论文被引次数增加时，这里会显示论文详情及更新前后的次数。'],
    profileActivityEmpty: ['No saved citation increases for this profile.', '这位学者暂无已保存的被引增长记录。'],
    openProfile: ['Open Scholar profile', '打开 Scholar 学者主页'],
    noAuthors: ['Authors not listed', '暂无作者信息'],
    noPublication: ['Publication not listed', '暂无发表信息'],
    citationsCount: ['{count} citations', '被引 {count} 次'],
    citations: ['Citations', '被引次数'],
    citationUnit: ['citations', '被引次数'],
    latestGain: ['{delta} latest', '本次被引 {delta}'],
    searchQuery: ['Search Google Scholar for {query}', '在 Google Scholar 搜索“{query}”'],
    noMatches: ['No saved matches', '未找到匹配的论文'],
    syncFailed: ['Paper sync failed', '论文同步失败'],
    noPapers: ['No saved papers yet', '暂无已保存的论文'],
    noMatchesHint: ['This field only filters saved profile papers. Use Search Scholar online for broader results.', '此处仅搜索本地已保存的论文。如需搜索更多文献，请前往 Scholar。'],
    syncHint: ['Sync the tracked profile once to save its public paper list and citation counts.', '刷新学者数据，即可保存公开论文列表和被引次数。'],
    retrySync: ['Try paper sync again', '重新同步论文'],
    syncPapers: ['Sync profile papers', '同步论文列表'],
    noQueryMatches: ['No saved matches for "{query}".', '已保存的论文中没有与“{query}”匹配的结果。'],
    noLocalPapers: ['No papers are saved locally. Sync the profile or search Scholar online.', '本地暂无论文，请先同步论文列表，或前往 Scholar 搜索。'],
    showingPapers: ['Showing {visible} of {total} papers. Checked every 30 minutes.', '已显示 {visible} / {total} 篇论文，每 30 分钟更新一次。'],
    showingSaved: [' Showing saved data because the latest check failed.', ' 上次更新失败，当前显示已保存的数据。'],
    somePartial: [' Some profiles have partial coverage.', ' 部分学者的论文列表尚未获取完整。'],
    noProfiles: ['No profiles yet', '尚未添加学者'],
    addProfileHint: ['Open settings and enter a public Google Scholar user ID.', '点击右上角的 +，输入公开的 Google Scholar 学者 ID。'],
    removeName: ['Remove {name}', '移除 {name}'],
    removeProfile: ['Remove profile', '移除学者'],
    unavailable: ['N/A', '暂无数据'],
    hIndex: ['h-index', 'h-index'],
    i10Index: ['i10-index', 'i10-index'],
    papersWatched: ['{count} papers watched', '正在追踪 {count} 篇论文'],
    profileGains: ['{count} increased, {delta}', '被引增加：{count} 篇（{delta} 次）'],
    fullProfile: ['Full profile', '论文列表完整'],
    partialCoverage: ['Partial paper list', '仅获取部分论文'],
    noPaperCoverage: ['No papers fetched', '尚未获取论文'],
    radarLabel: ['Impact radar for {name}', '{name} 的影响力雷达图'],
    paperReach: ['Paper reach', '被引论文占比'],
    momentum: ['Momentum', '增长势头'],
    noInsights: ['No insights yet', '暂无分析数据'],
    insightsHint: ['Add a public Scholar profile to visualize its impact.', '添加公开的 Scholar 学者主页，即可查看影响力分析。'],
    annualCitations: ['Annual citations', '年度被引次数'],
    publicHistory: ['Public Google Scholar history', '来自 Google Scholar 的公开数据'],
    yearOverYear: ['{year}: {change}% YoY', '{year} 年同比 {change}%'],
    yearOverYearHint: ['Full-year citations: {previousYear} ({before}) compared with {year} ({current}).', '完整年度被引次数：{previousYear} 年 {before} 次，{year} 年 {current} 次。'],
    annualValue: ['{year}: {count} citations', '{year} 年：被引 {count} 次'],
    annualCurrentValue: ['{year}: {count} citations, year to date', '{year} 年：被引 {count} 次（截至目前）'],
    annualCachedValue: ['{year}: {count} citations, as of the last sync', '{year} 年：被引 {count} 次（截至上次同步）'],
    annualAsOfDate: ['{value}; data synced on {date}', '{value}；数据同步于 {date}'],
    annualCurrentLabel: ['{year}, year to date', '{year} 年（截至目前）'],
    annualCachedLabel: ['{year}, as of last sync', '{year} 年（截至上次同步）'],
    annualPartialNote: ['* {year}: year to date. YoY compares completed years only.', '* {year} 年（截至目前），同比仅比较完整年度。'],
    annualCachedNote: ['* {year}: as of last sync. This cached partial year is excluded from full-year comparisons.', '* {year} 年（截至上次同步），该年缓存数据未参与完整年度同比。'],
    annualEmpty: ['Refresh this profile to load its annual citation history.', '刷新学者数据以获取历年被引次数。'],
    impactRadar: ['Impact radar', '影响力雷达图'],
    profileSnapshot: ['Relative profile snapshot', '学者指标概览'],
    radarNote: ['Signals are normalized for visual comparison, not an academic ranking.', '指标经归一化处理，仅供展示，不代表学术排名。'],
    radarHelp: ['About these indicators', '指标说明'],
    paperReachHint: ['Of {total} synced papers, {cited} have at least one citation. This indicator is their share of the synced list.', '已同步的 {total} 篇论文中，{cited} 篇至少被引 1 次。该指标为被引论文占已同步论文的比例。'],
    paperReachUnavailable: ['Sync papers to calculate their cited share.', '尚未同步论文，暂无法计算被引论文占比。'],
    momentumHint: ['Compares citation counts for the completed years {previousYear} and {year}, normalized for display. The current year is excluded.', '比较 {previousYear} 和 {year} 两个完整年度的被引次数，归一化后展示。当前年度不参与计算。'],
    momentumUnavailable: ['Two consecutive completed years with a nonzero earlier count are needed. Until then, this axis has no value.', '需要连续两个完整年度的数据，且前一年度的被引次数大于 0。数据不足时，此维度暂不显示数值。'],
    lastRefreshFailed: ['Last refresh failed', '上次刷新失败'],
    loadDataFailed: ['Unable to load saved data', '无法加载已保存的数据'],
    reloadHint: ['Reload the extension and try again.', '请重新加载扩展后重试。'],
    loadPapersFailed: ['Unable to load saved papers', '无法加载已保存的论文'],
    loadProfilesFailed: ['Unable to load profiles', '无法加载学者数据'],
    saving: ['Saving...', '正在保存…'],
    savedRefreshFailed: ['Saved, refresh failed', '已保存，但刷新失败'],
    saved: ['Saved and refreshed.', '已保存并刷新。'],
    removing: ['Removing...', '正在移除…'],
    removedRefreshFailed: ['Removed, refresh failed', '已移除，但刷新失败'],
    removed: ['Profile removed.', '已移除学者。'],
    checking: ['Checking profiles and papers...', '正在更新学者数据和论文列表…'],
    refreshFailed: ['Refresh failed', '刷新失败'],
    refreshed: ['Refresh complete.', '刷新完成。'],
    languageSaveFailed: ['Could not save language preference. Please try again.', '无法保存语言偏好，请重试。'],
    noPreviousUpdate: ['no previous update', '暂无对比数据'],
    actionGains: ['; {count} articles gained {delta}', '；{count} 篇论文被引增加，合计 {delta} 次'],
    actionTitle: ['Citation Tracker: {total} own citations ({delta} total change{articles})', 'Citation Tracker：我的被引次数 {total}（被引变化：{delta}{articles}）'],
    verificationRedirect: ['Google Scholar redirected this request to Google verification. Open the Scholar profile in a normal tab, complete the check, then refresh again.', 'Google Scholar 将请求转到了 Google 验证页面。请在普通标签页打开学者主页，完成验证后再刷新。'],
    rateLimited: ['Google Scholar rate-limited the request (HTTP 429). Wait a few minutes, then try again.', 'Google Scholar 限制了请求频率（HTTP 429）。请等待几分钟后重试。'],
    blocked: ['Google Scholar blocked the request (HTTP 403). Open the Scholar profile in a normal tab and complete any verification first.', 'Google Scholar 拒绝了请求（HTTP 403）。请先在普通标签页打开学者主页并完成验证。'],
    browserVerification: ['Google Scholar requested browser verification. Open the Scholar profile in a normal tab, complete the check, then refresh again.', 'Google Scholar 要求进行浏览器验证。请在普通标签页打开学者主页，完成验证后再刷新。'],
    timeout: ['Google Scholar did not respond within 15 seconds. Check that scholar.google.com opens in Chrome, then try again.', 'Google Scholar 在 15 秒内未响应。请确认 Chrome 能打开 scholar.google.com，然后重试。'],
    dataRefreshFailed: ['Google Scholar data could not be refreshed. Previous citation data was preserved.', '无法更新 Google Scholar 数据，已保留之前的被引数据。'],
    updateFailed: ['Google Scholar could not be refreshed. Previous data was preserved.', '无法刷新 Google Scholar，已保留之前的数据。'],
    enterId: ['Please enter your Google Scholar user id.', '请输入你的 Google Scholar 学者 ID。'],
    httpError: ['Google Scholar returned HTTP {status} for {id}.', '获取学者 {id} 的数据失败（HTTP {status}）。'],
    networkError: ['Could not reach Google Scholar for {id}: {detail}.', '无法连接 Google Scholar（学者 ID：{id}）：{detail}。'],
    networkRequestFailed: ['network request failed', '网络请求失败'],
    noCitationCount: ['Google Scholar loaded, but no citation count was found for {id}. Confirm that the profile is public and the user ID is correct.', 'Google Scholar 页面已加载，但未读取到学者 {id} 的被引次数。请确认学者主页已公开且 ID 正确。'],
    partialFetchError: ['Citation totals were updated, but the full article list could not be loaded. {detail}', '被引总数已更新，但论文列表未能全部获取。{detail}'],
    articleLimit: ['Monitoring is limited to the first {count} articles on this profile.', '目前只追踪这位学者的前 {count} 篇论文。']
  };

  function normalizeLanguage(value) {
    return /^zh(?:[-_]|$)/i.test(String(value || '')) ? 'zh-CN' : 'en';
  }

  function getBrowserLanguage() {
    return normalizeLanguage(root.chrome?.i18n?.getUILanguage?.() || root.navigator?.language);
  }

  let language = getBrowserLanguage();
  function setLanguage(value) {
    language = normalizeLanguage(value);
    return language;
  }

  function t(key, params = {}) {
    if (!Object.hasOwn(messages, key)) return key;
    const message = messages[key];
    return message[language === 'zh-CN' ? 1 : 0].replace(/\{(\w+)\}/g, (token, name) => (
      Object.hasOwn(params, name) ? String(params[name]) : token
    ));
  }

  function translateError(value) {
    const message = String(value || '');
    if (language === 'en' || !message) return message;
    const exact = Object.entries(messages).find(([, translations]) => translations[0] === message);
    if (exact) return t(exact[0]);

    const partialPrefix = 'Citation totals were updated, but the full article list could not be loaded. ';
    if (message.startsWith(partialPrefix)) {
      return t('partialFetchError', { detail: translateError(message.slice(partialPrefix.length)) });
    }
    let match = message.match(/^Google Scholar returned HTTP (\d+) for (.+)\.$/);
    if (match) return t('httpError', { status: match[1], id: match[2] });
    match = message.match(/^Could not reach Google Scholar for ([^:]+): (.+)\.$/);
    if (match) return t('networkError', {
      id: match[1],
      detail: /^(Failed to fetch|fetch failed|network request failed)$/i.test(match[2])
        ? t('networkRequestFailed') : translateError(match[2])
    });
    match = message.match(/^Google Scholar loaded, but no citation count was found for (.+)\. Confirm that the profile is public and the user ID is correct\.$/);
    if (match) return t('noCitationCount', { id: match[1] });
    match = message.match(/^Monitoring is limited to the first (\d+) articles on this profile\.$/);
    if (match) return t('articleLimit', { count: match[1] });
    return message;
  }

  function localizeScholarUrl(value) {
    try {
      const url = new URL(value);
      if (url.hostname === 'scholar.google.com') {
        url.searchParams.set('hl', language === 'zh-CN' ? 'zh-CN' : 'en');
      }
      return url.toString();
    } catch (_error) {
      return value;
    }
  }

  function applyDocument(document) {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.getAttribute('data-i18n'));
    });
    ['title', 'placeholder', 'aria-label'].forEach(attribute => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    });
  }

  const api = {
    messages, t, setLanguage, getBrowserLanguage, normalizeLanguage,
    getLanguage: () => language,
    getLocale: () => language === 'zh-CN' ? 'zh-CN' : 'en-US',
    translateError, localizeScholarUrl, applyDocument
  };
  root.CitationI18n = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
