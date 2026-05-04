# Citation Tracker

A minimal Chrome extension that monitors your Google Scholar citations — right from the toolbar.

## Features

- **Auto Refresh** — Citations update every 30 minutes
- **Badge Count** — Your citation count is always visible in the toolbar
- **Multi Profile** — Track your own and others' profiles in one popup
- **Delta Tracking** — See citation changes since last update
- **Offline Resilient** — Preserves previous data when network fails

## Install

### Chrome Web Store

*Coming soon*

### Developer Mode

1. Clone this repo
   ```bash
   git clone https://github.com/jaychempan/citation-tracker.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `chrome` directory
5. Done — the Citation Tracker icon appears in your toolbar

## Usage

1. Click the toolbar icon
2. Enter your Google Scholar user ID (find it from your profile URL: `scholar.google.com/citations?user=YOUR_ID&hl=en`)
3. Optionally add other Scholar IDs to track
4. Click **Save** — citations refresh automatically

## License

MIT