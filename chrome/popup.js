const { t, translateError, localizeScholarUrl } = CitationI18n;
const languageButton = document.getElementById('languageButton');
const themeSelect = document.getElementById('themeSelect');
const idsInput = document.getElementById('scholarIds');
const ownIdInput = document.getElementById('ownScholarId');
const inputPanel = document.getElementById('inputPanel');
const toggleInputButton = document.getElementById('toggleInputButton');
const cancelInputButton = document.getElementById('cancelInputButton');
const saveButton = document.getElementById('saveButton');
const refreshButton = document.getElementById('refreshButton');
const summary = document.getElementById('summary');
const totalMetric = document.getElementById('totalMetric');
const totalValue = document.getElementById('totalValue');
const totalDelta = document.getElementById('totalDelta');
const deltaMetric = document.getElementById('deltaMetric');
const monitoredArticles = document.getElementById('monitoredArticles');
const changedArticles = document.getElementById('changedArticles');
const articleCitationGain = document.getElementById('articleCitationGain');
const activity = document.getElementById('activity');
const activityCaption = document.getElementById('activityCaption');
const profileFilter = document.getElementById('profileFilter');
const papers = document.getElementById('papers');
const papersCaption = document.getElementById('papersCaption');
const paperSearch = document.getElementById('paperSearch');
const scholarSearchLink = document.getElementById('scholarSearchLink');
const paperProfileFilter = document.getElementById('paperProfileFilter');
const paperSort = document.getElementById('paperSort');
const loadMorePapers = document.getElementById('loadMorePapers');
const profiles = document.getElementById('profiles');
const insights = document.getElementById('insights');
const insightsProfileFilter = document.getElementById('insightsProfileFilter');
const insightsTab = document.getElementById('insightsTab');
const activityTab = document.getElementById('activityTab');
const papersTab = document.getElementById('papersTab');
const profilesTab = document.getElementById('profilesTab');
const activityView = document.getElementById('activityView');
const papersView = document.getElementById('papersView');
const profilesView = document.getElementById('profilesView');
const insightsView = document.getElementById('insightsView');
const statusText = document.getElementById('status');

const PAPER_PAGE_SIZE = 20;
const viewEntries = [
  { id: 'profiles', tab: profilesTab, panel: profilesView },
  { id: 'insights', tab: insightsTab, panel: insightsView },
  { id: 'papers', tab: papersTab, panel: papersView },
  { id: 'activity', tab: activityTab, panel: activityView }
];

let currentState = null;
let stateLoadError = null;
let visiblePaperCount = PAPER_PAGE_SIZE;
let statusMessage = '';
let statusIsError = false;
let radarHelpOpen = false;
let currentTheme = 'forest';

function applyTheme(value) {
  currentTheme = value === 'graphite' ? 'graphite' : 'forest';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeSelect.value = currentTheme;
}

function applyLanguage(value) {
  CitationI18n.setLanguage(value);
  CitationI18n.applyDocument(document);
  languageButton.textContent = CitationI18n.getLanguage() === 'en' ? '中文' : 'EN';
  const previousStatus = statusMessage;
  const previousError = statusIsError;
  if (stateLoadError) renderLoadError(stateLoadError);
  else if (currentState) renderState(currentState, { syncInputs: false });
  setStatus(previousStatus, previousError);
}

