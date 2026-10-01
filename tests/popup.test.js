const assert = require('node:assert/strict');
const test = require('node:test');
const { loadPopup } = require('./helpers/popup-harness');

test('opens in Chinese for a Chinese browser, including charts, dates and accessible labels', async () => {
  const { document } = await loadPopup({ browserLanguage: 'zh-CN' });
  assert.equal(document.documentElement.lang, 'zh-CN');
  assert.match(document.body.textContent, /Citation Tracker/);
  assert.match(document.getElementById('profiles').textContent, /h-index.*i10-index/);
  assert.match(document.getElementById('profiles').textContent, /我的主页/);
  const totalChangeLabel = document.querySelectorAll('[data-i18n-title]')
    .find(element => element.getAttribute('data-i18n-title') === 'allProfilesDeltaHint');
  assert.equal(totalChangeLabel.textContent, '本次被引变化');
  assert.match(totalChangeLabel.getAttribute('title'), /所有已添加学者.*上次成功刷新/);
  assert.equal(document.getElementById('languageButton').textContent, 'EN');
  assert.equal(document.getElementById('refreshButton').getAttribute('aria-label'), '刷新被引数据');
  assert.match(document.getElementById('summary').textContent, /更新于.*月.*日/);
  assert.match(document.getElementById('insights').textContent, /年度被引次数.*影响力雷达图/);
  assert.match(document.getElementById('activityCaption').textContent, /3 篇论文的被引次数增加，合计新增 7 次/);
  assert.match(document.getElementById('papers').textContent, /Deep residual learning for image recognition/);
});

test('switches all popup views and preserves draft IDs, filters, sorting, pagination and active view', async () => {
  const { document, storage, messages } = await loadPopup({ mode: 'many' });
  const get = id => document.getElementById(id);
  get('ownScholarId').value = 'unsaved-own';
  get('scholarIds').value = 'unsaved-other';
  await get('papersTab').dispatch('click');
  await get('loadMorePapers').dispatch('click');
  assert.match(get('papersCaption').textContent, /Showing 25 of 25/);
  get('profileFilter').value = 'abc123AAAAAJ';
  get('paperProfileFilter').value = 'DhtAFkwAAAAJ';
  get('insightsProfileFilter').value = 'abc123AAAAAJ';
  get('paperSearch').value = 'study';
  get('paperSort').value = 'year';
  await get('languageButton').dispatch('click');
  assert.equal(document.documentElement.lang, 'zh-CN');
  assert.equal(storage.uiLanguage, 'zh-CN');
  assert.equal(get('ownScholarId').value, 'unsaved-own');
  assert.equal(get('scholarIds').value, 'unsaved-other');
  assert.equal(get('profileFilter').value, 'abc123AAAAAJ');
  assert.equal(get('paperProfileFilter').value, 'DhtAFkwAAAAJ');
  assert.equal(get('insightsProfileFilter').value, 'abc123AAAAAJ');
  assert.equal(get('paperSearch').value, 'study');
  assert.equal(get('paperSort').value, 'year');
  assert.equal(get('papersView').hidden, false);
  assert.equal(get('papersTab').getAttribute('aria-selected'), 'true');
  assert.match(get('papersCaption').textContent, /已显示 18 \/ 18 篇论文/);
  assert.match(get('activityCaption').textContent, /1 篇论文的被引次数增加，合计新增 2 次/);
  assert.match(get('insights').textContent, /同比/);
  assert.equal(messages.length, 1, 'A language switch must not refresh or save Scholar configuration');
  await get('languageButton').dispatch('click');
  assert.equal(storage.uiLanguage, 'en');
  assert.match(get('papersCaption').textContent, /Showing 18 of 18/);
});

test('restores the selected language when the popup is reopened', async () => {
  const storage = {};
  const first = await loadPopup({ storage });
  await first.document.getElementById('languageButton').dispatch('click');
  const second = await loadPopup({ storage, browserLanguage: 'en-US' });
  assert.equal(second.document.documentElement.lang, 'zh-CN');
  storage.uiLanguage = 'en';
  const third = await loadPopup({ storage, browserLanguage: 'zh-CN' });
  assert.equal(third.document.documentElement.lang, 'en');
});

test('localizes baseline, empty, error, and status messages when switching languages', async () => {
  for (const [mode, expected] of [['baseline', '首次同步完成'], ['empty', '暂无被引增长记录'], ['error', '无法获取 Google Scholar 数据']]) {
    const { document } = await loadPopup({ mode });
    await document.getElementById('languageButton').dispatch('click');
    assert.match(document.getElementById('activity').textContent, new RegExp(expected));
    if (mode === 'error') {
      assert.match(document.getElementById('activity').textContent, /完成验证后再刷新/);
      assert.equal(document.getElementById('status').textContent, '上次刷新失败');
    }
  }
});

