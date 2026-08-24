const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const backgroundSource = fs.readFileSync(
  path.join(__dirname, '..', 'chrome', 'background.js'),
  'utf8'
);

function articleRow({
  id,
  title,
  authors = 'A. Researcher, B. Scientist',
  publication = 'Journal of Useful Results 12, 34-56, 2024',
  year = '2024',
  citations = 0
}) {
  const citedBy = citations > 0
    ? `<a class="gsc_a_ac gs_ibl" href="/scholar?oi=bibs&amp;hl=en&amp;cites=${id}">${citations}</a>`
    : '<a class="gsc_a_ac gs_ibl"></a>';

  return `
    <tr class="gsc_a_tr">
      <td class="gsc_a_t">
        <a class="gsc_a_at" href="javascript:void(0)" data-href="/citations?view_op=view_citation&amp;hl=en&amp;user=profile1&amp;citation_for_view=profile1:${id}">${title}</a>
        <div class="gs_gray">${authors}</div>
        <div class="gs_gray">${publication}</div>
      </td>
      <td class="gsc_a_c">${citedBy}</td>
      <td class="gsc_a_y"><span class="gsc_a_h gsc_a_hc gs_ibl">${year}</span></td>
    </tr>
  `;
}

function profileHtml({ total = 7, hIndex = 2, i10Index = 1, rows = [], hasMore = false, history = [] } = {}) {
  return `
    <div id="gsc_prf_in">Dr. Mei &amp; Lin</div>
    <table>
      <tr><td class="gsc_rsb_sc1"><a>Citations</a></td><td class="gsc_rsb_std">${total}</td><td class="gsc_rsb_std">5</td></tr>
      <tr><td class="gsc_rsb_sc1"><a>h-index</a></td><td class="gsc_rsb_std">${hIndex}</td><td class="gsc_rsb_std">1</td></tr>
      <tr><td class="gsc_rsb_sc1"><a>i10-index</a></td><td class="gsc_rsb_std">${i10Index}</td><td class="gsc_rsb_std">0</td></tr>
      <tbody>${rows.join('')}</tbody>
    </table>
    <div id="gsc_g">${history.map(item => `<span class="gsc_g_t">${item.year}</span><a class="gsc_g_a"><span class="gsc_g_al">${item.citations}</span></a>`).join('')}</div>
    <button id="gsc_bpf_more" ${hasMore ? '' : 'disabled'}>Show more</button>
  `;
}

test('parses annual citation history from the Scholar graph', () => {
  const { context } = loadBackground();
  const html = profileHtml({ history: [
    { year: 2022, citations: 4 },
    { year: 2023, citations: 18 },
    { year: 2024, citations: 203 }
  ] });

  assert.deepEqual(Array.from(context.parseCitationHistory(html), item => ({ ...item })), [
    { year: 2022, citations: 4 },
    { year: 2023, citations: 18 },
    { year: 2024, citations: 203 }
  ]);
});

function loadBackground(initialStorage = {}, fetchImpl = async () => {
  throw new Error('Unexpected fetch');
}) {
  const storage = { ...initialStorage };
  const action = {
    badgeText: null,
    badgeColor: null,
    title: null
  };
  const eventTarget = () => ({ addListener() {} });
  const chrome = {
    storage: {
      local: {
        async get(keys) {
          if (!keys) {
            return { ...storage };
          }

          return keys.reduce((result, key) => {
            if (Object.hasOwn(storage, key)) {
              result[key] = storage[key];
            }
            return result;
          }, {});
        },
        async set(values) {
          Object.assign(storage, values);
        }
      }
    },
    action: {
      setBadgeBackgroundColor({ color }) {
        action.badgeColor = color;
      },
      setBadgeTextColor() {},
      setBadgeText({ text }) {
        action.badgeText = text;
      },
      setTitle({ title }) {
        action.title = title;
      }
    },
    runtime: {
      onInstalled: eventTarget(),
      onStartup: eventTarget(),
      onMessage: eventTarget()
    },
    alarms: {
      create() {},
      onAlarm: eventTarget()
    }
  };
  const context = vm.createContext({
    chrome,
    fetch: fetchImpl,
    console: {
      log() {},
      warn() {},
      error() {}
    },
    URL,
    Intl,
    Map,
    Set,
    Date,
    Promise,
    Number,
    String,
    RegExp,
    Array,
    Object,
    Math,
    AbortController,
    DOMException,
    setTimeout,
    clearTimeout
  });

  vm.runInContext(backgroundSource, context, { filename: 'background.js' });
  return { context, storage, action };
}

