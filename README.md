## Water Warner

Minimal macOS menu bar app to remind you to water your plants. It lives entirely in the menu bar, shows how many days it’s been since you last watered, and switches to a warning icon when you pass your chosen threshold.

![Seedling](./seedling.png) ![Warning](./warning.png)

### Features

- **Menu bar only**: Dock icon hidden; quick access from the tray.
- **One click to log watering**: “I just watered my plants”.
- **Backdate easily**: Pick any of the last 30 days.
- **Warning threshold**: Choose 2–30 days; icon turns to a warning when exceeded.
- **Launch at login**: Enable from Settings.
- **Auto-refresh**: Tray icon/menu rebuild every 2 hours.
- **Local-only storage**: Data is stored as JSON on disk; no network.
- **Version in menu**: Shows the current commit or “local”.

### How it works

- On first run, the app creates a data folder and `db.json` at:
  - macOS: `~/Library/Application Support/water-warner/db.json`
- Data format:

```json
{
  "lastWatered": "2025-01-01T12:00:00.000Z",
  "warningThresholdDays": 10
}
```

- The tray icon is a seedling while \(days since lastWatered\) \<= \(warningThresholdDays\); otherwise a warning icon is shown.

### Requirements

- **Node.js**: ^22.20.0
- **Yarn**: 4.x (this repo uses Corepack-managed Yarn; see below)
- **OS**: macOS is supported and packaged. Other platforms are untested.

### Getting started (development)

1. Enable Yarn via Corepack (once per machine):

```bash
corepack enable
corepack prepare yarn@4.10.3 --activate
```

2. Install dependencies:

```bash
yarn install
```

3. Run the app in watch mode:

```bash
yarn dev
```

This concurrently watches and rebuilds the main process with esbuild and starts Electron with auto-restart. The app lives in the menu bar; right-click the tray icon to open the menu.

### Useful scripts

- **Build once**: `yarn build`
- **Start (expects built files)**: `yarn start`
- **Generate icons from seed image**: `yarn build:icons`
- **Package app (unzipped app bundle in `out/`)**: `yarn package`
- **Make distributables (e.g., macOS zip / MAS)**: `yarn make`

Notes:

- Packaging/making uses Electron Forge. macOS zip and MAS targets are configured. Code signing/notarization is not configured by default.
- `yarn package` runs `yarn build` and `yarn build:icons` automatically.

### Data and privacy

- All data is stored locally in `db.json` under the app data folder.
- To reset the app, quit it and delete `db.json`; it will be recreated on next launch.
- The app has no network features.

### Project structure

- `src/main.ts`: Electron main process, tray/menu, persistence, scheduling.
- `src/helpers/printDate.ts`: Formats dates for menu labels.
- `src/helpers/safeJsonParse.ts`: Tolerant JSON parsing for the local DB.
- `src/helpers/seedlingIcon.ts` and `src/helpers/warningIcon.ts`: Load and resize tray icons.
- `src/preload.ts` and `src/renderer.ts`: Present for completeness; renderer UI is not used.

### Troubleshooting

- If Yarn errors mention PnP or incompatible Yarn versions, ensure Corepack is active and Yarn 4.10.3 is selected: `corepack prepare yarn@4.10.3 --activate`.
- On first launch of a packaged build, macOS Gatekeeper may warn about unsigned apps. You may need to allow the app in System Settings or sign/notarize builds for distribution.

### License

[CC0 1.0 (Public Domain)](LICENSE.md)

### Acknowledgements

Based on the Electron Quick Start TypeScript template; rebuilt with esbuild and tailored for a tray-only workflow.