test('reports a failed preference save and leaves the active language unchanged', async () => {
  const { document, storage } = await loadPopup({ storageWriteFails: true });
  await document.getElementById('languageButton').dispatch('click');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(storage.uiLanguage, undefined);
  assert.equal(document.getElementById('languageButton').disabled, false);
  assert.match(document.getElementById('status').textContent, /Could not save language preference/);
});

test('can change languages after saved data fails to load', async () => {
  const { document } = await loadPopup({ stateReadFails: true });
  assert.match(document.getElementById('profiles').textContent, /Unable to load profiles/);
  await document.getElementById('languageButton').dispatch('click');
  assert.match(document.getElementById('profiles').textContent, /无法加载学者数据/);
  assert.match(document.getElementById('papers').textContent, /无法加载已保存的论文/);
  assert.match(document.getElementById('activity').textContent, /无法加载已保存的数据/);
  assert.match(document.getElementById('insights').textContent, /无法加载已保存的数据/);
});

test('defaults to Forest and restores a saved theme independently of language', async () => {
  for (const [uiTheme, expected] of [[undefined, 'forest'], ['unknown', 'forest'], ['graphite', 'graphite']]) {
    const { document } = await loadPopup({ storage: { uiTheme, uiLanguage: 'zh-CN' } });
    assert.equal(document.documentElement.getAttribute('data-theme'), expected);
    assert.equal(document.getElementById('themeSelect').value, expected);
    assert.equal(document.documentElement.lang, 'zh-CN');
    assert.match(document.getElementById('themeSelect').textContent, /松绿.*石墨/);
  }
});

test('switches and saves a theme without losing drafts, filters, pagination or the active view', async () => {
  const { document, storage, messages } = await loadPopup({ mode: 'many', storage: { uiLanguage: 'zh-CN' } });
  const get = id => document.getElementById(id);
  get('ownScholarId').value = 'unsaved-own';
  get('scholarIds').value = 'unsaved-other';
  await get('papersTab').dispatch('click');
  await get('loadMorePapers').dispatch('click');
  get('paperSearch').value = 'study';
  get('paperSort').value = 'year';
  get('paperProfileFilter').value = 'DhtAFkwAAAAJ';
  const caption = get('papersCaption').textContent;
  get('themeSelect').value = 'graphite';
  await get('themeSelect').dispatch('change');
  assert.equal(storage.uiTheme, 'graphite');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'graphite');
  assert.equal(document.documentElement.lang, 'zh-CN');
  assert.equal(get('ownScholarId').value, 'unsaved-own');
  assert.equal(get('scholarIds').value, 'unsaved-other');
  assert.equal(get('paperSearch').value, 'study');
  assert.equal(get('paperSort').value, 'year');
  assert.equal(get('paperProfileFilter').value, 'DhtAFkwAAAAJ');
  assert.equal(get('papersView').hidden, false);
  assert.equal(get('papersCaption').textContent, caption);
  assert.equal(get('themeSelect').disabled, false);
  assert.equal(messages.length, 1);
  const reopened = await loadPopup({ storage });
  assert.equal(reopened.document.documentElement.getAttribute('data-theme'), 'graphite');
});

test('rolls back a failed theme save and reports the failure in the current language', async () => {
  const { document, storage } = await loadPopup({ storageWriteFails: true, storage: { uiLanguage: 'zh-CN' } });
  const picker = document.getElementById('themeSelect');
  picker.value = 'graphite';
  await picker.dispatch('change');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'forest');
  assert.equal(picker.value, 'forest');
  assert.equal(picker.disabled, false);
  assert.equal(storage.uiTheme, undefined);
  assert.equal(document.getElementById('status').textContent, '无法保存外观主题，请重试。');
});

test('follows external theme preference changes even if scholar data fails to load', async () => {
  const { document, context, messages } = await loadPopup({ stateReadFails: true });
  await context.chrome.storage.local.set({ uiTheme: 'graphite' });
  assert.equal(document.documentElement.getAttribute('data-theme'), 'graphite');
  assert.equal(document.getElementById('themeSelect').value, 'graphite');
  assert.match(document.getElementById('profiles').textContent, /Unable to load profiles/);
  assert.equal(messages.length, 1);
});