async function initializePopup() {
  applyTheme('forest');
  applyLanguage(CitationI18n.getBrowserLanguage());
  try {
    const { uiLanguage, uiTheme } = await chrome.storage.local.get(['uiLanguage', 'uiTheme']);
    applyTheme(uiTheme);
    if (uiLanguage) applyLanguage(uiLanguage);
  } catch (_error) {
    // A missing preference should not prevent citation data from loading.
  }
  await loadState();
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function getScholarUrl(id) {
  return localizeScholarUrl(`https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`);
}

function formatDate(value, includeYear = false) {
  if (!value) {
    return t('notUpdated');
  }

  return new Intl.DateTimeFormat(CitationI18n.getLocale(), {
    ...(includeYear ? { year: 'numeric' } : {}),
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat(CitationI18n.getLocale()).format(value);
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return '--';
  }

  return value >= 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function parseMetricNumber(value) {
  const parsed = Number.parseInt(String(value || '').replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatStoredMetric(value) {
  return value === null || value === undefined || value === '' || value === 'N/A' ? t('unavailable') : value;
}

function getCitationTierClass(value) {
  const count = parseMetricNumber(value);

  if (count === null) {
    return 'tier-unknown';
  }

  if (count >= 100000) {
    return 'tier-100k';
  }

  if (count >= 10000) {
    return 'tier-10k';
  }

  if (count >= 1000) {
    return 'tier-1k';
  }

  if (count >= 100) {
    return 'tier-100';
  }

  if (count >= 10) {
    return 'tier-10';
  }

  return 'tier-low';
}

function setBusy(isBusy) {
  saveButton.disabled = isBusy;
  refreshButton.disabled = isBusy;
  refreshButton.classList.toggle('refreshing', isBusy);
  document.body.classList.toggle('is-busy', isBusy);
}

function setStatus(message, isError = false) {
  statusMessage = message;
  statusIsError = isError;
  const localized = Object.hasOwn(CitationI18n.messages, message) ? t(message) : translateError(message);
  statusText.textContent = localized;
  statusText.title = localized;
  statusText.classList.toggle('error', isError);
}

function setInputOpen(isOpen) {
  inputPanel.hidden = !isOpen;
  toggleInputButton.setAttribute('aria-expanded', String(isOpen));

  if (isOpen) {
    (ownIdInput.value ? idsInput : ownIdInput).focus();
  }
}

function setActiveView(view) {
  viewEntries.forEach(entry => {
    const isActive = entry.id === view;
    entry.panel.hidden = !isActive;
    entry.tab.classList.toggle('active', isActive);
    entry.tab.setAttribute('aria-selected', String(isActive));
    entry.tab.tabIndex = isActive ? 0 : -1;
  });
}

function renderMetrics(state) {
  const delta = state.citationDelta;
  const ownCitations = state.ownCitations || state.citations;
  totalValue.textContent = ownCitations || '--';
  totalDelta.textContent = state.ownCitationDelta === null || state.ownCitationDelta === undefined
    ? ''
    : formatDelta(state.ownCitationDelta);
  totalMetric.className = `metric-composite ${getCitationTierClass(ownCitations)}`;
  totalDelta.classList.toggle('gain', state.ownCitationDelta > 0);
  totalDelta.classList.toggle('loss', state.ownCitationDelta < 0);
  deltaMetric.textContent = formatDelta(delta);
  deltaMetric.classList.toggle('gain', delta > 0);
  deltaMetric.classList.toggle('loss', delta < 0);
}

function renderMonitorSummary(state) {
  const monitor = state.articleMonitorSummary || {};
  monitoredArticles.textContent = Number.isFinite(monitor.trackedArticles)
    ? formatNumber(monitor.trackedArticles)
    : '--';
  changedArticles.textContent = Number.isFinite(monitor.changedArticles)
    ? formatNumber(monitor.changedArticles)
    : '--';
  articleCitationGain.textContent = Number.isFinite(monitor.citationGain)
    ? formatDelta(monitor.citationGain)
    : '--';
  changedArticles.classList.toggle('gain', monitor.changedArticles > 0);
  articleCitationGain.classList.toggle('gain', monitor.citationGain > 0);
}

function createExternalLink(label, href, className = '') {
  const link = document.createElement('a');
  link.textContent = label;
  link.className = className;
  link.href = localizeScholarUrl(href);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function createEmptyState(title, description, isError = false) {
  const empty = document.createElement('div');
  empty.className = `empty-state${isError ? ' error-state' : ''}`;

  const heading = document.createElement('strong');
  heading.textContent = title;

  const body = document.createElement('p');
  body.textContent = description;

  empty.append(heading, body);
  return empty;
}

function createEmptyButton(label, handler) {
  const button = document.createElement('button');
  button.className = 'empty-button';
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', async () => {
    button.disabled = true;
    await handler();
  });
  return button;
}

function renderProfileFilter(items = []) {
  const selected = profileFilter.value;
  profileFilter.replaceChildren();

  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = t('allProfiles');
  profileFilter.append(all);

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.id === currentState.ownScholarId
      ? t('ownName', { name: item.name || item.id })
      : item.name || item.id;
    profileFilter.append(option);
  });

  profileFilter.value = [...profileFilter.options].some(option => option.value === selected)
    ? selected
    : 'all';
}

function renderPaperProfileFilter(items = []) {
  const selected = paperProfileFilter.value;
  paperProfileFilter.replaceChildren();

  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = t('allProfiles');
  paperProfileFilter.append(all);

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.id === currentState.ownScholarId
      ? t('ownName', { name: item.name || item.id })
      : item.name || item.id;
    paperProfileFilter.append(option);
  });

  paperProfileFilter.value = [...paperProfileFilter.options].some(option => option.value === selected)
    ? selected
    : 'all';
}

