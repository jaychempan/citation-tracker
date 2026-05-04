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
const profiles = document.getElementById('profiles');
const statusText = document.getElementById('status');

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function getResponseError(response, fallback) {
  if (!response) {
    return 'No response from background service worker. Reload the extension and try again.';
  }

  return response.error || fallback;
}

function getScholarUrl(id) {
  return `https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`;
}

function formatDate(value) {
  if (!value) {
    return 'Not updated yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function setBusy(isBusy) {
  saveButton.disabled = isBusy;
  refreshButton.disabled = isBusy;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle('error', isError);
}

function setInputOpen(isOpen) {
  inputPanel.hidden = !isOpen;
  toggleInputButton.setAttribute('aria-expanded', String(isOpen));
  toggleInputButton.textContent = isOpen ? '×' : '+';

  if (isOpen) {
    idsInput.focus();
  }
}

function formatDelta(value) {
  if (value === null || value === undefined) {
    return '--';
  }

  if (value >= 0) {
    return `+${new Intl.NumberFormat().format(value)}`;
  }

  return new Intl.NumberFormat().format(value);
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

function renderProfiles(items = []) {
  profiles.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No profiles yet';
    profiles.append(empty);
    return;
  }

  items.forEach(item => {
    const profileUrl = item.url || getScholarUrl(item.id);
    const card = document.createElement('article');
    card.className = `profile-card ${item.isOwn ? 'own-card' : ''} ${getCitationTierClass(item.citations)}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    card.addEventListener('click', () => {
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.open(profileUrl, '_blank', 'noopener,noreferrer');
      }
    });

    const top = document.createElement('div');
    top.className = 'profile-top';

    const identity = document.createElement('div');

    const name = document.createElement('span');
    name.className = 'profile-name';
    name.textContent = item.name || item.id;

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
      remove.title = 'Remove';
      remove.textContent = '×';
      remove.addEventListener('click', event => {
        event.stopPropagation();
        removeTrackedId(item.id);
      });
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

    card.append(top, stats);
    profiles.append(card);
  });
}

function renderState(state) {
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
  renderProfiles(orderedProfiles);
}

async function loadState() {
  setStatus('');
  const state = await sendMessage({ type: 'getState' });
  renderState(state);
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
      setStatus(getResponseError(response, 'Update failed.'), true);
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
      setStatus(getResponseError(response, 'Remove failed.'), true);
      return;
    }

    await loadState();
    setStatus('Removed.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function refreshCitations() {
  setBusy(true);
  setStatus('Refreshing...');

  try {
    const response = await sendMessage({ type: 'refreshCitations' });
    if (!response || !response.ok) {
      setStatus(getResponseError(response, 'Refresh failed.'), true);
      return;
    }

    await loadState();
    setStatus('Refreshed.');
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
document.addEventListener('DOMContentLoaded', loadState);
