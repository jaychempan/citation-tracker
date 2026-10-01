const assert = require('node:assert/strict');
const test = require('node:test');
const { loadPopup } = require('./helpers/popup-harness');

function findElements(root, predicate) {
  if (!root || typeof root === 'string') return [];
  return [...(predicate(root) ? [root] : []), ...root.children.flatMap(child => findElements(child, predicate))];
}
function byClass(root, className) {
  return findElements(root, element => element.className.split(/\s+/).includes(className));
}

test('annual chart compares completed years and marks the current year in both languages', async () => {
  for (const [browserLanguage, expected] of [['zh-CN', '2025 年同比 +1%'], ['en', '2025: +1% YoY']]) {
    const { document, context, state } = await loadPopup({ browserLanguage });
    const insights = document.getElementById('insights');
    const delta = byClass(insights, 'insight-delta')[0];
    assert.equal(delta.textContent, expected);
    assert.match(delta.title, /2024.*130,311.*2025.*131,936/);
    const partial = byClass(insights, 'partial-year');
    assert.equal(partial.length, 1);
    assert.equal(partial[0].children.at(-1).textContent, '2026*');
    const bar = findElements(partial[0], element => element.tagName === 'i')[0];
    assert.match(bar.title, browserLanguage === 'zh-CN' ? /截至目前/ : /year to date/);
    assert.equal(bar.getAttribute('aria-label'), bar.title);
    const profile = state.citationProfiles[0];
    const annual = context.getAnnualCitationData(profile, state);
    const signals = context.getRadarSignals(profile, state, annual);
    assert.ok(signals.momentum > 65, 'Completed years grew, even though the partial current-year total is lower');
    profile.citationHistory.at(-1).citations = 1;
    assert.equal(context.getRadarSignals(profile, state, context.getAnnualCitationData(profile, state)).momentum, signals.momentum);
  }
});

test('does not calculate YoY or momentum across missing years or a zero denominator', async () => {
  const { document, context, state } = await loadPopup();
  const profile = state.citationProfiles[0];
  for (const history of [
    [{ year: 2023, citations: 100 }, { year: 2025, citations: 200 }, { year: 2026, citations: 10 }],
    [{ year: 2024, citations: 0 }, { year: 2025, citations: 20 }],
    [{ year: 2026, citations: 20 }],
    []
  ]) {
    profile.citationHistory = history;
    const annual = context.getAnnualCitationData(profile, state);
    assert.equal(annual.comparison, null);
    assert.equal(context.getRadarSignals(profile, state, annual).momentum, null);
    context.renderState(state);
    const insights = document.getElementById('insights');
    assert.equal(byClass(insights, 'insight-delta').length, 0);
    assert.match(byClass(insights, 'radar-help')[0].textContent, /Two consecutive completed years/);
    for (const shape of findElements(insights, element => element.tagName === 'polygon')) {
      assert.doesNotMatch(shape.getAttribute('points'), /NaN|Infinity|undefined/);
    }
  }
});

test('shows a genuine full-year decline including a zero total', async () => {
  const { document, context, state } = await loadPopup({ browserLanguage: 'zh-CN' });
  const profile = state.citationProfiles[0];
  profile.citationHistory = [{ year: 2024, citations: 100 }, { year: 2025, citations: 0 }, { year: 2026, citations: 40 }];
  context.renderState(state);
  const delta = byClass(document.getElementById('insights'), 'insight-delta')[0];
  assert.equal(delta.textContent, '2025 年同比 -100%');
  assert.match(delta.className, /loss/);
  assert.equal(context.getRadarSignals(profile, state, context.getAnnualCitationData(profile, state)).momentum, 0);
});

test('keeps a cached partial year out of comparisons after New Year until that profile refreshes', async () => {
  const { document, context, state } = await loadPopup({ browserLanguage: 'zh-CN', now: '2027-01-02T12:00:00.000Z' });
  // Another profile may have refreshed without updating this profile's annual data.
  state.lastUpdated = '2027-01-02T10:00:00.000Z';
  context.renderState(state);
  let insights = document.getElementById('insights');
  assert.equal(byClass(insights, 'insight-delta')[0].textContent, '2025 年同比 +1%');
  assert.match(byClass(insights, 'annual-note')[0].textContent, /2026 年（截至上次同步）/);
  const profile = state.citationProfiles[0];
  profile.citationHistoryUpdatedAt = state.lastUpdated;
  profile.citationHistory.at(-1).citations = 140000;
  context.renderState(state);
  insights = document.getElementById('insights');
  assert.equal(byClass(insights, 'insight-delta')[0].textContent, '2026 年同比 +6%');
  assert.equal(byClass(insights, 'partial-year').length, 0);
});

test('explains the synced-paper denominator and preserves open help when switching languages', async () => {
  const { document, state, context } = await loadPopup();
  let help = byClass(document.getElementById('insights'), 'radar-help')[0];
  assert.equal(help.tagName, 'details');
  assert.equal(help.open, false);
  assert.equal(help.children[0].tagName, 'summary');
  help.open = true;
  await help.dispatch('toggle');
  await document.getElementById('languageButton').dispatch('click');
  help = byClass(document.getElementById('insights'), 'radar-help')[0];
  assert.equal(help.open, true);
  assert.match(help.textContent, /已同步的 4 篇论文中，4 篇至少被引 1 次/);
  assert.match(help.textContent, /比较 2024 和 2025 两个完整年度/);
  state.articleSnapshots = {};
  context.renderState(state);
  assert.match(byClass(document.getElementById('insights'), 'radar-help')[0].textContent, /尚未同步论文/);
});
