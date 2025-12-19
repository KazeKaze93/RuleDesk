# Project: RuleDesk

**Stack:** Electron (Vite), React (Shadcn/UI, Zustand), TypeScript, Drizzle ORM (SQLite), Python Sidecar.

## Architecture Map

- **src/main**: Backend Logic.
  - `db/`: Worker thread logic (`db-worker.ts`), Drizzle schemas (`schema.ts`), Repositories (`*.repo.ts`).
  - `ipc/`: Explicit handlers per domain (`artists`, `posts`, `files`).
  - `services/`: Business logic (`sync-service` for Rule34 API, `updater`, `secure-storage`).
- **src/renderer**: Frontend UI.
  - `components/`: Atomic components & Dialogs.
  - `pages/`: Route views (`Browse`, `ArtistDetails`, `Settings`).
  - `store/`: Zustand global state (`viewerStore`).
  - `lib/hooks/`: React hooks (`useAppUpdater`, `useDebounce`).
- **drizzle/**: SQL migrations.
- **scripts/**: CI/CD and AI utility scripts.

## Active Rules

1. **IPC Security**: All IPC channels must use Zod validation (defined in `ipc/handlers`).
2. **Data Flow**: Main Process -> DB Worker -> Repository -> Service -> IPC -> Renderer.
3. **Styles**: Tailwind CSS + Shadcn/UI.
4. **Portable Mode**: The app detects `PORTABLE_EXECUTABLE_DIR`. If present, `userData` is set relative to the executable. Auto-updates are disabled for Portable builds (User is redirected to GitHub).
5. **AI Context**: Always run `npm run ctx:gen` before a major task.

## Memory Bank (Recent Decisions)

- **2025-12-18 [Updater]**:
  - Portable users get a "Download from GitHub" button instead of auto-update.
  - `updater-service` sends `isPortable` flag to UI.
- **2025-12-18 [Paths]**:
  - Fixed `userData` path resolution to support both Installer (%APPDATA%) and Portable (local folder) modes correctly using `process.env.PORTABLE_EXECUTABLE_DIR`.
- **2025-12-18 [Types]**:
  - `renderer.d.ts` manually mirrors `bridge.ts` API surface to ensure type safety in components.

## Current Focus (Status: Active Dev)

- [x] Fix "Hanging" Updater in Dev mode.
- [x] Implement Adaptive Updater UI (Portable vs Installer).
- [ ] **Critical Refactor**: Check `src/main/ipc/handlers/files.ts` for path safety (ensure it respects the new `userData` logic and doesn't hardcode paths).
- [ ] Fix: Sync Service race conditions.
