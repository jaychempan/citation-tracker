"""Build a reproducible extension archive from explicit runtime directories."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "chrome"
manifest = json.loads((EXTENSION / "manifest.json").read_text())
version = manifest["version"]
if version != json.loads((ROOT / "package.json").read_text())["version"]:
    raise SystemExit("Extension and package versions must match")

files = [EXTENSION / name for name in (
    "manifest.json", "background.js", "popup.html", "popup.css", "popup.js",
    "i18n.js", "paper-utils.js",
)]
for directory in ("icons", "fonts", "_locales"):
    files.extend(path for path in (EXTENSION / directory).rglob("*")
                 if path.is_file() and not path.name.startswith("."))

target = ROOT / "website" / "downloads" / f"citation-tracker-{version}.zip"
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    entries = [(path.relative_to(EXTENSION).as_posix(), path) for path in files]
    entries.append(("LICENSE", ROOT / "LICENSE"))
    for name, path in sorted(entries):
        entry = ZipInfo(name, date_time=(2026, 10, 1, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, path.read_bytes(), compresslevel=9)
digest = hashlib.sha256(target.read_bytes()).hexdigest()
target.with_suffix(".zip.sha256").write_text(f"{digest}  {target.name}\n")
print(f"{target.relative_to(ROOT)} ({target.stat().st_size:,} bytes)")
