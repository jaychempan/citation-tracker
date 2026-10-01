(function () {
  const preview = document.getElementById('productPreview');
  if (!preview) return;
  const buttons = [...document.querySelectorAll('[data-preview-theme]')];
  const appearance = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'forest';
  try {
    if (localStorage.getItem('previewTheme') === 'graphite') theme = 'graphite';
  } catch (_error) { /* A saved preview choice is optional. */ }

  function renderPreview() {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'zh';
    const messages = lang === 'en' ? EN : ZH;
    preview.src = `screenshots/${theme}${appearance.matches ? '-dark' : ''}-${lang}@2x.png`;
    preview.alt = messages[`preview_alt_${theme}`];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewTheme === theme)));
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    theme = button.dataset.previewTheme === 'graphite' ? 'graphite' : 'forest';
    renderPreview();
    try { localStorage.setItem('previewTheme', theme); } catch (_error) { /* Optional preference. */ }
  }));
  document.addEventListener('citation-language-change', renderPreview);
  appearance.addEventListener('change', renderPreview);
  renderPreview();
})();