function getActivityCaption(state, visibleEvents, selectedProfile) {
  const monitor = state.articleMonitorSummary || {};
  const latest = selectedProfile === 'all'
    ? state.latestArticleChanges || []
    : (state.latestArticleChanges || []).filter(event => event.profileId === selectedProfile);
  const latestGain = latest.reduce((sum, event) => sum + event.delta, 0);
  let caption;

  if (state.lastUpdateError) {
    caption = visibleEvents.length > 0
      ? t('checkFailedHistory')
      : t('checkFailedTotals');
  } else if (!monitor.baselineReady && monitor.trackedArticles > 0) {
    caption = t('baselineCreated', { count: formatNumber(monitor.trackedArticles) });
  } else if (latest.length > 0) {
    caption = t('activityGains', { papers: formatNumber(latest.length), citations: formatNumber(latestGain), paperSuffix: latest.length === 1 ? '' : 's', citationSuffix: latestGain === 1 ? '' : 's' });
  } else if (visibleEvents.length > 0) {
    caption = t('noNewIncreases');
  } else if (monitor.trackedArticles > 0) {
    caption = t('watchingPapers', { count: formatNumber(monitor.trackedArticles) });
  } else {
    caption = t('startMonitoring');
  }

  if (monitor.partialProfiles > 0) {
    caption += t('partialProfiles', { count: formatNumber(monitor.partialProfiles), suffix: monitor.partialProfiles === 1 ? '' : 's' });
  }

  return caption;
}

function createEventDetails(event, isLatest) {
  const details = document.createElement('details');
  details.className = `activity-item${isLatest ? ' latest' : ''}`;

  const itemSummary = document.createElement('summary');

  const eventTop = document.createElement('div');
  eventTop.className = 'event-top';

  const profileName = document.createElement('span');
  profileName.className = 'event-profile';
  profileName.textContent = event.isOwn ? t('ownName', { name: event.profileName }) : event.profileName;

  const detected = document.createElement('time');
  detected.dateTime = event.detectedAt;
  detected.textContent = formatDate(event.detectedAt, true);

  const delta = document.createElement('strong');
  delta.className = 'event-delta';
  delta.textContent = formatDelta(event.delta);
  delta.setAttribute('aria-label', t('newCitations', { count: formatNumber(event.delta) }));

  eventTop.append(profileName, detected, delta);

  const title = document.createElement('span');
  title.className = 'event-title';
  title.textContent = event.title;

  const count = document.createElement('span');
  count.className = 'event-count';
  count.textContent = t('citationChange', { before: formatNumber(event.previousCitations), current: formatNumber(event.currentCitations) });

  if (isLatest) {
    const latestLabel = document.createElement('span');
    latestLabel.className = 'latest-label';
    latestLabel.textContent = t('latestCheck');
    count.append(' ', latestLabel);
  }

  itemSummary.append(eventTop, title, count);

  const body = document.createElement('div');
  body.className = 'event-details';

  const metadata = document.createElement('dl');
  [
    [t('before'), formatNumber(event.previousCitations)],
    [t('current'), formatNumber(event.currentCitations)],
    [t('year'), event.year || t('notListed')]
  ].forEach(([label, value]) => {
    const group = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    group.append(term, description);
    metadata.append(group);
  });

  body.append(metadata);

  if (event.authors) {
    const authors = document.createElement('p');
    authors.className = 'event-authors';
    authors.textContent = event.authors;
    body.append(authors);
  }

  if (event.publication) {
    const publication = document.createElement('p');
    publication.className = 'event-publication';
    publication.textContent = event.publication;
    body.append(publication);
  }

  const links = document.createElement('div');
  links.className = 'event-links';

  if (event.articleUrl) {
    links.append(createExternalLink(t('articleDetails'), event.articleUrl));
  }

  if (event.citationsUrl) {
    links.append(createExternalLink(t('citingWorks'), event.citationsUrl));
  }

  if (links.childElementCount) {
    body.append(links);
  }

  details.append(itemSummary, body);
  return details;
}

function renderActivity(state) {
  const events = state.articleCitationEvents || [];
  const selectedProfile = profileFilter.value;
  const visibleEvents = selectedProfile === 'all'
    ? events
    : events.filter(event => event.profileId === selectedProfile);
  const latestIds = new Set((state.latestArticleChanges || []).map(event => event.id));

  activity.replaceChildren();
  activity.setAttribute('aria-busy', 'false');
  activityCaption.textContent = getActivityCaption(state, visibleEvents, selectedProfile);

  if (!visibleEvents.length) {
    const monitor = state.articleMonitorSummary || {};
    const title = state.lastUpdateError
      ? t('scholarCheckFailed')
      : !monitor.baselineReady && monitor.trackedArticles > 0
        ? t('baselineReady')
        : t('noIncreases');
    const description = state.lastUpdateError
      ? translateError(state.lastUpdateError)
      : !monitor.baselineReady && monitor.trackedArticles > 0
        ? t('nextRefresh')
        : selectedProfile === 'all'
          ? t('activityEmpty')
          : t('profileActivityEmpty');
    const emptyState = createEmptyState(title, description, Boolean(state.lastUpdateError));

    if (state.lastUpdateError && state.ownScholarId) {
      emptyState.append(createExternalLink(
        t('openProfile'),
        getScholarUrl(state.ownScholarId),
        'empty-action'
      ));
    }

    activity.append(emptyState);
    return;
  }

  visibleEvents.forEach(event => {
    activity.append(createEventDetails(event, latestIds.has(event.id)));
  });
}