test('parses article metadata, stable IDs, citation links, and encoded text', () => {
  const { context } = loadBackground();
  const html = profileHtml({
    rows: [
      articleRow({
        id: 'abc123',
        title: 'Language &amp; Vision: &#x27;Grounded&#x27; Models',
        authors: 'M. Lin &amp; K. Rao',
        publication: 'Proceedings of TestConf, 2024',
        citations: 12
      }),
      articleRow({
        id: 'zero456',
        title: 'A Paper Without Citations',
        year: '2023',
        citations: 0
      })
    ]
  });

  const articles = context.parseScholarArticles(html, 'profile1');

  assert.equal(articles.length, 2);
  assert.equal(articles[0].id, 'profile1:abc123');
  assert.equal(articles[0].title, "Language & Vision: 'Grounded' Models");
  assert.equal(articles[0].authors, 'M. Lin & K. Rao');
  assert.equal(articles[0].citations, 12);
  assert.match(articles[0].articleUrl, /citation_for_view=profile1:abc123/);
  assert.match(articles[0].citationsUrl, /cites=abc123/);
  assert.equal(articles[1].citations, 0);
  assert.equal(articles[1].citationsUrl, null);
  assert.equal(context.parseCitationCount(html), '7');
  assert.equal(context.parseScholarMetric(html, 'h-index'), '2');
});

test('creates citation events only for known papers whose count increased', () => {
  const { context } = loadBackground();
  const detectedAt = '2026-07-25T08:00:00.000Z';
  const previousSnapshots = {
    profile1: {
      capturedAt: '2026-07-25T07:30:00.000Z',
      articles: [
        { id: 'profile1:a', title: 'Paper A', citations: 3 },
        { id: 'profile1:b', title: 'Paper B', citations: 4 }
      ]
    }
  };
  const profiles = [{
    id: 'profile1',
    name: 'Dr. Mei Lin',
    isOwn: true,
    fetchSucceeded: true,
    articlesComplete: true,
    articles: [
      { id: 'profile1:a', title: 'Paper A', citations: 5, authors: 'A', publication: 'J', year: '2024' },
      { id: 'profile1:b', title: 'Paper B', citations: 4, authors: 'B', publication: 'J', year: '2023' },
      { id: 'profile1:c', title: 'Newly listed paper', citations: 9, authors: 'C', publication: 'J', year: '2025' }
    ]
  }];

  const diff = context.createArticleSnapshotDiff(previousSnapshots, profiles, detectedAt);

  assert.equal(diff.changes.length, 1);
  assert.equal(diff.changes[0].articleId, 'profile1:a');
  assert.equal(diff.changes[0].previousCitations, 3);
  assert.equal(diff.changes[0].currentCitations, 5);
  assert.equal(diff.changes[0].delta, 2);
  assert.equal(diff.statsByProfile.profile1.trackedArticles, 3);
  assert.equal(diff.statsByProfile.profile1.changedArticles, 1);
  assert.equal(diff.statsByProfile.profile1.citationGain, 2);
});

