const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildPaperRows,
  filterAndSortPapers,
  getScholarSearchUrl
} = require('../chrome/paper-utils.js');

const state = {
  ownScholarId: 'profile-a',
  lastUpdated: '2026-07-26T08:00:00.000Z',
  citationProfiles: [
    { id: 'profile-a', name: 'Mei Lin' },
    { id: 'profile-b', name: 'Ravi Kumar' }
  ],
  latestArticleChanges: [
    {
      profileId: 'profile-a',
      articleId: 'paper-2',
      delta: 3,
      detectedAt: '2026-07-26T08:00:00.000Z'
    }
  ],
  articleSnapshots: {
    'profile-a': {
      profileId: 'profile-a',
      profileName: 'Mei Lin',
      capturedAt: '2026-07-26T08:00:00.000Z',
      articles: [
        {
          id: 'paper-1',
          title: 'Robust Vision Models',
          authors: 'Mei Lin, Ana Silva',
          publication: 'CVPR',
          year: '2024',
          citations: 42
        },
        {
          id: 'paper-2',
          title: 'Adaptive Prompt Learning',
          authors: 'Mei Lin',
          publication: 'TMLR',
          year: '2026',
          citations: 18
        }
      ]
    },
    'profile-b': {
      profileName: 'Ravi Kumar',
      capturedAt: '2026-07-25T08:00:00.000Z',
      articles: [
        {
          id: 'paper-3',
          title: 'Citation Graph Analysis',
          authors: 'Ravi Kumar',
          publication: 'Scientometrics',
          year: '2025',
          citations: 27
        }
      ]
    }
  }
};

test('builds display rows from stored paper snapshots and latest citation gains', () => {
  const rows = buildPaperRows(state);
  const changedPaper = rows.find(paper => paper.id === 'paper-2');
  const fallbackProfileIdPaper = rows.find(paper => paper.id === 'paper-3');

  assert.equal(rows.length, 3);
  assert.equal(changedPaper.profileName, 'Mei Lin');
  assert.equal(changedPaper.isOwn, true);
  assert.equal(changedPaper.latestDelta, 3);
  assert.equal(changedPaper.latestChangeAt, '2026-07-26T08:00:00.000Z');
  assert.equal(fallbackProfileIdPaper.profileId, 'profile-b');
  assert.equal(fallbackProfileIdPaper.isOwn, false);
});

test('filters papers by profile and metadata search', () => {
  const rows = buildPaperRows(state);
  const byProfile = filterAndSortPapers(rows, { profileId: 'profile-b' });
  const byAuthor = filterAndSortPapers(rows, { query: 'ana silva' });
  const byVenue = filterAndSortPapers(rows, { query: 'tmlr' });

  assert.deepEqual(byProfile.map(paper => paper.id), ['paper-3']);
  assert.deepEqual(byAuthor.map(paper => paper.id), ['paper-1']);
  assert.deepEqual(byVenue.map(paper => paper.id), ['paper-2']);
});

test('sorts papers by citations, year, title, or latest gain', () => {
  const rows = buildPaperRows(state);

  assert.deepEqual(
    filterAndSortPapers([...rows], { sort: 'citations' }).map(paper => paper.id),
    ['paper-1', 'paper-3', 'paper-2']
  );
  assert.deepEqual(
    filterAndSortPapers([...rows], { sort: 'year' }).map(paper => paper.id),
    ['paper-2', 'paper-3', 'paper-1']
  );
  assert.deepEqual(
    filterAndSortPapers([...rows], { sort: 'title' }).map(paper => paper.id),
    ['paper-2', 'paper-3', 'paper-1']
  );
  assert.deepEqual(
    filterAndSortPapers([...rows], { sort: 'change' }).map(paper => paper.id),
    ['paper-2', 'paper-1', 'paper-3']
  );
});

test('builds an encoded Google Scholar search URL for online results', () => {
  assert.equal(
    getScholarSearchUrl('multimodal reasoning & vision'),
    'https://scholar.google.com/scholar?hl=en&q=multimodal%20reasoning%20%26%20vision'
  );
  assert.equal(getScholarSearchUrl('  '), 'https://scholar.google.com/');
});