function createPaperItem(paper) {
  const item = document.createElement('article');
  item.className = 'paper-item';

  const main = document.createElement('div');
  main.className = 'paper-main';

  const title = paper.articleUrl
    ? createExternalLink(paper.title, paper.articleUrl, 'paper-title')
    : document.createElement('span');

  if (!paper.articleUrl) {
    title.className = 'paper-title';
    title.textContent = paper.title;
  }

  const authors = document.createElement('p');
  authors.className = 'paper-authors';
  authors.textContent = paper.authors || t('noAuthors');

  const publication = document.createElement('p');
  publication.className = 'paper-publication';
  publication.textContent = paper.publication || t('noPublication');

  main.append(title, authors, publication);

  const citation = paper.citationsUrl
    ? createExternalLink('', paper.citationsUrl, 'paper-citations')
    : document.createElement('span');
  citation.className = 'paper-citations';
  citation.setAttribute('aria-label', t('citationsCount', { count: formatNumber(paper.citations || 0) }));

  const citationValue = document.createElement('strong');
  citationValue.textContent = formatNumber(paper.citations || 0);
  const citationLabel = document.createElement('span');
  citationLabel.textContent = t('citationUnit');
  citation.append(citationValue, citationLabel);

  const footer = document.createElement('div');
  footer.className = 'paper-footer';

  const profileName = document.createElement('span');
  profileName.className = 'paper-profile';
  profileName.textContent = paper.isOwn
    ? t('ownName', { name: paper.profileName })
    : paper.profileName;
  footer.append(profileName);

  if (paper.year) {
    const year = document.createElement('span');
    year.textContent = paper.year;
    footer.append(year);
  }

  if (paper.latestDelta > 0) {
    const gain = document.createElement('strong');
    gain.className = 'paper-gain';
    gain.textContent = t('latestGain', { delta: formatDelta(paper.latestDelta) });
    footer.append(gain);
  }

  item.append(main, citation, footer);
  return item;
}

function renderPapers(state) {
  const allPapers = CitationPaperUtils.buildPaperRows(state);
  const query = paperSearch.value.trim();
  const visiblePapers = CitationPaperUtils.filterAndSortPapers(allPapers, {
    profileId: paperProfileFilter.value,
    query,
    sort: paperSort.value
  });
  const page = visiblePapers.slice(0, visiblePaperCount);
  const remaining = Math.max(0, visiblePapers.length - page.length);

  scholarSearchLink.hidden = !query;
  scholarSearchLink.href = localizeScholarUrl(CitationPaperUtils.getScholarSearchUrl(query));
  scholarSearchLink.title = query
    ? t('searchQuery', { query })
    : '';

  papers.replaceChildren();
  papers.setAttribute('aria-busy', 'false');

  if (!visiblePapers.length) {
    const hasStoredPapers = allPapers.length > 0;
    const title = hasStoredPapers
      ? t('noMatches')
      : state.lastUpdateError
        ? t('syncFailed')
        : t('noPapers');
    const description = hasStoredPapers
      ? t('noMatchesHint')
      : state.lastUpdateError
        ? translateError(state.lastUpdateError)
        : t('syncHint');
    const emptyState = createEmptyState(title, description, Boolean(state.lastUpdateError && !hasStoredPapers));

    if (!hasStoredPapers && state.ownScholarId) {
      const actions = document.createElement('div');
      actions.className = 'empty-actions';
      actions.append(createEmptyButton(
        state.lastUpdateError ? t('retrySync') : t('syncPapers'),
        refreshCitations
      ));

      if (state.lastUpdateError) {
        actions.append(createExternalLink(
          t('openProfile'),
          getScholarUrl(state.ownScholarId),
          'empty-action'
        ));
      }

      emptyState.append(actions);
    }

    papers.append(emptyState);
    papersCaption.textContent = hasStoredPapers && query
      ? t('noQueryMatches', { query })
      : t('noLocalPapers');
    loadMorePapers.hidden = true;
    return;
  }

  page.forEach(paper => papers.append(createPaperItem(paper)));
  papersCaption.textContent = t('showingPapers', { visible: formatNumber(page.length), total: formatNumber(visiblePapers.length) });

  if (state.lastUpdateError) {
    papersCaption.textContent += t('showingSaved');
  } else if ((state.articleMonitorSummary || {}).partialProfiles > 0) {
    papersCaption.textContent += t('somePartial');
  }

  loadMorePapers.hidden = remaining === 0;
  loadMorePapers.textContent = t('showMore', { count: formatNumber(Math.min(PAPER_PAGE_SIZE, remaining)) });
}

