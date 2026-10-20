# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the app with HMR (electron-vite)
- `npm run typecheck` — runs `typecheck:node` (main + preload) and `typecheck:web` (renderer) separately; the two use different tsconfigs
- `npm run lint` / `npm run format` — ESLint / Prettier
- `npm run build` — typecheck, then electron-vite build into `out/`
- `npm run build:win` / `build:mac` / `build:linux` — package installers via electron-builder (`build:mac` and `build:linux` skip the typecheck)

There is no test framework configured. Note that `machine.ts` is deliberately a pure reducer so it is easy to unit test if one is added.

## Architecture

Electron + React 19 + Tailwind 3 + framer-motion, scaffolded from electron-vite. Three processes, each with its own tsconfig:

- `src/main/index.ts` — frameless, transparent, non-resizable 364×544 window (rounded corners, glass effect and shadow are all drawn in CSS, so don't enable the native shadow). Also owns the tray, single-instance lock, always-on-top state, and `nativeTheme`.
- `src/preload/index.ts` — the `api` object is the **only** bridge to the main process; its type is exported and consumed via `src/preload/index.d.ts` as `window.api`. To add a renderer→main capability: add it to `api`, then add the matching `ipcMain` handler in `main/index.ts`.
- `src/renderer/src` — the UI. `@renderer` aliases this directory.

### Behaviors that span files

- **Close = hide to tray.** The window's `close` event is intercepted unless `quitting` is set; the timer keeps running in the background. Real quit only happens through the tray menu (or `before-quit`). Anything that should truly exit must set `quitting = true` first.
- **Pin (always-on-top) is synced both ways.** The renderer persists `pinned` in localStorage and sends `win:pin` on startup; the tray menu checkbox changes it in main and notifies back via `win:pinned` (`setPinned(v, notify=true)`).
- **Dark mode.** The renderer does not pick a theme itself: `theme:set` sets `nativeTheme.themeSource` in main, and the UI follows `prefers-color-scheme` (toggling the `dark` class on `<html>`).
- **Timer state machine** (`timer/machine.ts` reducer, wrapped by `timer/useTimer.ts`). Running time is derived from an `endAt` timestamp rather than decrementing, so background throttling doesn't slow it; `TICK` runs every 200 ms but returns the same state object unless the displayed second changes. When time runs out it auto-advances to the next mode (focus → short, every 4th focus → long) and returns to `idle` rather than auto-starting. `finished` is a counter that triggers the beep (WebAudio-synthesized, shared `AudioContext`). `useTimer` also pushes the countdown to the window title and tray tooltip (`tray:update`, which sets the menu-bar title on macOS).
- UI preferences (`opaque`, `pinned`) persist via `hooks/usePersistentBool` (localStorage).

User-facing strings and code comments are in Chinese; keep that convention.
