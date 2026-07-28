const DEFAULT_SCHOLAR_IDS = ['DhtAFkwAAAAJ'];
const UPDATE_ALARM = 'periodicUpdate';
const SCHOLAR_PAGE_SIZE = 100;
const MAX_ARTICLE_PAGES = 5;
const MAX_ARTICLE_EVENTS = 200;
const ARTICLE_EVENT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const SCHOLAR_REQUEST_TIMEOUT_MS = 15000;

let updateInFlight = null;

function getScholarUrl(id) {
  return `https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`;
}

function getScholarPageUrl(id, start = 0) {
  const url = new URL(getScholarUrl(id));
  url.searchParams.set('pagesize', String(SCHOLAR_PAGE_SIZE));

  if (start > 0) {
    url.searchParams.set('cstart', String(start));
  }

  return url.toString();
}

function normalizeScholarIds(value) {
  const rawIds = Array.isArray(value) ? value : String(value || '').split(/[\s,;]+/);

  return [...new Set(rawIds
    .map(id => String(id).trim())
    .filter(Boolean)
    .filter(id => /^[A-Za-z0-9_-]+$/.test(id)))];
}

function getFromStorage(keys) {
  return chrome.storage.local.get(keys);
}

function setStorage(values) {
  return chrome.storage.local.set(values);
}

