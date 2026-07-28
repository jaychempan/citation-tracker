(function exposeCitationPaperUtils(root) {
  function toSearchText(value) {
    return String(value || '').toLocaleLowerCase();
  }

  function getPaperKey(profileId, articleId) {
    return `${profileId || ''}|${articleId || ''}`;
  }

  function getScholarSearchUrl(query) {
    const value = String(query || '').trim();
    return value
      ? `https://scholar.google.com/scholar?hl=en&q=${encodeURIComponent(value)}`
      : 'https://scholar.google.com/';
  }

  function buildPaperRows(state = {}) {
    const profilesById = new Map((state.citationProfiles || []).map(profile => [
      profile.id,
      profile
    ]));
    const latestChangesByPaper = new Map((state.latestArticleChanges || []).map(change => [
      getPaperKey(change.profileId, change.articleId),
      change
    ]));

    return Object.entries(state.articleSnapshots || {}).flatMap(([snapshotId, snapshot]) => {
      const profileId = snapshot.profileId || snapshotId;
      const profile = profilesById.get(profileId) || {};

      return (snapshot.articles || []).map(article => {
        const latestChange = latestChangesByPaper.get(getPaperKey(profileId, article.id));

        return {
          ...article,
          profileId,
          profileName: snapshot.profileName || profile.name || profileId,
          isOwn: profileId === state.ownScholarId,
          capturedAt: snapshot.capturedAt || state.lastUpdated || null,
          latestDelta: latestChange ? latestChange.delta : 0,
          latestChangeAt: latestChange ? latestChange.detectedAt : null
        };
      });
    });
  }

  function filterAndSortPapers(papers = [], options = {}) {
    const profileId = options.profileId || 'all';
    const query = toSearchText(options.query).trim();
    const sort = options.sort || 'citations';
    const filtered = papers.filter(paper => {
      if (profileId !== 'all' && paper.profileId !== profileId) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        paper.title,
        paper.authors,
        paper.publication,
        paper.year,
        paper.profileName
      ].some(value => toSearchText(value).includes(query));
    });

    return filtered.sort((a, b) => {
      if (sort === 'year') {
        return (Number.parseInt(b.year, 10) || 0) - (Number.parseInt(a.year, 10) || 0)
          || (b.citations || 0) - (a.citations || 0)
          || String(a.title).localeCompare(String(b.title));
      }

      if (sort === 'title') {
        return String(a.title).localeCompare(String(b.title))
          || (b.citations || 0) - (a.citations || 0);
      }

      if (sort === 'change') {
        return (b.latestDelta || 0) - (a.latestDelta || 0)
          || (b.citations || 0) - (a.citations || 0)
          || String(a.title).localeCompare(String(b.title));
      }

      return (b.citations || 0) - (a.citations || 0)
        || (Number.parseInt(b.year, 10) || 0) - (Number.parseInt(a.year, 10) || 0)
        || String(a.title).localeCompare(String(b.title));
    });
  }

  const api = {
    buildPaperRows,
    filterAndSortPapers,
    getPaperKey,
    getScholarSearchUrl
  };

  root.CitationPaperUtils = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
