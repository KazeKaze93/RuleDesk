# 🚀 Roadmap

This document reflects the current roadmap for RuleDesk `v12.x` and is aligned with `README.md` and `package.json` (see `version`).

## 📑 Table of Contents

- [Recent Fixes & Current Status](#-recent-fixes--current-status-completed)
- [Active Roadmap](#-active-roadmap-priority-tasks)
- [Navigation & UX Revamp](#-navigation--ux-revamp)
- [Subscriptions / Updates](#-subscriptions--updates)
- [Security & Reliability](#-security--reliability-hardening)
- [Milestones](#-milestones)
- [Technical Improvements](#-technical-improvements-from-audit)
- [Architecture Considerations](#-architecture-considerations)
- [Long-Term Goals](#-long-term-goals-future-considerations)

---

## ✅ Recent Fixes & Current Status (COMPLETED)

- ✅ Core architecture is stable: Electron Main/Renderer separation, typed IPC, secure credential storage.
- ✅ Multi-provider support is in production (`Rule34Provider`, `GelbooruProvider`).
- ✅ Playlists, favorites, downloads, backup/restore, and full-screen viewer are implemented.
- ✅ Playlists now include import/export, manual drag-and-drop reorder, and smart hybrid local+remote resolution.
- ✅ Database is optimized for scale: WAL mode, FTS5, composite indexes, and migration workflow.
- ✅ **Sync automation:** auto-sync on startup, periodic background sync (presets in Settings, minimum interval enforced in `SyncScheduler`), and sync scheduler restart when settings are saved.
- ✅ **DB maintenance:** passive `WAL` checkpoint + `PRAGMA optimize` after startup (delayed) and on a daily timer (`MaintenanceScheduler`).
- ✅ **Backup retention:** after each successful backup, older files are pruned — **last 5** timestamped backups kept (not user-configurable in the UI).

---

## 🚀 Active Roadmap (Priority Tasks)

The short version: the core product is shipped, now we focus on parity gaps and polish.

## 🧭 Navigation & UX Revamp

### A. Filters (Advanced Search) - High Priority

**Current state:** 🟡 partially implemented

- ✅ Global top bar exists and is used across core pages.
- ✅ AI/media/source filters and sorting are implemented in main flows.
- ⏳ Full parity of rating/date-range controls across all pages.
- ⏳ Full tag filter panel parity with existing global tag search behavior.

### B. Viewer and Gallery Polish - High Priority

**Current state:** 🟡 partially implemented

- ✅ Viewer shortcuts and core interactions are implemented.
- ⏳ Right-click exclude flow and include/exclude visual indicators in tag drawer.
- ⏳ Complete overlay parity on all gallery card types.
- ⏳ True progressive preview -> sample upgrade in gallery cards.

### C. Playlists & Collections - Implemented, Polish Ongoing

**Current state:** ✅ implemented (core + transfer + ordering)

- ✅ Full CRUD for manual and smart playlists.
- ✅ Smart playlists use hybrid local DB + remote API query resolution with merge/dedup.
- ✅ Manual playlists support drag-and-drop ordering (`position`-based sorting).
- ✅ Playlist transfer is available via export/import (`.ruledesk-playlist.json`).
- ⏳ Additional UX polish for transfer/error states and empty-state guidance.

### D. Layout Consistency - Medium Priority

**Current state:** 🟡 partially implemented

- ✅ Sidebar/top-bar architecture is in place.
- ⏳ Final label/structure consistency across sections.
- ⏳ Masonry mode currently falls back to grid behavior in some contexts.

## 📰 Subscriptions / Updates

### Feed Enhancements

**Current state:** 🟡 polish possible, core done

- ✅ Per-post viewed state updates.
- ✅ **Mark all as read** for the current updates feed.
- ✅ **Creators** tab: list of tracked artists with new-post counts and quick navigation to galleries.

### Sync Scheduling

**Current state:** ✅ implemented

- ✅ **Auto-sync on startup** (toggle in Settings under Sync).
- ✅ **Periodic sync** — interval selected in Settings (Disabled, 15 / 30 / 60 / 120 minutes). Values below the minimum in code are treated as disabled.

## 🛡️ Security & Reliability (Hardening)

### Already Done

- ✅ API key never returned to renderer (`hasApiKey` only).
- ✅ Credentials encrypted at rest via Electron `safeStorage`.
- ✅ Backup/restore with integrity verification.
- ✅ Sequential maintenance queue for DB operations.

### Next Hardening Steps

- ⏳ **User-configurable backup retention** (expose “keep last N” or similar; today fixed at 5 in main process).
- 🟡 Anti-bot randomization parity across all providers.
- ⏳ Optional: richer scheduled maintenance (user-visible schedule / explicit `VACUUM` policy); today lightweight `wal_checkpoint` + `optimize` runs are automatic.

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- Cross-page filter parity.
- Viewer/galleries polish parity.
- Updates feed quality-of-life improvements.

### M3 - Automation and Reliability (Largely Done)

- ✅ Auto-sync on startup and periodic sync scheduler.
- ✅ Lightweight automatic DB maintenance (checkpoint + optimize).
- ✅ Fixed backup file retention (last 5); user-facing retention policy still open.

## 🔧 Technical Improvements (From Audit)

- ✅ Testing architecture (Vitest + Playwright, ABI switching) is operational.
- ⏳ Main-process auto-restart in development (better DX).
- ⏳ Centralized reusable validation utilities in Main process.
- ⏳ Explicit video hardware-acceleration tuning and validation.

## 🏗️ Architecture Considerations

- Keep strict Main/Renderer separation.
- Keep synchronous `better-sqlite3` rules (`.run()` for writes, no async transactions).
- Keep typed IPC + Zod boundary validation.
- Preserve behavior during refactors (no business logic regressions).

## 🔮 Long-Term Goals (Future Considerations)

- Multi-booru expansion beyond current providers.
- Analytics/statistics dashboard for sync and collection insights.

---

## Not implemented (known gaps)

Authoritative source remains the codebase; this list is for planning and doc parity.

| Area | Gap |
|------|------|
| **Viewer / tags** | Right-click exclude in tag drawer; clear include/exclude visual state beyond current click-to-search. |
| **Gallery** | True progressive **preview → sample** upgrade in cards (data model ready; cards do not always upgrade the loaded image). |
| **Top bar & filters** | Consistent **rating** and **date-range** filter wiring on every page; full parity with global tag search in filter panels. |
| **Layout / nav** | Sidebar/section **labels and structure** vs. original spec; **sync status** placement vs. spec. |
| **Masonry** | Implemented as CSS **columns** on some routes without full grid virtualization—large feeds trade memory/scroll behavior vs. `VirtuosoGrid`. |
| **Providers** | **Anti-bot / header** behavior aligned across Rule34, Gelbooru, and future sources. |
| **Backups** | **Configurable** retention count or storage budget (fixed rotation today). |
| **Developer experience** | Main process **HMR / auto-restart** in dev. |
| **Engineering** | **Centralized validation helpers** in main; optional **video decode / GPU** tuning. |
| **Long-term** | More **booru** providers; **analytics** dashboard; **Smart Collections AI** (see `Product_Strategy.md` — research). |

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
