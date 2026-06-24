# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Water Warner is a macOS menu-bar-only Electron app (TypeScript) that reminds you to water your plants. There is no window/renderer UI — the entire app is a tray icon and its context menu. The dock icon is hidden.

## Commands

- `yarn dev` / `yarn start` — run the app via `electron-forge start` (Vite-backed, auto-restart).
- `yarn lint` — ESLint over the repo.
- `yarn build` — `SKIP_NOTARIZE=true electron-forge package`; unsigned local build / CI quality check.
- `yarn package` — full `electron-forge package` (signs + notarizes unless `SKIP_NOTARIZE=true`).
- `yarn make` — produce distributables (macOS `zip` + `mas` pkg).
- `yarn build:icons` — regenerate `icons/` from `seedling.png` (run automatically by `build`/`package`/`make`).
- `yarn release` — `release-it` (uses `gh auth token` for `GITHUB_TOKEN`).

There is **no test suite** and no typecheck script; `tsconfig.json` is `noEmit` (Vite does the transpilation). Use `npx tsc --noEmit` if you need a type check.

Requires Node `^24.17.0` and Corepack-managed Yarn 4.x (`corepack enable`).

## Architecture

Almost everything lives in [src/main.ts](src/main.ts) — the Electron main process. Key points worth knowing before editing:

- **State + persistence is a Proxy.** `db` is a `Proxy` over the parsed state; its `set` trap calls `sync()`, which writes `db.json` and rebuilds the tray menu. So assigning `db.lastWatered = ...` or `db.warningThresholdDays = ...` is the _only_ mechanism that both persists and re-renders — there is no separate save/refresh call.
- **`build()` rebuilds the whole context menu from scratch** each time (last-watered label, "I watered my plants on" submenu of the last 30 days, Settings → warning threshold 2–30 days, version footer). It also swaps the tray image to `warningIcon` when `daysSinceLastWatered > warningThresholdDays`.
- **Storage**: JSON at `app.getPath("appData")/water-warner/db.json` (macOS: `~/Library/Application Support/water-warner/db.json`). On load it's parsed with a Zod schema that `.catch`es to defaults (`warningThresholdDays: 10`), so a missing/corrupt DB never crashes startup. `src/helpers/safeJsonParse.ts` tolerates empty/invalid files.
- **Scheduling**: `setInterval(build, ms("2h"))` re-renders periodically so the day counter stays current without user action.
- **Icons**: `seedlingIcon` / `warningIcon` helpers load and resize tray images. `src/preload.ts` / `src/renderer.ts` do not exist — this is intentionally tray-only.

## Build pipeline

- [forge.config.mjs](forge.config.mjs) drives packaging via `@electron-forge/plugin-vite`. `renderer: []` is intentional (no BrowserWindow).
- **Notarization is env-gated.** `SKIP_NOTARIZE=true` disables both code signing and the `@t3-oss/env-core` validation of `APPLE_ID` / `APPLE_ID_PASSWORD` / `APPLE_TEAM_ID`, so CI/local builds need no Apple secrets. Real `make`/`package` requires those vars (via `.env` / `dotenv`).
- [vite.main.config.ts](vite.main.config.ts) bakes the short git commit into `process.env.commit` at build time (falls back to `"local"`), surfaced in the tray's Version menu item.

Note: the README describes esbuild, but the actual build pipeline is Vite via electron-forge.