function renderProfiles(items = []) {
  profiles.replaceChildren();

  if (!items.length) {
    profiles.append(createEmptyState(
      t('noProfiles'),
      t('addProfileHint')
    ));
    return;
  }

  items.forEach(item => {
    const profileUrl = item.url || getScholarUrl(item.id);
    const card = document.createElement('article');
    card.className = `profile-card ${item.isOwn ? 'own-card' : ''} ${getCitationTierClass(item.citations)}`;

    const top = document.createElement('div');
    top.className = 'profile-top';

    const identity = document.createElement('div');
    identity.className = 'profile-identity';

    const name = createExternalLink(item.name || item.id, profileUrl, 'profile-name');
    const id = document.createElement('span');
    id.className = 'profile-id';
    id.textContent = item.id;
    identity.append(name, id);

    const tools = document.createElement('div');
    tools.className = 'profile-tools';

    if (item.isOwn) {
      const badge = document.createElement('span');
      badge.className = 'own-badge';
      badge.textContent = t('you');
      tools.append(badge);
    } else {
      const remove = document.createElement('button');
      remove.className = 'remove-button';
      remove.type = 'button';
      remove.setAttribute('aria-label', t('removeName', { name: item.name || item.id }));
      remove.title = t('removeProfile');
      remove.textContent = '×';
      remove.addEventListener('click', () => removeTrackedId(item.id));
      tools.append(remove);
    }

    top.append(identity, tools);

    const stats = document.createElement('div');
    stats.className = 'profile-stats';

    [
      [t('citations'), formatStoredMetric(item.citations)],
      [t('hIndex'), formatStoredMetric(item.hIndex)],
      [t('i10Index'), formatStoredMetric(item.i10Index)]
    ].forEach(([label, value], index) => {
      const stat = document.createElement('div');
      const statLabel = document.createElement('span');
      const statValue = document.createElement('strong');
      if (index === 0) {
        stat.className = 'primary-stat';
      }
      statLabel.textContent = label;
      statValue.textContent = value;
      stat.append(statLabel, statValue);
      stats.append(stat);
    });

    const coverage = document.createElement('div');
    coverage.className = 'profile-coverage';
    const watched = Number.isFinite(item.trackedArticles) ? item.trackedArticles : item.articleCount || 0;
    coverage.textContent = t('papersWatched', { count: formatNumber(watched) });

    if (item.changedArticles > 0) {
      const gain = document.createElement('strong');
      gain.textContent = t('profileGains', { count: formatNumber(item.changedArticles), delta: formatDelta(item.articleCitationGain) });
      coverage.append(gain);
    } else {
      const completeness = document.createElement('span');
      completeness.textContent = item.articlesComplete
        ? t('fullProfile')
        : watched > 0 ? t('partialCoverage') : t('noPaperCoverage');
      coverage.append(completeness);
    }

    card.append(top, stats, coverage);

    if (item.error || item.articleFetchError) {
      const error = document.createElement('p');
      error.className = 'profile-error';
      error.textContent = translateError(item.error || item.articleFetchError);
      card.append(error);
    }

    profiles.append(card);
  });
}

function getAnnualCitationData(profile, state, currentYear = new Date().getFullYear()) {
  const syncedAt = [profile.citationHistoryUpdatedAt, state.lastUpdated]
    .find(value => value && Number.isFinite(new Date(value).getTime())) || null;
  // A year captured before it ended remains partial, even when viewing an old cache later.
  const incompleteFromYear = Math.min(currentYear, syncedAt ? new Date(syncedAt).getFullYear() : currentYear);
  const rows = new Map();
  (Array.isArray(profile.citationHistory) ? profile.citationHistory : []).forEach(item => {
    if (Number.isInteger(item.year) && item.year > 0 && item.year <= currentYear
      && Number.isFinite(item.citations) && item.citations >= 0) {
      rows.set(item.year, { year: item.year, citations: item.citations });
    }
  });
  const history = [...rows.values()].sort((a, b) => a.year - b.year);
  const completeHistory = history.filter(item => item.year < incompleteFromYear);
  const latest = completeHistory.at(-1);
  const previous = latest && completeHistory.find(item => item.year === latest.year - 1);
  const comparison = previous && previous.citations > 0 ? {
    year: latest.year,
    previousYear: previous.year,
    citations: latest.citations,
    previousCitations: previous.citations,
    change: Math.round((latest.citations - previous.citations) / previous.citations * 100)
  } : null;
  return { history, comparison, syncedAt, incompleteFromYear, currentYear };
}

function getRadarSignals(profile, state, annual) {
  const articles = (state.articleSnapshots || {})[profile.id]?.articles || [];
  const total = articles.length;
  const cited = articles.filter(article => article.citations > 0).length;
  const comparison = annual.comparison;
  return {
    reach: total ? cited / total * 100 : null,
    reachDescription: total
      ? t('paperReachHint', { total: formatNumber(total), cited: formatNumber(cited) })
      : t('paperReachUnavailable'),
    momentum: comparison ? Math.min(100, comparison.citations / comparison.previousCitations * 65) : null,
    momentumDescription: comparison
      ? t('momentumHint', { year: comparison.year, previousYear: comparison.previousYear })
      : t('momentumUnavailable')
  };
}

