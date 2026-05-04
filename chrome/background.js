const DEFAULT_SCHOLAR_IDS = ['DhtAFkwAAAAJ'];
const UPDATE_ALARM = 'periodicUpdate';

function getScholarUrl(id) {
  return `https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`;
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

async function getStoredScholarIds() {
  const { scholarIds, ownScholarId, trackedScholarIds } = await getFromStorage([
    'scholarIds',
    'ownScholarId',
    'trackedScholarIds'
  ]);
  const legacyIds = normalizeScholarIds(scholarIds);
  const ownIds = normalizeScholarIds(ownScholarId || legacyIds[0]);
  const trackedIds = normalizeScholarIds(trackedScholarIds && trackedScholarIds.length ? trackedScholarIds : legacyIds.slice(1));
  const ids = normalizeScholarIds([...ownIds, ...trackedIds]);
  return ids.length ? ids : DEFAULT_SCHOLAR_IDS;
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

function parseCitationCount(html) {
  return parseScholarMetric(html, 'Citations') || parseFirstScholarMetric(html);
}

function parseCountNumber(count) {
  const parsed = Number.parseInt(String(count).replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
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

    // Google Scholar puts the all-time value in the second cell; the third cell is the recent/Since year value.
    const value = decodeHtml(cells[1]);
    return value || null;
  }

  return null;
}

function parseFirstScholarMetric(html) {
  const match = html.match(/<td[^>]*class="[^"]*\bgsc_rsb_std\b[^"]*"[^>]*>([\d,]+)<\/td>/i);
  return match && match[1] ? match[1].trim() : null;
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

async function fetchProfileCitationCount(id) {
  const url = getScholarUrl(id);
  const response = await fetch(url);
  const text = await response.text();
  const count = parseCitationCount(text);

  if (!count) {
    throw new Error(`Could not find citation count for ${id}.`);
  }

  return {
    id,
    name: parseScholarName(text) || id,
    url,
    citations: count,
    citationsNumber: parseCountNumber(count),
    hIndex: parseScholarMetric(text, 'h-index') || 'N/A',
    i10Index: parseScholarMetric(text, 'i10-index') || 'N/A'
  };
}

async function setBadgeForTotal(total) {
  chrome.action.setBadgeBackgroundColor({ color: getCitationTierColor(total) });
  chrome.action.setBadgeTextColor({ color: '#ffffff' });
  chrome.action.setBadgeText({ text: formatBadgeCount(total) });
}

function setActionTitle(total, delta) {
  chrome.action.setTitle({
    title: `Citation Tracker: ${formatNumber(total)} own citations (${formatDelta(delta)} total change)`
  });
}

// Fetch and parse citation counts, then update badge and storage.
async function updateCitations() {
  try {
    const config = await getStoredScholarConfig();
    const ids = config.scholarIds;
    const { citationTotal: previousTotal, ownCitationTotal: previousOwnTotal, citationProfiles: previousProfiles = [] } = await getFromStorage([
      'citationTotal',
      'ownCitationTotal',
      'citationProfiles'
    ]);
    const prevProfileMap = new Map(previousProfiles.map(p => [p.id, p]));
    const results = await Promise.allSettled(ids.map(fetchProfileCitationCount));
    const profiles = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      console.warn(result.reason);
      const prev = prevProfileMap.get(ids[index]);
      if (prev && prev.citationsNumber !== null) {
        return { ...prev, error: result.reason.message };
      }
      return {
        id: ids[index],
        name: ids[index],
        url: getScholarUrl(ids[index]),
        citations: 'N/A',
        citationsNumber: null,
        hIndex: 'N/A',
        i10Index: 'N/A',
        error: result.reason.message
      };
    });

    const numericCounts = profiles
      .map(profile => profile.citationsNumber)
      .filter(count => count !== null);

    if (!numericCounts.length) {
      console.warn('Could not find citation count on Google Scholar page. Page structure might have changed or data not available.');
      if (previousTotal !== null && previousTotal !== undefined) {
        console.log('Preserving previous data due to network failure.');
        return false;
      }
      chrome.action.setBadgeText({ text: 'N/A' });
      await setStorage({
        citations: 'N/A',
        citationTotal: null,
        citationProfiles: profiles,
        scholarIds: ids,
        ownScholarId: config.ownScholarId,
        trackedScholarIds: config.trackedScholarIds,
        lastUpdated: new Date().toISOString()
      });
      return false;
    }

    const total = numericCounts.reduce((sum, count) => sum + count, 0);
    const ownProfile = profiles.find(profile => profile.id === config.ownScholarId);
    const badgeTotal = ownProfile && ownProfile.citationsNumber !== null ? ownProfile.citationsNumber : total;
    const previousTotalNumber = Number.isFinite(previousTotal) ? previousTotal : null;
    const previousOwnTotalNumber = Number.isFinite(previousOwnTotal) ? previousOwnTotal : null;
    const delta = previousTotalNumber === null ? null : total - previousTotalNumber;
    const ownDelta = previousOwnTotalNumber === null ? null : badgeTotal - previousOwnTotalNumber;
    await setBadgeForTotal(badgeTotal);
    setActionTitle(badgeTotal, ownDelta);
    await setStorage({
      citations: formatNumber(total),
      citationTotal: total,
      ownCitations: formatNumber(badgeTotal),
      ownCitationTotal: badgeTotal,
      ownCitationDelta: ownDelta,
      citationDelta: delta,
      previousCitationTotal: previousTotalNumber,
      citationProfiles: profiles,
      scholarIds: ids,
      ownScholarId: config.ownScholarId,
      trackedScholarIds: config.trackedScholarIds,
      lastUpdated: new Date().toISOString()
    });
    console.log('Citation count updated:', total, profiles);
    return true; // 表示更新成功
  } catch (error) {
    console.error('Failed to update citation count:', error);
    chrome.action.setBadgeText({ text: 'ERR' });
    await setStorage({
      citations: 'ERR',
      lastUpdated: new Date().toISOString()
    });
    return false; // 表示更新失败
  }
}

// ---- 新增：延迟启动更新函数 ----
async function delayedUpdateWithRetry() {
  // 首次启动时延迟 5 秒
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log("Attempting initial citation update after delay...");

  let success = await updateCitations();

  // 如果第一次失败，在 15 秒后重试一次
  if (!success) {
    console.warn("Initial update failed, retrying in 15 seconds...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    await updateCitations(); // 再次尝试更新
  }
}

// ---- 现有逻辑调整 ----

// 初始化：创建 30 分钟间隔闹钟，并执行延迟的首次抓取
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 30 });
  getStoredScholarConfig().then(config => setStorage(config));
  delayedUpdateWithRetry(); // 首次安装或更新时使用延迟和重试
});

// 监听浏览器启动事件
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, initiating delayed update.");
  delayedUpdateWithRetry(); // 浏览器启动时也使用延迟和重试
});

// 监听闹钟触发更新
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) {
    console.log("Periodic update triggered by alarm.");
    updateCitations(); // 周期性更新不需要延迟和重试，直接执行
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
      'lastUpdated'
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
      .then(success => sendResponse({ ok: success }))
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
      .then(success => sendResponse({ ok: success }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'refreshCitations') {
    updateCitations()
      .then(success => sendResponse({ ok: success }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

// 可选：添加网络状态监听，确保有网络连接时才尝试更新
// 注意：这个API在Service Worker中可能受限，但可以作为额外考虑
/*
chrome.system.network.getNetworkInterfaces(interfaces => {
  if (interfaces.length > 0) {
    console.log("Network detected, proceeding with updates.");
    // 可以在这里触发 updateCitations()
  } else {
    console.log("No network detected yet.");
  }
});
*/
