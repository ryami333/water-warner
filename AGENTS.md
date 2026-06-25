# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Water Warner is a macOS menu-bar-only Electron app (TypeScript) that reminds you to water your plants. There is no window/renderer UI — the entire app is a tray icon and its context menu. The dock icon is hidden.

## Commands

- `yarn dev` / `yarn start` — run the app via `electron-forge start` (Vite-backed, auto-restart).
- `yarn lint` — ESLint over the repo.
- `yarn build` — `electron-forge package`; unsigned local build / CI quality check (signing is opt-in, off by default).
- `yarn package` — `electron-forge package`; unsigned unless `SIGN=true` is set, which enables signing + notarization.
- `yarn make` — produce distributables (macOS `zip`); runs with `SIGN=true`, so it signs + notarizes.
- `yarn build:icons` — regenerate `icons/` from `seedling.png` (run automatically by `build`/`package`/`make`).
- `yarn release` — `release-it` (uses `gh auth token` for `GITHUB_TOKEN`).

There is **no test suite** and no typecheck script; `tsconfig.json` is `noEmit` (Vite does the transpilation). Use `npx tsc --noEmit` if you need a type check.

Always format changed files with `yarn prettier --write` before committing.

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
- **Signing/notarization is opt-in via `SIGN`.** Setting `SIGN=true` turns on code signing and notarization, which read `APPLE_ID` / `APPLE_ID_PASSWORD` / `APPLE_TEAM_ID` (via `.env` / `dotenv`). When `SIGN` is unset (the default), packaging skips signing entirely, so CI/local builds need no Apple secrets. `forge.config.mjs` validates `SIGN` with `@t3-oss/env-core` and only configures `osxSign` / `osxNotarize` when it's true.
- [vite.main.config.ts](vite.main.config.ts) bakes the short git commit into `process.env.commit` at build time (falls back to `"local"`), surfaced in the tray's Version menu item.

Note: the README describes esbuild, but the actual build pipeline is Vite via electron-forge.

## Auto-updates

[src/main.ts](src/main.ts) calls `updateElectronApp()` (from `update-electron-app`) at startup, which polls the free [update.electronjs.org](https://update.electronjs.org) feed hourly and applies new GitHub releases via Squirrel.Mac. Requirements that are already met: the repo is public, releases are published as GitHub Releases (`release-it`), and the macOS distributable is a `maker-zip` (Squirrel.Mac needs the `.zip`).

The catch: **Squirrel.Mac only updates code-signed apps.** Auto-update therefore only works for releases built with `SIGN=true` (i.e. `yarn make`, which `release-it` runs via its `after:bump` hook). For unsigned builds the updater silently does nothing, and it is a no-op in development (`app.isPackaged === false`). When testing, expect the "no update available" / signing-related log lines unless you run a signed, packaged build that is older than the latest release.