test('keeps unseen previous papers when a paginated profile fetch is partial', () => {
  const { context } = loadBackground();
  const previousSnapshots = {
    profile1: {
      articles: [
        { id: 'profile1:a', title: 'Paper A', citations: 3 },
        { id: 'profile1:b', title: 'Paper B', citations: 4 }
      ]
    }
  };
  const profiles = [{
    id: 'profile1',
    name: 'Dr. Mei Lin',
    fetchSucceeded: true,
    articlesComplete: false,
    articles: [
      { id: 'profile1:a', title: 'Paper A', citations: 4 }
    ]
  }];

  const diff = context.createArticleSnapshotDiff(
    previousSnapshots,
    profiles,
    '2026-07-25T08:00:00.000Z'
  );

  assert.equal(diff.nextSnapshots.profile1.articles.length, 2);
  assert.equal(diff.changes.length, 1);
  assert.equal(diff.changes[0].articleId, 'profile1:a');
});

test('fetches subsequent Scholar pages until the article list is complete', async () => {
  const firstPageRows = Array.from({ length: 100 }, (_value, index) => articleRow({
    id: `page-one-${index}`,
    title: `Page one paper ${index}`,
    citations: index
  }));
  const summaryRows = firstPageRows.slice(0, 20);
  const secondPageRows = [
    articleRow({ id: 'page-two-0', title: 'Final paper', citations: 5 })
  ];
  const requestedUrls = [];
  const fetchImpl = async url => {
    requestedUrls.push(url);
    const parsedUrl = new URL(url);
    const isSummary = !parsedUrl.searchParams.has('pagesize');
    const isSecondPage = parsedUrl.searchParams.get('cstart') === '100';
    return {
      ok: true,
      status: 200,
      async text() {
        return profileHtml({
          total: 500,
          rows: isSummary ? summaryRows : isSecondPage ? secondPageRows : firstPageRows,
          hasMore: !isSecondPage
        });
      }
    };
  };
  const { context } = loadBackground({}, fetchImpl);

  const profile = await context.fetchScholarProfile('profile1');

  assert.equal(requestedUrls.length, 3);
  assert.equal(new URL(requestedUrls[0]).searchParams.has('pagesize'), false);
  assert.equal(new URL(requestedUrls[1]).searchParams.get('pagesize'), '100');
  assert.equal(new URL(requestedUrls[2]).searchParams.get('cstart'), '100');
  assert.equal(profile.articles.length, 101);
  assert.equal(profile.articlePagesFetched, 2);
  assert.equal(profile.articlesComplete, true);
  assert.equal(profile.articleFetchError, null);
});

test('preserves citation totals and a partial baseline when expanded article loading is rate-limited', async () => {
  const summaryRows = Array.from({ length: 20 }, (_value, index) => articleRow({
    id: `summary-${index}`,
    title: `Summary paper ${index}`,
    citations: index
  }));
  const fetchImpl = async url => {
    const isExpandedRequest = new URL(url).searchParams.has('pagesize');

    if (isExpandedRequest) {
      return {
        ok: false,
        status: 429,
        async text() {
          return '';
        }
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return profileHtml({ total: 190, rows: summaryRows, hasMore: true, history: [
          { year: 2025, citations: 80 }, { year: 2026, citations: 110 }
        ] });
      }
    };
  };
  const { context } = loadBackground({}, fetchImpl);

  const profile = await context.fetchScholarProfile('profile1');

  assert.equal(profile.citationsNumber, 190);
  assert.deepEqual(Array.from(profile.citationHistory, item => ({ ...item })), [
    { year: 2025, citations: 80 }, { year: 2026, citations: 110 }
  ]);
  assert.equal(profile.articles.length, 20);
  assert.equal(profile.articlesComplete, false);
  assert.match(profile.articleFetchError, /Citation totals were updated/);
  assert.match(profile.articleFetchError, /HTTP 429/);
});

