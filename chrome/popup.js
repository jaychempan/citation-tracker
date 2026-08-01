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
const activityTab = document.getElementById('activityTab');
const papersTab = document.getElementById('papersTab');
const profilesTab = document.getElementById('profilesTab');
const activityView = document.getElementById('activityView');
const papersView = document.getElementById('papersView');
const profilesView = document.getElementById('profilesView');
const statusText = document.getElementById('status');

const PAPER_PAGE_SIZE = 20;
const viewEntries = [
  { id: 'profiles', tab: profilesTab, panel: profilesView },
  { id: 'papers', tab: papersTab, panel: papersView },
  { id: 'activity', tab: activityTab, panel: activityView }
];

let currentState = null;
let visiblePaperCount = PAPER_PAGE_SIZE;

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function getScholarUrl(id) {
  return `https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`;
}

function formatDate(value, includeYear = false) {
  if (!value) {
    return 'Not updated yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    ...(includeYear ? { year: 'numeric' } : {}),
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
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
  statusText.textContent = message;
  statusText.title = message;
  statusText.classList.toggle('error', isError);
}

function setInputOpen(isOpen) {
  inputPanel.hidden = !isOpen;
  toggleInputButton.setAttribute('aria-expanded', String(isOpen));
  toggleInputButton.textContent = isOpen ? '×' : '+';

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
  totalMetric.className = getCitationTierClass(ownCitations);
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
  link.href = href;
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
  all.textContent = 'All profiles';
  profileFilter.append(all);

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.id === currentState.ownScholarId
      ? `${item.name || item.id} (You)`
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
  all.textContent = 'All profiles';
  paperProfileFilter.append(all);

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.id === currentState.ownScholarId
      ? `${item.name || item.id} (You)`
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
      ? 'The last check failed. Showing saved history.'
      : 'The last check failed. Previous citation totals were preserved.';
  } else if (!monitor.baselineReady && monitor.trackedArticles > 0) {
    caption = `Baseline created for ${formatNumber(monitor.trackedArticles)} papers. Changes appear after the next check.`;
  } else if (latest.length > 0) {
    caption = `${formatNumber(latest.length)} paper${latest.length === 1 ? '' : 's'} gained ${formatNumber(latestGain)} citation${latestGain === 1 ? '' : 's'} on this check.`;
  } else if (visibleEvents.length > 0) {
    caption = 'No new increases on this check. Showing recent history.';
  } else if (monitor.trackedArticles > 0) {
    caption = `Watching ${formatNumber(monitor.trackedArticles)} papers every 30 minutes.`;
  } else {
    caption = 'Add a public Scholar profile to start monitoring papers.';
  }

  if (monitor.partialProfiles > 0) {
    caption += ` Coverage is partial for ${formatNumber(monitor.partialProfiles)} profile${monitor.partialProfiles === 1 ? '' : 's'}.`;
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
  profileName.textContent = event.isOwn ? `${event.profileName} (You)` : event.profileName;

  const detected = document.createElement('time');
  detected.dateTime = event.detectedAt;
  detected.textContent = formatDate(event.detectedAt, true);

  const delta = document.createElement('strong');
  delta.className = 'event-delta';
  delta.textContent = formatDelta(event.delta);
  delta.setAttribute('aria-label', `${event.delta} new citations`);

  eventTop.append(profileName, detected, delta);

  const title = document.createElement('span');
  title.className = 'event-title';
  title.textContent = event.title;

  const count = document.createElement('span');
  count.className = 'event-count';
  count.textContent = `${formatNumber(event.previousCitations)} to ${formatNumber(event.currentCitations)} citations`;

  if (isLatest) {
    const latestLabel = document.createElement('span');
    latestLabel.className = 'latest-label';
    latestLabel.textContent = 'Latest check';
    count.append(' ', latestLabel);
  }

  itemSummary.append(eventTop, title, count);

  const body = document.createElement('div');
  body.className = 'event-details';

  const metadata = document.createElement('dl');
  [
    ['Before', formatNumber(event.previousCitations)],
    ['Current', formatNumber(event.currentCitations)],
    ['Year', event.year || 'Not listed']
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
    links.append(createExternalLink('Article details', event.articleUrl));
  }

  if (event.citationsUrl) {
    links.append(createExternalLink('Citing works', event.citationsUrl));
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
      ? 'Could not check Google Scholar'
      : !monitor.baselineReady && monitor.trackedArticles > 0
        ? 'Article baseline is ready'
        : 'No citation increases yet';
    const description = state.lastUpdateError
      ? state.lastUpdateError
      : !monitor.baselineReady && monitor.trackedArticles > 0
        ? 'The next successful refresh will identify exactly which papers gained citations.'
        : selectedProfile === 'all'
          ? 'Citation increases will appear here with article details and before-and-after counts.'
          : 'No saved citation increases for this profile.';
    const emptyState = createEmptyState(title, description, Boolean(state.lastUpdateError));

    if (state.lastUpdateError && state.ownScholarId) {
      emptyState.append(createExternalLink(
        'Open Scholar profile',
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
  authors.textContent = paper.authors || 'Authors not listed';

  const publication = document.createElement('p');
  publication.className = 'paper-publication';
  publication.textContent = paper.publication || 'Publication not listed';

  main.append(title, authors, publication);

  const citation = paper.citationsUrl
    ? createExternalLink('', paper.citationsUrl, 'paper-citations')
    : document.createElement('span');
  citation.className = 'paper-citations';
  citation.setAttribute('aria-label', `${formatNumber(paper.citations || 0)} citations`);

  const citationValue = document.createElement('strong');
  citationValue.textContent = formatNumber(paper.citations || 0);
  const citationLabel = document.createElement('span');
  citationLabel.textContent = 'citations';
  citation.append(citationValue, citationLabel);

  const footer = document.createElement('div');
  footer.className = 'paper-footer';

  const profileName = document.createElement('span');
  profileName.className = 'paper-profile';
  profileName.textContent = paper.isOwn
    ? `${paper.profileName} (You)`
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
    gain.textContent = `${formatDelta(paper.latestDelta)} latest`;
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
  scholarSearchLink.href = CitationPaperUtils.getScholarSearchUrl(query);
  scholarSearchLink.title = query
    ? `Search Google Scholar for ${query}`
    : '';

  papers.replaceChildren();
  papers.setAttribute('aria-busy', 'false');

  if (!visiblePapers.length) {
    const hasStoredPapers = allPapers.length > 0;
    const title = hasStoredPapers
      ? 'No saved matches'
      : state.lastUpdateError
        ? 'Paper sync failed'
        : 'No saved papers yet';
    const description = hasStoredPapers
      ? 'This field only filters saved profile papers. Use Search Scholar online for broader results.'
      : state.lastUpdateError
        ? state.lastUpdateError
        : 'Sync the tracked profile once to save its public paper list and citation counts.';
    const emptyState = createEmptyState(title, description, Boolean(state.lastUpdateError && !hasStoredPapers));

    if (!hasStoredPapers && state.ownScholarId) {
      const actions = document.createElement('div');
      actions.className = 'empty-actions';
      actions.append(createEmptyButton(
        state.lastUpdateError ? 'Try paper sync again' : 'Sync profile papers',
        refreshCitations
      ));

      if (state.lastUpdateError) {
        actions.append(createExternalLink(
          'Open Scholar profile',
          getScholarUrl(state.ownScholarId),
          'empty-action'
        ));
      }

      emptyState.append(actions);
    }

    papers.append(emptyState);
    papersCaption.textContent = hasStoredPapers && query
      ? `No saved matches for "${query}".`
      : 'No papers are saved locally. Sync the profile or search Scholar online.';
    loadMorePapers.hidden = true;
    return;
  }

  page.forEach(paper => papers.append(createPaperItem(paper)));
  papersCaption.textContent = `Showing ${formatNumber(page.length)} of ${formatNumber(visiblePapers.length)} papers. Checked every 30 minutes.`;

  if (state.lastUpdateError) {
    papersCaption.textContent += ' Showing saved data because the latest check failed.';
  } else if ((state.articleMonitorSummary || {}).partialProfiles > 0) {
    papersCaption.textContent += ' Some profiles have partial coverage.';
  }

  loadMorePapers.hidden = remaining === 0;
  loadMorePapers.textContent = `Show ${formatNumber(Math.min(PAPER_PAGE_SIZE, remaining))} more`;
}

function renderProfiles(items = []) {
  profiles.replaceChildren();

  if (!items.length) {
    profiles.append(createEmptyState(
      'No profiles yet',
      'Open settings and enter a public Google Scholar user ID.'
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
      badge.textContent = 'You';
      tools.append(badge);
    } else {
      const remove = document.createElement('button');
      remove.className = 'remove-button';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${item.name || item.id}`);
      remove.title = 'Remove profile';
      remove.textContent = '×';
      remove.addEventListener('click', () => removeTrackedId(item.id));
      tools.append(remove);
    }

    top.append(identity, tools);

    const stats = document.createElement('div');
    stats.className = 'profile-stats';

    [
      ['Citations', item.citations || 'N/A'],
      ['h-index', item.hIndex || 'N/A'],
      ['i10-index', item.i10Index || 'N/A']
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
    coverage.textContent = `${formatNumber(watched)} papers watched`;

    if (item.changedArticles > 0) {
      const gain = document.createElement('strong');
      gain.textContent = `${formatNumber(item.changedArticles)} increased, ${formatDelta(item.articleCitationGain)}`;
      coverage.append(gain);
    } else {
      const completeness = document.createElement('span');
      completeness.textContent = item.articlesComplete ? 'Full profile' : 'Partial coverage';
      coverage.append(completeness);
    }

    card.append(top, stats, coverage);

    if (item.error || item.articleFetchError) {
      const error = document.createElement('p');
      error.className = 'profile-error';
      error.textContent = item.error || item.articleFetchError;
      card.append(error);
    }

    profiles.append(card);
  });
}

function renderState(state) {
  currentState = state;
  const ownScholarId = state.ownScholarId || (state.scholarIds || [])[0] || '';
  const trackedScholarIds = state.trackedScholarIds || (state.scholarIds || []).filter(id => id !== ownScholarId);
  const orderedProfiles = [...(state.citationProfiles || [])]
    .map(profile => ({
      ...profile,
      isOwn: profile.id === ownScholarId
    }))
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn));

  ownIdInput.value = ownScholarId;
  idsInput.value = trackedScholarIds.join('\n');
  summary.textContent = `Updated ${formatDate(state.lastUpdated)}`;
  renderMetrics(state);
  renderMonitorSummary(state);
  renderProfileFilter(orderedProfiles);
  renderPaperProfileFilter(orderedProfiles);
  renderActivity(state);
  renderPapers(state);
  renderProfiles(orderedProfiles);

  if (state.lastUpdateError) {
    setStatus('Last refresh failed', true);
  } else if ((state.articleMonitorSummary || {}).partialProfiles > 0) {
    setStatus('Partial coverage');
  }
}

async function loadState({ clearStatus = true } = {}) {
  if (clearStatus) {
    setStatus('');
  }

  try {
    const state = await sendMessage({ type: 'getState' });
    renderState(state || {});
  } catch (error) {
    activity.replaceChildren(createEmptyState(
      'Unable to load saved data',
      'Reload the extension and try again.',
      true
    ));
    activity.setAttribute('aria-busy', 'false');
    papers.replaceChildren(createEmptyState(
      'Unable to load saved papers',
      'Reload the extension and try again.',
      true
    ));
    papers.setAttribute('aria-busy', 'false');
    profiles.replaceChildren(createEmptyState(
      'Unable to load profiles',
      'Reload the extension and try again.',
      true
    ));
    setStatus(error.message, true);
  }
}

async function saveIds() {
  setBusy(true);
  setStatus('Saving...');

  try {
    const response = await sendMessage({
      type: 'saveScholarConfig',
      ownScholarId: ownIdInput.value,
      trackedScholarIds: idsInput.value
    });

    if (!response || !response.ok) {
      await loadState();
      setStatus('Saved, refresh failed', true);
      return;
    }

    await loadState();
    setInputOpen(false);
    setStatus('Saved and refreshed.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function removeTrackedId(id) {
  setBusy(true);
  setStatus('Removing...');

  try {
    const response = await sendMessage({
      type: 'removeTrackedScholarId',
      id
    });

    if (!response || !response.ok) {
      await loadState();
      setStatus('Removed, refresh failed', true);
      return;
    }

    await loadState();
    setStatus('Profile removed.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function refreshCitations() {
  setBusy(true);
  setStatus('Checking profiles and papers...');

  try {
    const response = await sendMessage({ type: 'refreshCitations' });
    if (!response || !response.ok) {
      await loadState();
      setStatus('Refresh failed', true);
      return;
    }

    await loadState();
    setStatus('Refresh complete.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

saveButton.addEventListener('click', saveIds);
refreshButton.addEventListener('click', refreshCitations);
toggleInputButton.addEventListener('click', () => setInputOpen(inputPanel.hidden));
cancelInputButton.addEventListener('click', () => setInputOpen(false));
profileFilter.addEventListener('change', () => {
  if (currentState) {
    renderActivity(currentState);
  }
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

document.addEventListener('DOMContentLoaded', loadState);