function createImpactRadar(profile, signals) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 280 240');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('radarLabel', { name: profile.name || profile.id }));
  const center = { x: 140, y: 112 };
  const radius = 76;
  const metrics = [
    [t('citations'), Math.min(100, Math.log10((profile.citationsNumber || 0) + 1) / 6 * 100)],
    [t('hIndex'), Math.min(100, (parseMetricNumber(profile.hIndex) || 0) / 100 * 100)],
    [t('i10Index'), Math.min(100, (parseMetricNumber(profile.i10Index) || 0) / 150 * 100)],
    [t('paperReach'), signals.reach, signals.reachDescription],
    [t('momentum'), signals.momentum, signals.momentumDescription]
  ];
  const point = (index, value = 100) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / metrics.length;
    const scale = value / 100;
    return `${center.x + Math.cos(angle) * radius * scale},${center.y + Math.sin(angle) * radius * scale}`;
  };

  [1, .66, .33].forEach(scale => {
    const grid = document.createElementNS(svg.namespaceURI, 'polygon');
    grid.setAttribute('points', metrics.map((_, index) => point(index, scale * 100)).join(' '));
    grid.setAttribute('class', 'radar-grid');
    svg.append(grid);
  });
  metrics.forEach((metric, index) => {
    const axis = document.createElementNS(svg.namespaceURI, 'line');
    const [x, y] = point(index).split(',');
    axis.setAttribute('x1', center.x); axis.setAttribute('y1', center.y);
    axis.setAttribute('x2', x); axis.setAttribute('y2', y); axis.setAttribute('class', 'radar-axis');
    const label = document.createElementNS(svg.namespaceURI, 'text');
    const [labelX, labelY] = point(index, 122).split(',');
    label.setAttribute('x', labelX); label.setAttribute('y', labelY);
    label.setAttribute('class', 'radar-label'); label.textContent = metric[0];
    if (metric[2]) {
      const description = document.createElementNS(svg.namespaceURI, 'title');
      description.textContent = metric[2];
      label.append(description);
    }
    if (metric[1] === null) label.setAttribute('class', 'radar-label unavailable');
    svg.append(axis, label);
  });
  const shape = document.createElementNS(svg.namespaceURI, 'polygon');
  shape.setAttribute('points', metrics.map((metric, index) => point(index, metric[1] ?? 0)).join(' '));
  shape.setAttribute('class', 'radar-shape');
  svg.append(shape);
  return svg;
}

function createRadarHelp(signals) {
  const details = document.createElement('details'); details.className = 'radar-help';
  details.open = radarHelpOpen;
  details.addEventListener('toggle', () => { radarHelpOpen = details.open; });
  const heading = document.createElement('summary'); heading.textContent = t('radarHelp');
  const descriptions = document.createElement('dl');
  [[t('paperReach'), signals.reachDescription], [t('momentum'), signals.momentumDescription]].forEach(([label, description]) => {
    const term = document.createElement('dt'); term.textContent = label;
    const body = document.createElement('dd'); body.textContent = description;
    descriptions.append(term, body);
  });
  details.append(heading, descriptions);
  return details;
}

function createInsightHeading(title, description) {
  const group = document.createElement('div');
  const heading = document.createElement('h3'); heading.textContent = title;
  const caption = document.createElement('p'); caption.textContent = description;
  group.append(heading, caption);
  return group;
}