async function getStoredScholarConfig() {
  const { scholarIds, ownScholarId, trackedScholarIds } = await getFromStorage([
    'scholarIds',
    'ownScholarId',
    'trackedScholarIds'
  ]);
  const legacyIds = normalizeScholarIds(scholarIds);
  const ownIds = normalizeScholarIds(ownScholarId || legacyIds[0]);
  const trackedIds = normalizeScholarIds(trackedScholarIds && trackedScholarIds.length ? trackedScholarIds : legacyIds.slice(1));
  const fallbackOwnId = ownIds[0] || DEFAULT_SCHOLAR_IDS[0];
  const trackedOnly = trackedIds.filter(id => id !== fallbackOwnId);

  return {
    ownScholarId: fallbackOwnId,
    trackedScholarIds: trackedOnly,
    scholarIds: normalizeScholarIds([fallbackOwnId, ...trackedOnly])
  };
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function decodeHtml(value) {
  return decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function getHtmlAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tag || '').match(new RegExp(
    `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i'
  ));
  return match ? decodeHtmlEntities(match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function toScholarUrl(value) {
  if (!value || /^javascript:/i.test(value)) {
    return null;
  }

  try {
    return new URL(value, 'https://scholar.google.com').toString();
  } catch (_error) {
    return null;
  }
}

function getLinkUrl(tag) {
  return toScholarUrl(getHtmlAttribute(tag, 'data-href') || getHtmlAttribute(tag, 'href'));
}

function parseCitationCount(html) {
  return parseScholarMetric(html, 'Citations') || parseFirstScholarMetric(html);
}

function parseCountNumber(count) {
  const parsed = Number.parseInt(String(count ?? '').replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseScholarName(html) {
  const match = html.match(/<div[^>]*id="gsc_prf_in"[^>]*>([\s\S]*?)<\/div>/i);
  return match ? decodeHtml(match[1]) : null;
}

function parseScholarMetric(html, label) {
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    if (cells.length < 2 || decodeHtml(cells[0]).toLowerCase() !== label.toLowerCase()) {
      continue;
    }

    const value = decodeHtml(cells[1]);
    return value || null;
  }

  return null;
}

function parseFirstScholarMetric(html) {
  const match = html.match(/<td[^>]*class="[^"]*\bgsc_rsb_std\b[^"]*"[^>]*>([\d,]+)<\/td>/i);
  return match && match[1] ? match[1].trim() : null;
}

function getArticleId(profileId, articleUrl, title, year) {
  if (articleUrl) {
    try {
      const citationId = new URL(articleUrl).searchParams.get('citation_for_view');
      if (citationId) {
        return citationId;
      }
    } catch (_error) {
      // A deterministic metadata fallback is used below.
    }
  }

  return `${profileId}:${String(title || '').toLowerCase()}|${year || ''}`;
}

function parseScholarArticles(html, profileId) {
  const rows = String(html || '').match(/<tr[^>]*class="[^"]*\bgsc_a_tr\b[^"]*"[^>]*>[\s\S]*?<\/tr>/gi) || [];

  return rows.map(row => {
    const titleMatch = row.match(/(<a[^>]*class="[^"]*\bgsc_a_at\b[^"]*"[^>]*>)([\s\S]*?)<\/a>/i);
    if (!titleMatch) {
      return null;
    }

    const grayMatches = [...row.matchAll(/<div[^>]*class="[^"]*\bgs_gray\b[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
    const citationMatch = row.match(/(<a[^>]*class="[^"]*\bgsc_a_ac\b[^"]*"[^>]*>)([\s\S]*?)<\/a>/i);
    const yearMatch = row.match(/<td[^>]*class="[^"]*\bgsc_a_y\b[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    const title = decodeHtml(titleMatch[2]);
    const articleUrl = getLinkUrl(titleMatch[1]);
    const citations = parseCountNumber(citationMatch ? decodeHtml(citationMatch[2]) : 0) ?? 0;
    const year = yearMatch ? decodeHtml(yearMatch[1]) : '';

    return {
      id: getArticleId(profileId, articleUrl, title, year),
      title,
      authors: grayMatches[0] ? decodeHtml(grayMatches[0][1]) : '',
      publication: grayMatches[1] ? decodeHtml(grayMatches[1][1]) : '',
      year,
      citations,
      articleUrl,
      citationsUrl: citationMatch ? getLinkUrl(citationMatch[1]) : null
    };
  }).filter(article => article && article.title);
}

function hasMoreScholarArticles(html, articleCount) {
  const button = String(html || '').match(/<button[^>]*id="gsc_bpf_more"[^>]*>/i);

  if (button) {
    return !/\bdisabled(?:\s|=|>)/i.test(button[0]);
  }

  return articleCount >= 20;
}

function mergeArticles(primary, fallback = []) {
  const articles = new Map();

  fallback.forEach(article => articles.set(article.id, article));
  primary.forEach(article => articles.set(article.id, article));

  return [...articles.values()];
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBadgeCount(value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (value >= 10000000) {
    return `${Math.floor(value / 1000000)}m`;
  }

  if (value >= 100000) {
    return `${Math.floor(value / 10000)}w`;
  }

  if (value >= 10000) {
    const shortValue = Math.floor(value / 1000) / 10;
    return `${shortValue}w`;
  }

  return String(value);
}

function getCitationTierColor(value) {
  if (value === null || value === undefined) {
    return '#9aa3af';
  }

  if (value >= 100000) {
    return '#9f3a5a';
  }

  if (value >= 10000) {
    return '#b45309';
  }

  if (value >= 1000) {
    return '#b17614';
  }

  if (value >= 100) {
    return '#2d7f4f';
  }

  if (value >= 10) {
    return '#2f7d8c';
  }

  return '#8b95a1';
}

function formatDelta(delta) {
  if (delta === null || delta === undefined) {
    return 'no previous update';
  }

  return delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta);
}

async function fetchScholarPage(url, profileId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCHOLAR_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      redirect: 'manual',
      signal: controller.signal
    });

    if (response.type === 'opaqueredirect') {
      throw new Error('Google Scholar redirected this request to Google verification. Open the Scholar profile in a normal tab, complete the check, then refresh again.');
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Google Scholar rate-limited the request (HTTP 429). Wait a few minutes, then try again.');
      }

      if (response.status === 403) {
        throw new Error('Google Scholar blocked the request (HTTP 403). Open the Scholar profile in a normal tab and complete any verification first.');
      }

      throw new Error(`Google Scholar returned HTTP ${response.status} for ${profileId}.`);
    }

    const html = await response.text();
    if (/unusual traffic|not a robot|g-recaptcha|\/sorry\/index/i.test(html)) {
      throw new Error('Google Scholar requested browser verification. Open the Scholar profile in a normal tab, complete the check, then refresh again.');
    }

    return html;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Google Scholar did not respond within 15 seconds. Check that scholar.google.com opens in Chrome, then try again.');
    }

    if (/Google Scholar/.test(error.message)) {
      throw error;
    }

    throw new Error(`Could not reach Google Scholar for ${profileId}: ${error.message || 'network request failed'}.`);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchScholarProfile(id) {
  const url = getScholarUrl(id);
  const summaryHtml = await fetchScholarPage(url, id);
  const count = parseCitationCount(summaryHtml);

  if (!count) {
    throw new Error(`Google Scholar loaded, but no citation count was found for ${id}. Confirm that the profile is public and the user ID is correct.`);
  }

  let pageArticles = parseScholarArticles(summaryHtml, id);
  let articles = pageArticles;
  let pagesFetched = 1;
  let articlesComplete = !hasMoreScholarArticles(summaryHtml, pageArticles.length);
  let articleFetchError = null;

  if (!articlesComplete) {
    try {
      const expandedHtml = await fetchScholarPage(getScholarPageUrl(id), id);
      pageArticles = parseScholarArticles(expandedHtml, id);
      articles = mergeArticles(pageArticles, articles);
      articlesComplete = pageArticles.length < SCHOLAR_PAGE_SIZE
        || !hasMoreScholarArticles(expandedHtml, pageArticles.length);
    } catch (error) {
      articleFetchError = `Citation totals were updated, but the full article list could not be loaded. ${error.message}`;
    }
  }

  while (!articlesComplete && !articleFetchError && pagesFetched < MAX_ARTICLE_PAGES) {
    const start = pagesFetched * SCHOLAR_PAGE_SIZE;

    try {
      const html = await fetchScholarPage(getScholarPageUrl(id, start), id);
      pageArticles = parseScholarArticles(html, id);
      articles = mergeArticles(pageArticles, articles);
      pagesFetched += 1;
      articlesComplete = pageArticles.length < SCHOLAR_PAGE_SIZE;
    } catch (error) {
      articleFetchError = error.message;
      break;
    }
  }

  if (!articlesComplete && !articleFetchError && pagesFetched === MAX_ARTICLE_PAGES) {
    articleFetchError = `Monitoring is limited to the first ${MAX_ARTICLE_PAGES * SCHOLAR_PAGE_SIZE} articles on this profile.`;
  }

  return {
    id,
    name: parseScholarName(summaryHtml) || id,
    url,
    citations: count,
    citationsNumber: parseCountNumber(count),
    hIndex: parseScholarMetric(summaryHtml, 'h-index') || 'N/A',
    i10Index: parseScholarMetric(summaryHtml, 'i10-index') || 'N/A',
    articles,
    articleCount: articles.length,
    articlePagesFetched: pagesFetched,
    articlesComplete,
    articleFetchError,
    fetchSucceeded: true
  };
}

function createArticleSnapshotDiff(previousSnapshots = {}, profiles, detectedAt) {
  const nextSnapshots = {};
  const changes = [];
  const statsByProfile = {};
  let baselineProfileCount = 0;

  profiles.forEach(profile => {
    const previousSnapshot = previousSnapshots[profile.id];
    const previousArticles = previousSnapshot && Array.isArray(previousSnapshot.articles)
      ? previousSnapshot.articles
      : [];
    const fetchedArticles = Array.isArray(profile.articles) ? profile.articles : [];
    const actualFetchedIds = new Set(fetchedArticles.map(article => article.id));
    const snapshotArticles = profile.fetchSucceeded === false
      ? previousArticles
      : profile.articlesComplete
        ? fetchedArticles
        : mergeArticles(fetchedArticles, previousArticles);
    const previousById = new Map(previousArticles.map(article => [article.id, article]));
    let changedArticles = 0;
    let citationGain = 0;

    if (previousSnapshot) {
      baselineProfileCount += 1;

      fetchedArticles.forEach(article => {
        if (!actualFetchedIds.has(article.id)) {
          return;
        }

        const previous = previousById.get(article.id);
        if (!previous || !Number.isFinite(previous.citations) || article.citations <= previous.citations) {
          return;
        }

        const delta = article.citations - previous.citations;
        changedArticles += 1;
        citationGain += delta;
        changes.push({
          id: `${detectedAt}|${profile.id}|${article.id}`,
          detectedAt,
          profileId: profile.id,
          profileName: profile.name || profile.id,
          isOwn: Boolean(profile.isOwn),
          articleId: article.id,
          title: article.title,
          authors: article.authors,
          publication: article.publication,
          year: article.year,
          articleUrl: article.articleUrl,
          citationsUrl: article.citationsUrl,
          previousCitations: previous.citations,
          currentCitations: article.citations,
          delta
        });
      });
    }

    nextSnapshots[profile.id] = {
      profileId: profile.id,
      profileName: profile.name || profile.id,
      capturedAt: detectedAt,
      articles: snapshotArticles
    };
    statsByProfile[profile.id] = {
      trackedArticles: snapshotArticles.length,
      changedArticles,
      citationGain
    };
  });

  changes.sort((a, b) => b.delta - a.delta || a.title.localeCompare(b.title));

  return {
    nextSnapshots,
    changes,
    statsByProfile,
    baselineProfileCount
  };
}

function pruneArticleEvents(events, activeProfileIds, now = Date.now()) {
  const oldestAllowed = now - ARTICLE_EVENT_RETENTION_MS;
  const seen = new Set();

  return events
    .filter(event => activeProfileIds.has(event.profileId))
    .filter(event => {
      const timestamp = new Date(event.detectedAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= oldestAllowed;
    })
    .filter(event => {
      if (!event.id || seen.has(event.id)) {
        return false;
      }
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt) || b.delta - a.delta)
    .slice(0, MAX_ARTICLE_EVENTS);
}

async function setBadgeForTotal(total) {
  chrome.action.setBadgeBackgroundColor({ color: getCitationTierColor(total) });
  chrome.action.setBadgeTextColor({ color: '#ffffff' });
  chrome.action.setBadgeText({ text: formatBadgeCount(total) });
}

function setActionTitle(total, delta, monitorSummary) {
  const articleSummary = monitorSummary.changedArticles > 0
    ? `; ${monitorSummary.changedArticles} articles gained ${formatDelta(monitorSummary.citationGain)}`
    : '';

  chrome.action.setTitle({
    title: `Citation Tracker: ${formatNumber(total)} own citations (${formatDelta(delta)} total change${articleSummary})`
  });
}

async function performCitationUpdate() {
  const attemptedAt = new Date().toISOString();

  try {
    const config = await getStoredScholarConfig();
    const ids = config.scholarIds;
    const previousState = await getFromStorage([
      'citationTotal',
      'ownCitationTotal',
      'citationProfiles',
      'articleSnapshots',
      'articleCitationEvents'
    ]);
    const previousProfiles = previousState.citationProfiles || [];
    const previousSnapshots = previousState.articleSnapshots || {};
    const previousEvents = previousState.articleCitationEvents || [];
    const previousProfileMap = new Map(previousProfiles.map(profile => [profile.id, profile]));
    const results = await Promise.allSettled(ids.map(fetchScholarProfile));
    const profiles = results.map((result, index) => {
      const id = ids[index];

      if (result.status === 'fulfilled') {
        return {
          ...result.value,
          isOwn: id === config.ownScholarId
        };
      }

      console.warn(result.reason);
      const previousProfile = previousProfileMap.get(id);
      const previousArticles = previousSnapshots[id] && Array.isArray(previousSnapshots[id].articles)
        ? previousSnapshots[id].articles
        : [];

      return {
        ...(previousProfile || {
          id,
          name: id,
          url: getScholarUrl(id),
          citations: 'N/A',
          citationsNumber: null,
          hIndex: 'N/A',
          i10Index: 'N/A'
        }),
        isOwn: id === config.ownScholarId,
        articles: previousArticles,
        articleCount: previousArticles.length,
        articlesComplete: false,
        articleFetchError: result.reason.message,
        fetchSucceeded: false,
        error: result.reason.message
      };
    });

    const numericCounts = profiles
      .map(profile => profile.citationsNumber)
      .filter(count => Number.isFinite(count));

    if (!numericCounts.length) {
      const failureReason = profiles
        .map(profile => profile.error || profile.articleFetchError)
        .find(Boolean);
      chrome.action.setBadgeText({ text: 'N/A' });
      await setStorage({
        citationProfiles: profiles.map(({ articles, ...profile }) => profile),
        scholarIds: ids,
        ownScholarId: config.ownScholarId,
        trackedScholarIds: config.trackedScholarIds,
        lastAttemptedAt: attemptedAt,
        lastUpdateError: failureReason || 'Google Scholar data could not be refreshed. Previous citation data was preserved.'
      });
      return false;
    }

    const total = numericCounts.reduce((sum, count) => sum + count, 0);
    const ownProfile = profiles.find(profile => profile.id === config.ownScholarId);
    const badgeTotal = ownProfile && Number.isFinite(ownProfile.citationsNumber)
      ? ownProfile.citationsNumber
      : total;
    const previousTotalNumber = Number.isFinite(previousState.citationTotal)
      ? previousState.citationTotal
      : null;
    const previousOwnTotalNumber = Number.isFinite(previousState.ownCitationTotal)
      ? previousState.ownCitationTotal
      : null;
    const delta = previousTotalNumber === null ? null : total - previousTotalNumber;
    const ownDelta = previousOwnTotalNumber === null ? null : badgeTotal - previousOwnTotalNumber;
    const diff = createArticleSnapshotDiff(previousSnapshots, profiles, attemptedAt);
    const activeProfileIds = new Set(ids);
    const articleCitationEvents = pruneArticleEvents(
      [...diff.changes, ...previousEvents],
      activeProfileIds,
      new Date(attemptedAt).getTime()
    );
    const monitorSummary = {
      trackedArticles: Object.values(diff.nextSnapshots)
        .reduce((sum, snapshot) => sum + snapshot.articles.length, 0),
      changedArticles: diff.changes.length,
      citationGain: diff.changes.reduce((sum, event) => sum + event.delta, 0),
      baselineReady: diff.baselineProfileCount > 0,
      historyEvents: articleCitationEvents.length,
      partialProfiles: profiles.filter(profile => !profile.articlesComplete).length,
      lastChangeAt: articleCitationEvents[0] ? articleCitationEvents[0].detectedAt : null
    };
    const storedProfiles = profiles.map(profile => {
      const stats = diff.statsByProfile[profile.id] || {};
      const { articles, fetchSucceeded, ...storedProfile } = profile;
      return {
        ...storedProfile,
        trackedArticles: stats.trackedArticles || 0,
        changedArticles: stats.changedArticles || 0,
        articleCitationGain: stats.citationGain || 0
      };
    });

    await setBadgeForTotal(badgeTotal);
    setActionTitle(badgeTotal, ownDelta, monitorSummary);
    await setStorage({
      citations: formatNumber(total),
      citationTotal: total,
      ownCitations: formatNumber(badgeTotal),
      ownCitationTotal: badgeTotal,
      ownCitationDelta: ownDelta,
      citationDelta: delta,
      previousCitationTotal: previousTotalNumber,
      citationProfiles: storedProfiles,
      articleSnapshots: diff.nextSnapshots,
      articleCitationEvents,
      latestArticleChanges: diff.changes,
      articleMonitorSummary: monitorSummary,
      scholarIds: ids,
      ownScholarId: config.ownScholarId,
      trackedScholarIds: config.trackedScholarIds,
      lastUpdated: attemptedAt,
      lastAttemptedAt: attemptedAt,
      lastUpdateError: null
    });
    console.log('Citation data updated:', total, monitorSummary);
    return true;
  } catch (error) {
    console.error('Failed to update citation data:', error);
    chrome.action.setBadgeText({ text: 'ERR' });
    await setStorage({
      lastAttemptedAt: attemptedAt,
      lastUpdateError: error.message
    });
    return false;
  }
}

function updateCitations() {
  if (updateInFlight) {
    return updateInFlight;
  }

  updateInFlight = performCitationUpdate()
    .finally(() => {
      updateInFlight = null;
    });

  return updateInFlight;
}

async function delayedUpdateWithRetry() {
  await new Promise(resolve => setTimeout(resolve, 5000));
  let success = await updateCitations();

  if (!success) {
    await new Promise(resolve => setTimeout(resolve, 15000));
    success = await updateCitations();
  }

  return success;
}

async function getUpdateResponse(success) {
  if (success) {
    return { ok: true };
  }

  const { lastUpdateError } = await getFromStorage(['lastUpdateError']);
  return {
    ok: false,
    error: lastUpdateError || 'Google Scholar could not be refreshed. Previous data was preserved.'
  };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 30 });
  getStoredScholarConfig().then(config => setStorage(config));
  delayedUpdateWithRetry();
});

chrome.runtime.onStartup.addListener(() => {
  delayedUpdateWithRetry();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === UPDATE_ALARM) {
    updateCitations();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'getState') {
    getFromStorage([
      'scholarIds',
      'ownScholarId',
      'trackedScholarIds',
      'citations',
      'citationTotal',
      'ownCitations',
      'ownCitationTotal',
      'ownCitationDelta',
      'citationDelta',
      'previousCitationTotal',
      'citationProfiles',
      'articleSnapshots',
      'articleCitationEvents',
      'latestArticleChanges',
      'articleMonitorSummary',
      'lastUpdated',
      'lastAttemptedAt',
      'lastUpdateError'
    ])
      .then(async state => {
        const config = await getStoredScholarConfig();
        sendResponse({
          ...state,
          ...config
        });
      });
    return true;
  }

  if (message.type === 'saveScholarConfig' || message.type === 'saveScholarIds') {
    const legacyIds = normalizeScholarIds(message.ids);
    const ownIds = normalizeScholarIds(message.ownScholarId || legacyIds[0]);
    const trackedIds = normalizeScholarIds(message.trackedScholarIds || legacyIds.slice(1));

    if (!ownIds.length) {
      sendResponse({ ok: false, error: 'Please enter your Google Scholar user id.' });
      return false;
    }

    const ownScholarId = ownIds[0];
    const trackedScholarIds = trackedIds.filter(id => id !== ownScholarId);
    const scholarIds = normalizeScholarIds([ownScholarId, ...trackedScholarIds]);

    setStorage({
      ownScholarId,
      trackedScholarIds,
      scholarIds,
      citationTotal: null,
      citationDelta: null,
      previousCitationTotal: null,
      ownCitationTotal: null,
      ownCitationDelta: null
    })
      .then(updateCitations)
      .then(getUpdateResponse)
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'removeTrackedScholarId') {
    const idToRemove = normalizeScholarIds(message.id)[0];
    getStoredScholarConfig()
      .then(config => {
        const trackedScholarIds = config.trackedScholarIds.filter(id => id !== idToRemove);
        return setStorage({
          trackedScholarIds,
          scholarIds: normalizeScholarIds([config.ownScholarId, ...trackedScholarIds]),
          citationTotal: null,
          citationDelta: null,
          previousCitationTotal: null,
          ownCitationTotal: null,
          ownCitationDelta: null
        });
      })
      .then(updateCitations)
      .then(getUpdateResponse)
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'refreshCitations') {
    updateCitations()
      .then(getUpdateResponse)
      .then(sendResponse)
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
