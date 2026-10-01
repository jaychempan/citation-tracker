# Popup fonts

The popup uses **Roboto** for Latin text and numbers and **Noto Sans SC** for Simplified Chinese interface text. Both are normal-style variable fonts supporting weights 400–700. The font files are bundled locally; opening the popup makes no Google Fonts request.

Source: [Google's Roboto and Noto typography guidance](https://m1.material.io/style/typography.html) and the Google Fonts CSS API. Original download URLs and SHA-256 hashes are recorded in `SOURCES.json`. Each font's SIL Open Font License is included beside its binary.

To keep the extension small, Roboto includes basic Latin and punctuation, and Noto Sans SC includes the characters in `chrome/i18n.js` plus Chinese date and compact-number units. Other characters, including dynamic profile names and paper metadata, fall back to the user's installed fonts. The `unicode-range` declarations in `fonts.css` preserve that fallback.

When adding translations, regenerate the Chinese subset through the Google Fonts CSS API with `family=Noto+Sans+SC:wght@400..700` and a `text` parameter containing every Chinese interface character. Include `年月日时分秒万亿上午下午星期周一二三四五六零〇` for locale-generated text. Download the returned WOFF2 file, copy its `unicode-range`, replace its remote URL with the local filename, and update `SOURCES.json`.
