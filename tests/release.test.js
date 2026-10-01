const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('website messages cover every bilingual page and accessible label', () => {
  const { ZH, EN } = vm.runInNewContext(read('website/i18n.js').split('let currentLang')[0] + '\n({ ZH, EN })');
  assert.deepEqual(Object.keys(ZH).sort(), Object.keys(EN).sort());
  for (const file of ['website/index.html', 'website/privacy.html']) {
    for (const match of read(file).matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)) {
      assert.ok(ZH[match[1]] && EN[match[1]], `${file}: missing message ${match[1]}`);
    }
  }
});

test('website local assets and versioned installation links resolve', () => {
  const version = JSON.parse(read('chrome/manifest.json')).version;
  assert.equal(JSON.parse(read('package.json')).version, version);
  for (const file of ['website/index.html', 'website/privacy.html']) {
    const html = read(file);
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^[a-z]+:/i.test(match[1])) continue;
      const localPath = match[1].split(/[?#]/)[0];
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), localPath)), `${file}: ${localPath}`);
    }
    for (const match of html.matchAll(/(?:css|js)\?v=([^"]+)/g)) assert.equal(match[1], version);
  }
  for (const theme of ['forest', 'graphite']) {
    for (const appearance of ['', '-dark']) {
      for (const language of ['en', 'zh']) {
        assert.ok(fs.existsSync(path.join(root, `website/screenshots/${theme}${appearance}-${language}@2x.png`)));
      }
    }
  }
  assert.ok(read('website/index.html').includes(`downloads/citation-tracker-${version}.zip`));
});

test('download archive contains the current extension and licenses, without development artifacts', () => {
  const result = spawnSync('python3', ['-c', `
import hashlib, json, pathlib, zipfile
root = pathlib.Path(${JSON.stringify(root)})
version = json.loads((root / "chrome/manifest.json").read_text())["version"]
archive_path = root / "website/downloads" / ("citation-tracker-" + version + ".zip")
with zipfile.ZipFile(archive_path) as archive:
    assert archive.testzip() is None
    assert json.loads(archive.read("manifest.json"))["version"] == version
    for name in archive.namelist():
        assert not name.startswith(("tests/", "website/", "output/", "marketing/", "."))
        source = root / "LICENSE" if name == "LICENSE" else root / "chrome" / name
        assert archive.read(name) == source.read_bytes(), name + " is stale"
    for name in ["popup.html", "popup.css", "popup.js", "i18n.js", "paper-utils.js", "background.js", "icons/interface.svg", "fonts/roboto-latin.woff2", "fonts/noto-sans-sc-ui.woff2", "fonts/Roboto-OFL.txt", "fonts/NotoSansSC-OFL.txt", "_locales/en/messages.json", "_locales/zh_CN/messages.json", "LICENSE"]:
        assert name in archive.namelist(), name
assert archive_path.with_suffix(".zip.sha256").read_text().split()[0] == hashlib.sha256(archive_path.read_bytes()).hexdigest()
`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
