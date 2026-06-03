# Nostalgic Journal — Architecture

A frameless, transparent Electron desktop app for daily journaling with a realistic book interface.

## Core Concept
- Two-page spread journal (left page = even dates, right page = odd dates)
- 3D page flip animation between day pairs
- Slide-out panels: Calendar (left), Settings (left), Calculator (right)
- Fully themeable with 10 color themes
- Custom fonts and text sizes for writing

## Tech Stack
- **Electron** (frameless, transparent window)
- **React 18** + TypeScript (strict mode)
- **Vite** for dev/build
- **Tailwind-free**: Custom CSS with CSS variables for theming

## Directory Structure
```
src/
├── main/main.ts           # Electron main process, IPC handlers
├── preload/preload.ts     # contextBridge API exposure
├── shared/ipcChannels.ts  # IPC channel constants
└── renderer/
    ├── App.tsx            # Root component, state, page flip logic
    ├── main.tsx           # React entry point
    ├── components/
    │   ├── CalendarPanel.tsx
    │   ├── CalculatorPanel.tsx
    │   ├── SettingsPanel.tsx
    │   └── icons.tsx
    ├── lib/
    │   ├── constants.ts   # Settings interface, themes, fonts, sizes
    │   ├── dates.ts       # Date utilities (keyOf, fmtLong, TODAY)
    │   ├── storage.ts     # localStorage persistence
    │   └── calc.ts        # Calculator state machine
    └── styles/
        └── journal.css    # All styles, themes, layout
```

## Key Patterns

### State Management
- `entries: Record<string, string>` — journal text keyed by "YYYY-MM-DD"
- `settings: Settings` — theme, font, textSize, journalTitle
- Both persisted to localStorage

### Page Flip Animation
1. User clicks arrow or presses arrow key
2. `flip()` populates `.flip-leaf` faces with static HTML snapshots
3. CSS `rotateY` transition animates the turn
4. On `transitionend`, React state updates to new page indices
5. `.flip-leaf` hides, revealing the live textarea pages

### IPC Channels (main ↔ renderer)
- `window:close` — close app
- `window:get-size` / `window:set-size` — for corner resize feature
- `app:get-version` — for about info

### CSS Architecture
- CSS variables for all colors (`--paper`, `--accent`, `--ink`, etc.)
- `[data-theme="X"]` selector overrides variables per theme
- `--page-w` / `--page-h` set dynamically for journal resize
- `--font-write` / `--write-size` / `--line-h` for user typography

## Settings (persisted)
```ts
interface Settings {
  theme: string;        // theme id (cream, midnight, etc.)
  font: string;         // CSS font-family value
  textSize: number;     // 14-24px
  journalTitle: string; // max 20 chars
}
```

## Adding Features
1. Define IPC channel in `src/shared/ipcChannels.ts`
2. Add handler in `main.ts` inside `app.whenReady()`
3. Expose via `contextBridge` in `preload.ts`
4. Call from renderer via `window.api.methodName()`

## Build
- `npm run dev` — Vite dev server + Electron
- `npm run build` — production bundle
- `npm run dist` — Windows installer (.exe)