test('reports Scholar verification pages and returns the stored failure reason to the popup', async () => {
  const verificationFetch = async () => ({
    ok: true,
    status: 200,
    async text() {
      return '<html><body>Our systems have detected unusual traffic. Please confirm you are not a robot.</body></html>';
    }
  });
  const { context, storage } = loadBackground({}, verificationFetch);

  await assert.rejects(
    context.fetchScholarPage('https://scholar.google.com/citations?user=profile1', 'profile1'),
    /requested browser verification/
  );

  const updateResult = await context.performCitationUpdate();
  assert.equal(updateResult, false);
  assert.match(storage.lastUpdateError, /requested browser verification/);

  const response = await context.getUpdateResponse(false);
  assert.equal(response.ok, false);
  assert.match(response.error, /requested browser verification/);
});

test('intercepts Scholar verification redirects and reuses the verified browser session', async () => {
  let requestOptions;
  const redirectFetch = async (_url, options) => {
    requestOptions = options;
    return {
      ok: false,
      status: 0,
      type: 'opaqueredirect',
      async text() {
        throw new Error('Opaque redirects cannot be read');
      }
    };
  };
  const { context } = loadBackground({}, redirectFetch);

  await assert.rejects(
    context.fetchScholarPage('https://scholar.google.com/citations?user=profile1', 'profile1'),
    /redirected this request to Google verification/
  );

  assert.equal(requestOptions.redirect, 'manual');
  assert.equal(requestOptions.credentials, 'include');
});

test('a first refresh stores a baseline and the next refresh records detailed activity', async () => {
  let currentHtml = profileHtml({
    total: 7,
    rows: [
      articleRow({ id: 'a', title: 'Paper A', citations: 3 }),
      articleRow({ id: 'b', title: 'Paper B', citations: 4 })
    ]
  });
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    async text() {
      return currentHtml;
    }
  });
  const { context, storage, action } = loadBackground({
    ownScholarId: 'profile1',
    trackedScholarIds: [],
    scholarIds: ['profile1']
  }, fetchImpl);

  const firstResult = await context.performCitationUpdate();

  assert.equal(firstResult, true);
  assert.equal(storage.articleMonitorSummary.trackedArticles, 2);
  assert.equal(storage.articleMonitorSummary.baselineReady, false);
  assert.equal(storage.articleCitationEvents.length, 0);

  currentHtml = profileHtml({
    total: 9,
    rows: [
      articleRow({ id: 'a', title: 'Paper A', citations: 5 }),
      articleRow({ id: 'b', title: 'Paper B', citations: 4 })
    ]
  });

  const secondResult = await context.performCitationUpdate();

  assert.equal(secondResult, true);
  assert.equal(storage.articleMonitorSummary.baselineReady, true);
  assert.equal(storage.articleMonitorSummary.changedArticles, 1);
  assert.equal(storage.articleMonitorSummary.citationGain, 2);
  assert.equal(storage.articleCitationEvents.length, 1);
  assert.equal(storage.articleCitationEvents[0].title, 'Paper A');
  assert.equal(storage.articleCitationEvents[0].previousCitations, 3);
  assert.equal(storage.articleCitationEvents[0].currentCitations, 5);
  assert.equal(storage.citationProfiles[0].trackedArticles, 2);
  assert.match(action.title, /1 articles gained \+2/);
});

test('prunes expired, duplicate, and removed-profile events', () => {
  const { context } = loadBackground();
  const now = new Date('2026-07-25T08:00:00.000Z').getTime();
  const recent = {
    id: 'recent',
    profileId: 'profile1',
    detectedAt: '2026-07-24T08:00:00.000Z',
    delta: 1
  };
  const result = context.pruneArticleEvents([
    recent,
    { ...recent },
    {
      id: 'expired',
      profileId: 'profile1',
      detectedAt: '2025-01-01T08:00:00.000Z',
      delta: 1
    },
    {
      id: 'removed',
      profileId: 'profile2',
      detectedAt: '2026-07-24T08:00:00.000Z',
      delta: 1
    }
  ], new Set(['profile1']), now);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'recent');
});
