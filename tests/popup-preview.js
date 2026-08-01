const previewNow = '2026-07-25T10:42:00.000Z';
const previewState = {
  ownScholarId: 'DhtAFkwAAAAJ',
  trackedScholarIds: ['abc123AAAAAJ'],
  scholarIds: ['DhtAFkwAAAAJ', 'abc123AAAAAJ'],
  ownCitations: '820,884',
  citations: '822,517',
  ownCitationDelta: 4,
  citationDelta: 7,
  lastUpdated: previewNow,
  lastUpdateError: null,
  articleMonitorSummary: {
    trackedArticles: 86,
    changedArticles: 3,
    citationGain: 7,
    baselineReady: true,
    historyEvents: 4,
    partialProfiles: 0,
    lastChangeAt: previewNow
  },
  citationProfiles: [
    {
      id: 'DhtAFkwAAAAJ',
      name: 'Kaiming He',
      url: '#',
      citations: '820,884',
      citationsNumber: 820884,
      hIndex: '77',
      i10Index: '89',
      trackedArticles: 42,
      changedArticles: 2,
      articleCitationGain: 5,
      articlesComplete: true
    },
    {
      id: 'abc123AAAAAJ',
      name: 'Mei Lin',
      url: '#',
      citations: '1,633',
      citationsNumber: 1633,
      hIndex: '21',
      i10Index: '39',
      trackedArticles: 44,
      changedArticles: 1,
      articleCitationGain: 2,
      articlesComplete: true
    }
  ],
  latestArticleChanges: [],
  articleCitationEvents: []
};

const previewEvents = [
  {
    articleId: 'paper-a',
    title: 'Deep residual learning for image recognition',
    profileId: 'DhtAFkwAAAAJ',
    profileName: 'Kaiming He',
    isOwn: true,
    authors: 'K. He, X. Zhang, S. Ren, J. Sun',
    publication: 'Proceedings of CVPR, 2016',
    year: '2016',
    previousCitations: 255120,
    currentCitations: 255124,
    delta: 4
  },
  {
    articleId: 'paper-b',
    title: 'Reliable adaptation under long-tailed distribution shifts',
    profileId: 'abc123AAAAAJ',
    profileName: 'Mei Lin',
    isOwn: false,
    authors: 'M. Lin, A. Rao, S. Chen',
    publication: 'IEEE Transactions on Pattern Analysis and Machine Intelligence, 2024',
    year: '2024',
    previousCitations: 18,
    currentCitations: 20,
    delta: 2
  },
  {
    articleId: 'paper-c',
    title: 'Delving deep into rectifiers',
    profileId: 'DhtAFkwAAAAJ',
    profileName: 'Kaiming He',
    isOwn: true,
    authors: 'K. He, X. Zhang, S. Ren, J. Sun',
    publication: 'Proceedings of ICCV, 2015',
    year: '2015',
    previousCitations: 74462,
    currentCitations: 74463,
    delta: 1
  },
  {
    articleId: 'paper-d',
    title: 'A benchmark for reproducible citation graph analysis',
    profileId: 'abc123AAAAAJ',
    profileName: 'Mei Lin',
    isOwn: false,
    authors: 'M. Lin, T. Okafor',
    publication: 'Scientometrics 129, 881-904, 2024',
    year: '2024',
    previousCitations: 7,
    currentCitations: 8,
    delta: 1,
    detectedAt: '2026-07-22T08:15:00.000Z'
  }
].map((event, index) => ({
  ...event,
  id: `${event.detectedAt || previewNow}|${event.profileId}|${event.articleId}`,
  detectedAt: event.detectedAt || previewNow,
  articleUrl: '#article',
  citationsUrl: '#citations',
  previewOrder: index
}));