function renderInsights(state, orderedProfiles) {
  const previousSelection = insightsProfileFilter.value;
  insightsProfileFilter.replaceChildren();
  orderedProfiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.isOwn ? t('ownName', { name: profile.name || profile.id }) : profile.name || profile.id;
    insightsProfileFilter.append(option);
  });
  if (orderedProfiles.some(profile => profile.id === previousSelection)) {
    insightsProfileFilter.value = previousSelection;
  }
  const profile = orderedProfiles.find(item => item.id === insightsProfileFilter.value) || orderedProfiles[0];
  insights.replaceChildren();
  if (!profile) {
    insights.append(createEmptyState(t('noInsights'), t('insightsHint')));
    return;
  }
  const annual = getAnnualCitationData(profile, state);
  const { history, comparison } = annual;
  const chartCard = document.createElement('article'); chartCard.className = 'insight-card annual-card';
  const header = document.createElement('div'); header.className = 'insight-card-header';
  header.append(createInsightHeading(t('annualCitations'), t('publicHistory')));
  if (comparison) {
    const delta = document.createElement('strong'); delta.className = 'insight-delta';
    delta.textContent = t('yearOverYear', { year: comparison.year, change: `${comparison.change >= 0 ? '+' : ''}${comparison.change}` });
    delta.title = t('yearOverYearHint', {
      year: comparison.year, previousYear: comparison.previousYear,
      before: formatNumber(comparison.previousCitations), current: formatNumber(comparison.citations)
    });
    delta.classList.toggle('loss', comparison.change < 0);
    header.append(delta);
  }
  chartCard.append(header);
  if (history.length) {
    const chart = document.createElement('div'); chart.className = 'annual-chart';
    const max = Math.max(...history.map(item => item.citations), 1);
    const chartNumbers = new Intl.NumberFormat(CitationI18n.getLocale(), {
      notation: 'compact', maximumSignificantDigits: 3
    });
    history.slice(-12).forEach((item, index, visibleHistory) => {
      const partial = item.year >= annual.incompleteFromYear;
      const isCurrent = item.year === annual.currentYear;
      const column = document.createElement('div'); column.className = `annual-column${partial ? ' partial-year' : ''}`;
      const value = document.createElement('span'); value.className = 'annual-value'; value.textContent = chartNumbers.format(item.citations);
      value.hidden = visibleHistory.length > 8 && index % 2 === 1 && index !== visibleHistory.length - 1;
      const track = document.createElement('div'); track.className = 'annual-bar-track';
      const bar = document.createElement('i'); bar.style.height = `${Math.max(4, item.citations / max * 100)}%`;
      const description = t(partial ? (isCurrent ? 'annualCurrentValue' : 'annualCachedValue') : 'annualValue', {
        year: item.year, count: formatNumber(item.citations)
      });
      bar.title = annual.syncedAt ? t('annualAsOfDate', { value: description, date: formatDate(annual.syncedAt, true) }) : description;
      bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', bar.title);
      const year = document.createElement('small'); year.textContent = `${item.year}${partial ? '*' : ''}`;
      if (partial) year.setAttribute('aria-label', t(isCurrent ? 'annualCurrentLabel' : 'annualCachedLabel', { year: item.year }));
      bar.append(value); track.append(bar);
      column.append(track, year); chart.append(column);
    });
    chartCard.append(chart);
    history.filter(item => item.year >= annual.incompleteFromYear).forEach(item => {
      const note = document.createElement('p'); note.className = 'annual-note';
      note.textContent = t(item.year === annual.currentYear ? 'annualPartialNote' : 'annualCachedNote', { year: item.year });
      chartCard.append(note);
    });
  } else {
    const empty = document.createElement('p'); empty.className = 'insight-empty'; empty.textContent = t('annualEmpty'); chartCard.append(empty);
  }
  const radarCard = document.createElement('article'); radarCard.className = 'insight-card radar-card';
  const radarHeader = document.createElement('div'); radarHeader.className = 'insight-card-header';
  radarHeader.append(createInsightHeading(t('impactRadar'), t('profileSnapshot')));
  radarCard.append(radarHeader);
  const signals = getRadarSignals(profile, state, annual);
  radarCard.append(createImpactRadar(profile, signals));
  const note = document.createElement('p'); note.className = 'radar-note'; note.textContent = t('radarNote'); radarCard.append(note);
  radarCard.append(createRadarHelp(signals));
  insights.append(chartCard, radarCard);
}

function renderState(state, { syncInputs = true } = {}) {
  currentState = state;
  stateLoadError = null;
  const ownScholarId = state.ownScholarId || (state.scholarIds || [])[0] || '';
  const trackedScholarIds = state.trackedScholarIds || (state.scholarIds || []).filter(id => id !== ownScholarId);
  const orderedProfiles = [...(state.citationProfiles || [])]
    .map(profile => ({
      ...profile,
      isOwn: profile.id === ownScholarId
    }))
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn));

  if (syncInputs) {
    ownIdInput.value = ownScholarId;
    idsInput.value = trackedScholarIds.join('\n');
  }
  summary.textContent = state.lastUpdated ? t('updated', { date: formatDate(state.lastUpdated) }) : t('notUpdated');
  renderMetrics(state);
  renderMonitorSummary(state);
  renderProfileFilter(orderedProfiles);
  renderPaperProfileFilter(orderedProfiles);
  renderActivity(state);
  renderPapers(state);
  renderProfiles(orderedProfiles);
  renderInsights(state, orderedProfiles);

  if (state.lastUpdateError) {
    setStatus('lastRefreshFailed', true);
  } else if ((state.articleMonitorSummary || {}).partialProfiles > 0) {
    setStatus('partialCoverage');
  }
}

