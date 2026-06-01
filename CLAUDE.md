# Project: Desktop App

## Stack
- **Framework:** Electron + React + TypeScript
- **Bundler:** Vite (renderer) + electron-builder (packaging)
- **Styling:** Tailwind CSS
- **Package Manager:** npm
- **Target Platform:** Windows (primary), cross-platform compatible

## Project Structure
```
my-app/
├── src/
│   ├── main/          # Electron main process (Node.js)
│   │   └── main.ts
│   ├── renderer/      # React frontend (browser context)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── preload/       # Preload scripts (bridge layer)
│       └── preload.ts
├── .claude/
│   └── settings.json
├── CLAUDE.md
├── package.json
├── vite.config.ts
└── electron-builder.yml
```

## Key Rules

### Architecture
- Keep main process (Node.js) and renderer process (React) strictly separated
- Always use the preload script + `contextBridge` for IPC — never expose raw Node APIs to renderer
- Use `ipcMain` / `ipcRenderer` for all communication between processes
- Never use `nodeIntegration: true` — it's a security risk

### Code Style
- TypeScript strict mode enabled — no `any` types unless absolutely necessary
- Use functional React components and hooks only (no class components)
- Name component files with PascalCase (e.g. `EmoteCard.tsx`)
- Name utility files with camelCase (e.g. `fileUtils.ts`)

### Building & Packaging
- Dev mode: `npm run dev` (starts Electron + Vite HMR)
- Production build: `npm run build` then `npm run dist` to generate installer
- Output installer goes to `dist/` folder as `.exe` (NSIS installer)
- Always test the packaged build before calling a feature done

### Dependencies
- Prefer well-maintained packages with Electron compatibility
- Check electron-builder docs before adding native Node modules (they need rebuilding)
- Keep `devDependencies` and `dependencies` correctly separated — electron-builder only bundles `dependencies`

### Security
- Always validate and sanitize any input from the renderer before acting on it in main
- Use `shell.openExternal()` only for trusted URLs
- Do not expose `fs`, `path`, or other Node modules directly via contextBridge

### File Operations
- All file system operations must happen in the main process
- Send results back to renderer via IPC

## Common Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build renderer and main process
npm run dist         # Package into Windows installer
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
```

## When Adding New Features
1. Define the IPC channel name as a constant in a shared `ipcChannels.ts` file
2. Add the handler in `main.ts` using `ipcMain.handle()`
3. Expose it in `preload.ts` via `contextBridge.exposeInMainWorld()`
4. Call it in the renderer via `window.api.<method>()`
5. Add TypeScript types for the API in a `global.d.ts` or `preload.d.ts` file