previewState.articleCitationEvents = previewEvents;
previewState.latestArticleChanges = previewEvents.slice(0, 3);
previewState.articleSnapshots = {
  DhtAFkwAAAAJ: {
    profileId: 'DhtAFkwAAAAJ',
    profileName: 'Kaiming He',
    capturedAt: previewNow,
    articles: [
      {
        id: 'paper-a',
        title: 'Deep residual learning for image recognition',
        authors: 'K. He, X. Zhang, S. Ren, J. Sun',
        publication: 'Proceedings of CVPR, 2016',
        year: '2016',
        citations: 255124,
        articleUrl: '#article-a',
        citationsUrl: '#citations-a'
      },
      {
        id: 'paper-c',
        title: 'Delving deep into rectifiers',
        authors: 'K. He, X. Zhang, S. Ren, J. Sun',
        publication: 'Proceedings of ICCV, 2015',
        year: '2015',
        citations: 74463,
        articleUrl: '#article-c',
        citationsUrl: '#citations-c'
      },
      {
        id: 'paper-e',
        title: 'Mask R-CNN',
        authors: 'K. He, G. Gkioxari, P. Dollar, R. Girshick',
        publication: 'Proceedings of ICCV, 2017',
        year: '2017',
        citations: 68842,
        articleUrl: '#article-e',
        citationsUrl: '#citations-e'
      },
      {
        id: 'paper-f',
        title: 'Spatial pyramid pooling in deep convolutional networks',
        authors: 'K. He, X. Zhang, S. Ren, J. Sun',
        publication: 'IEEE Transactions on Pattern Analysis and Machine Intelligence, 2015',
        year: '2015',
        citations: 54871,
        articleUrl: '#article-f',
        citationsUrl: '#citations-f'
      }
    ]
  },
  abc123AAAAAJ: {
    profileId: 'abc123AAAAAJ',
    profileName: 'Mei Lin',
    capturedAt: previewNow,
    articles: [
      {
        id: 'paper-b',
        title: 'Reliable adaptation under long-tailed distribution shifts',
        authors: 'M. Lin, A. Rao, S. Chen',
        publication: 'IEEE Transactions on Pattern Analysis and Machine Intelligence, 2024',
        year: '2024',
        citations: 20,
        articleUrl: '#article-b',
        citationsUrl: '#citations-b'
      },
      {
        id: 'paper-d',
        title: 'A benchmark for reproducible citation graph analysis',
        authors: 'M. Lin, T. Okafor',
        publication: 'Scientometrics 129, 881-904, 2024',
        year: '2024',
        citations: 8,
        articleUrl: '#article-d',
        citationsUrl: '#citations-d'
      },
      {
        id: 'paper-g',
        title: 'Calibration for robust medical image classifiers',
        authors: 'M. Lin, A. Malik, P. Huang',
        publication: 'Medical Image Analysis, 2025',
        year: '2025',
        citations: 16,
        articleUrl: '#article-g',
        citationsUrl: '#citations-g'
      }
    ]
  }
};

const previewParams = new URLSearchParams(window.location.search);
const previewMode = previewParams.get('mode');
const previewView = previewParams.get('view');

if (previewMode === 'many') {
  const venues = [
    'Computer Vision and Image Understanding',
    'Pattern Recognition',
    'Neural Information Processing Systems',
    'International Conference on Learning Representations'
  ];

  Array.from({ length: 18 }, (_value, index) => {
    const paperNumber = index + 1;
    previewState.articleSnapshots.DhtAFkwAAAAJ.articles.push({
      id: `paper-extra-${paperNumber}`,
      title: `Additional study of robust visual representations ${paperNumber}`,
      authors: 'K. He, X. Zhang, S. Ren, J. Sun',
      publication: `${venues[index % venues.length]}, ${2021 + (index % 5)}`,
      year: String(2021 + (index % 5)),
      citations: 7 + index,
      articleUrl: `#article-extra-${paperNumber}`,
      citationsUrl: `#citations-extra-${paperNumber}`
    });
  });
}

if (previewMode === 'empty') {
  previewState.articleSnapshots = {};
  previewState.articleCitationEvents = [];
  previewState.latestArticleChanges = [];
  previewState.articleMonitorSummary = {
    ...previewState.articleMonitorSummary,
    trackedArticles: 0,
    changedArticles: 0,
    citationGain: 0,
    baselineReady: false,
    historyEvents: 0,
    lastChangeAt: null
  };
}

if (previewMode === 'baseline') {
  previewState.articleCitationEvents = [];
  previewState.latestArticleChanges = [];
  previewState.articleMonitorSummary = {
    ...previewState.articleMonitorSummary,
    changedArticles: 0,
    citationGain: 0,
    baselineReady: false,
    historyEvents: 0,
    lastChangeAt: null
  };
}

if (previewMode === 'error') {
  previewState.lastUpdateError = 'Google Scholar redirected this request to Google verification. Open the Scholar profile in a normal tab, complete the check, then refresh again.';
  previewState.latestArticleChanges = [];
  previewState.articleCitationEvents = [];
}

window.chrome = {
  runtime: {
    async sendMessage(message) {
      if (message.type === 'getState') {
        return previewState;
      }

      return { ok: true };
    }
  }
};

window.addEventListener('load', () => {
  if (previewView) {
    document.getElementById(`${previewView}Tab`)?.click();
  }
});
