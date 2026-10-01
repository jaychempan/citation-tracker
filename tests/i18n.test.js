const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const i18nSource = fs.readFileSync(path.join(__dirname, '..', 'chrome', 'i18n.js'), 'utf8');
function loadI18n(browserLanguage = 'en-US') {
  const context = vm.createContext({ chrome: { i18n: { getUILanguage: () => browserLanguage } }, URL });
  vm.runInContext(i18nSource, context);
  return context.CitationI18n;
}

test('detects Chinese browser locales and falls back to English for other languages', () => {
  for (const language of ['zh', 'zh-CN', 'zh-TW', 'zh_HK', 'ZH-sg']) {
    assert.equal(loadI18n(language).getLanguage(), 'zh-CN');
  }
  for (const language of ['en', 'en-GB', 'fr', '', undefined]) {
    assert.equal(loadI18n(language).getLanguage(), 'en');
  }
  const i18n = loadI18n('zh-CN');
  i18n.setLanguage('en');
  assert.equal(i18n.t('save'), 'Save');
  assert.equal(i18n.getLocale(), 'en-US');
});

test('all popup translation keys and manifest locale references have both translations', () => {
  const { messages } = loadI18n();
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'chrome', 'popup.html'), 'utf8');
  const popupJs = fs.readFileSync(path.join(__dirname, '..', 'chrome', 'popup.js'), 'utf8');
  const keys = [
    ...Array.from(popupHtml.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g), match => match[1]),
    ...Array.from(popupJs.matchAll(/\bt\('([^']+)'/g), match => match[1])
  ];
  for (const key of keys) assert.ok(messages[key], `Missing popup message: ${key}`);
  for (const [key, translations] of Object.entries(messages)) {
    assert.equal(translations.length, 2, key);
    assert.ok(translations.every(value => typeof value === 'string' && value.trim()), key);
    const enTokens = new Set(Array.from(translations[0].matchAll(/\{(\w+)\}/g), match => match[1]));
    for (const match of translations[1].matchAll(/\{(\w+)\}/g)) {
      assert.ok(enTokens.has(match[1]), `Unexpected Chinese placeholder in ${key}: ${match[1]}`);
    }
  }
  const manifest = fs.readFileSync(path.join(__dirname, '..', 'chrome', 'manifest.json'), 'utf8');
  for (const locale of ['en', 'zh_CN']) {
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'chrome', '_locales', locale, 'messages.json'), 'utf8'));
    for (const match of manifest.matchAll(/__MSG_(\w+)__/g)) assert.ok(catalog[match[1]]?.message, locale);
  }
});

test('localizes saved Scholar errors, including nested partial-sync failures, without changing stored text', () => {
  const i18n = loadI18n('zh-CN');
  for (const key of ['verificationRedirect', 'rateLimited', 'blocked', 'browserVerification', 'timeout', 'dataRefreshFailed', 'updateFailed', 'enterId']) {
    const english = i18n.messages[key][0];
    assert.equal(i18n.translateError(english), i18n.t(key));
    i18n.setLanguage('en');
    assert.equal(i18n.translateError(english), english);
    i18n.setLanguage('zh-CN');
  }
  const nested = `Citation totals were updated, but the full article list could not be loaded. ${i18n.messages.rateLimited[0]}`;
  assert.equal(i18n.translateError(nested), i18n.t('partialFetchError', { detail: i18n.t('rateLimited') }));
  assert.equal(i18n.translateError('Google Scholar returned HTTP 503 for profile1.'), i18n.t('httpError', { status: 503, id: 'profile1' }));
  assert.equal(i18n.translateError('Could not reach Google Scholar for profile1: Failed to fetch.'), i18n.t('networkError', { id: 'profile1', detail: i18n.t('networkRequestFailed') }));
  assert.equal(i18n.translateError('Google Scholar loaded, but no citation count was found for profile1. Confirm that the profile is public and the user ID is correct.'), i18n.t('noCitationCount', { id: 'profile1' }));
  assert.equal(i18n.translateError('Monitoring is limited to the first 500 articles on this profile.'), i18n.t('articleLimit', { count: 500 }));
  assert.equal(i18n.translateError('Unknown technical detail'), 'Unknown technical detail');
});

test('localizes outgoing Scholar links while preserving search terms and citation IDs', () => {
  const i18n = loadI18n('zh-CN');
  const original = 'https://scholar.google.com/citations?user=profile1&citation_for_view=profile1%3Apaper1&hl=en';
  const url = new URL(i18n.localizeScholarUrl(original));
  assert.equal(url.searchParams.get('hl'), 'zh-CN');
  assert.equal(url.searchParams.get('citation_for_view'), 'profile1:paper1');
  assert.equal(i18n.localizeScholarUrl('https://github.com/example'), 'https://github.com/example');
  assert.equal(i18n.localizeScholarUrl('#article'), '#article');
  const query = new URL(i18n.localizeScholarUrl('https://scholar.google.com/scholar?hl=en&q=%E5%BC%95%E7%94%A8'));
  assert.equal(query.searchParams.get('q'), '引用');
  i18n.setLanguage('en');
  assert.equal(new URL(i18n.localizeScholarUrl(url.toString())).searchParams.get('hl'), 'en');
});