function renderLoadError(error) {
  activity.replaceChildren(createEmptyState(t('loadDataFailed'), t('reloadHint'), true));
  activity.setAttribute('aria-busy', 'false');
  papers.replaceChildren(createEmptyState(t('loadPapersFailed'), t('reloadHint'), true));
  papers.setAttribute('aria-busy', 'false');
  profiles.replaceChildren(createEmptyState(t('loadProfilesFailed'), t('reloadHint'), true));
  insights.replaceChildren(createEmptyState(t('loadDataFailed'), t('reloadHint'), true));
  setStatus(error.message, true);
}

async function loadState({ clearStatus = true } = {}) {
  if (clearStatus) {
    setStatus('');
  }

  try {
    const state = await sendMessage({ type: 'getState' });
    renderState(state || {});
  } catch (error) {
    stateLoadError = error;
    renderLoadError(error);
  }
}

async function saveIds() {
  if (!ownIdInput.value.trim()) {
    setStatus('enterId', true);
    ownIdInput.focus();
    return;
  }
  setBusy(true);
  setStatus('saving');

  try {
    const response = await sendMessage({
      type: 'saveScholarConfig',
      ownScholarId: ownIdInput.value,
      trackedScholarIds: idsInput.value
    });

    if (!response || !response.ok) {
      await loadState();
      setStatus('savedRefreshFailed', true);
      return;
    }

    await loadState();
    setInputOpen(false);
    setStatus('saved');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function removeTrackedId(id) {
  setBusy(true);
  setStatus('removing');

  try {
    const response = await sendMessage({
      type: 'removeTrackedScholarId',
      id
    });

    if (!response || !response.ok) {
      await loadState();
      setStatus('removedRefreshFailed', true);
      return;
    }

    await loadState();
    setStatus('removed');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function refreshCitations() {
  setBusy(true);
  setStatus('checking');

  try {
    const response = await sendMessage({ type: 'refreshCitations' });
    if (!response || !response.ok) {
      await loadState();
      setStatus('refreshFailed', true);
      return;
    }

    await loadState();
    setStatus('refreshed');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

themeSelect.addEventListener('change', async () => {
  const previousTheme = currentTheme;
  const nextTheme = themeSelect.value;
  themeSelect.disabled = true;
  applyTheme(nextTheme);
  try {
    await chrome.storage.local.set({ uiTheme: currentTheme });
  } catch (_error) {
    applyTheme(previousTheme);
    setStatus('themeSaveFailed', true);
  } finally {
    themeSelect.disabled = false;
  }
});

languageButton.addEventListener('click', async () => {
  const nextLanguage = CitationI18n.getLanguage() === 'en' ? 'zh-CN' : 'en';
  languageButton.disabled = true;
  try {
    await chrome.storage.local.set({ uiLanguage: nextLanguage });
    applyLanguage(nextLanguage);
  } catch (_error) {
    setStatus('languageSaveFailed', true);
  } finally {
    languageButton.disabled = false;
  }
});
saveButton.addEventListener('click', saveIds);
refreshButton.addEventListener('click', refreshCitations);
toggleInputButton.addEventListener('click', () => setInputOpen(inputPanel.hidden));
cancelInputButton.addEventListener('click', () => setInputOpen(false));
profileFilter.addEventListener('change', () => {
  if (currentState) {
    renderActivity(currentState);
  }
});
insightsProfileFilter.addEventListener('change', () => {
  if (currentState) renderState(currentState);
});
paperSearch.addEventListener('input', () => {
  visiblePaperCount = PAPER_PAGE_SIZE;
  if (currentState) {
    renderPapers(currentState);
  }
});
paperProfileFilter.addEventListener('change', () => {
  visiblePaperCount = PAPER_PAGE_SIZE;
  if (currentState) {
    renderPapers(currentState);
  }
});
paperSort.addEventListener('change', () => {
  visiblePaperCount = PAPER_PAGE_SIZE;
  if (currentState) {
    renderPapers(currentState);
  }
});
loadMorePapers.addEventListener('click', () => {
  visiblePaperCount += PAPER_PAGE_SIZE;
  if (currentState) {
    renderPapers(currentState);
  }
});
viewEntries.forEach((entry, index) => {
  entry.tab.addEventListener('click', () => setActiveView(entry.id));
  entry.tab.addEventListener('keydown', event => {
    let nextIndex = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % viewEntries.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + viewEntries.length) % viewEntries.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = viewEntries.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveView(viewEntries[nextIndex].id);
      viewEntries[nextIndex].tab.focus();
    }
  });
});

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.uiTheme) {
      applyTheme(changes.uiTheme.newValue);
    }
    if (areaName === 'local' && changes.uiLanguage) {
      applyLanguage(changes.uiLanguage.newValue || CitationI18n.getBrowserLanguage());
    }
    if (areaName === 'local' && (
      changes.articleSnapshots
      || changes.latestArticleChanges
      || changes.lastUpdated
      || changes.lastUpdateError
    )) {
      loadState({ clearStatus: false });
    }
  });
}

document.addEventListener('DOMContentLoaded', initializePopup);
