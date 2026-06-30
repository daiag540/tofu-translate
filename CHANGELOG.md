# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-06-30

### Fixed

- **Zotero.log() crash** — `Zotero.log()` is not a valid API, caused startup to crash on the very first line. Replaced with `Zotero.debug()` throughout.
- **Deprecated Components.classes XHR** — `Components.classes`/`Components.interfaces` are removed in Zotero 9 (Firefox 140 ESR). Replaced the entire XHR wrapper with `Zotero.HTTP.request()`.
- **Components.utils.forceGC()** — Not available in Zotero 9. Removed from `shutdown()`.
- **createXULElement("html:div")** — `createXULElement` only creates XUL elements. Replaced with `createElementNS()` for HTML elements.
- **Clipboard API** — `Services.clipboard.getData("text/unicode")` and `clipboard.helper.copyString()` were used incorrectly. Replaced with proper `nsITransferable` approach.
- **getFulltext() / getPagesForItem()** — These APIs do not exist. Replaced with `Zotero.Fulltext.getPages()`.
- **getMainWindows()** — Not a valid Zotero API. Replaced with `Services.wm.getEnumerator("navigator:browser")`.
- **Prefs XHTML inline script** — Referenced `TofuTranslate` which is not available in the preferences pane context. Removed inline script; prefs JS is now loaded via `Zotero.PreferencePanes.register({ scripts: [...] })`.
- **Startup/shutdown error handling** — Added try-catch blocks to prevent silent failures and improve debuggability.

### Changed

- `strict_max_version` updated from `"7.0.*"` to `"9.99.99"` to support Zotero 9.
- `strict_min_version` updated from `"6.999"` to `"7.0"`.
- Removed invalid `update_url` from manifest.json (was pointing to a non-existent URL).
- Regenerated valid PNG icon files (previous icons were empty placeholders).
- Removed `chrome.manifest` from build include list (file does not exist, not needed for bootstrapped plugins).

## [1.0.0] - 2026-06-25

### Added

- Initial release.
- Full-text translation for Zotero items (abstract, notes, PDF content).
- Segment-based intelligent translation with cross-paragraph context.
- Built-in terminology dictionaries for 5 domains (CS, Medicine, Chemistry, Law, Economics).
- Side-by-side original/translated text view.
- Save translation results as Zotero notes.
- Clipboard translation.
- PDF reader selection translation popup.
- SiliconFlow (Tofu) API integration with 15+ model support.
- OpenAI-compatible API interface.
- Customizable prompt templates with variable substitution.
- Streaming output for real-time translation progress.
- API connection test.
- Bilingual UI (English / Simplified Chinese) via Fluent localization.
- Settings pane integrated into Zotero preferences.
