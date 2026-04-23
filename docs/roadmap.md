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

- ✅ Global top bar exists and is used across core pages (includes `SyncStatusBadge`).
- ✅ `FiltersPanel`: rating (S/Q/E), AI, media, source, sort-by date; wired to `searchStore` and post pipelines.
- 🟡 On **Browse**, Favorites/Subscriptions source toggles stay disabled until at least one tag is in the search box (`SourceSwitcher` + `hasActiveSearch`) — intentional, but a UX tradeoff.
- ⏳ **Date range** filter (by `publishedAt` / “posted between …”) — not in `searchStore` or UI.
- ⏳ **Disabled filter placeholders** in panel: sort by **score** / “most viewed”, **horizontal/vertical** orientation (UI present, not implemented).
- ⏳ “One story” between raw tag query string and filter panel in every edge case (mostly aligned; worth regression passes).

### B. Viewer and Gallery Polish - High Priority

**Current state:** 🟡 polish / edge cases

- ✅ **Tags drawer** (`ViewerDialog` / `TagsDrawer`): click to **include** tag in query, **right-click** to **exclude**; green/red ring styling and `aria-pressed` for include vs exclude state (see `useSearchStore` `addIncludeTag` / `addExcludeTag`).
- ✅ **Progressive stills in grid:** `PostCard` promotes **preview → sample** when the card enters the viewport (image decode + deduped URLs); videos use separate hover/preview behavior.
- ⏳ Card/overlay consistency on special surfaces (e.g. playlist-only affordances) if any remain.

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
- 🟡 **Masonry** is implemented as CSS **multi-column** flows on several pages; **grid** uses `VirtuosoGrid` — different performance characteristics on huge lists, not a silent “fallback to grid” in the same code path.

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

- ⏳ **User-configurable backup retention** (expose “keep last N” or similar; today fixed at 5 in `MaintenanceController`).
- ✅ **Shared request pacing / UA rotation** via `ProviderThrottle` in `Rule34Provider` and `GelbooruProvider` (tune as new sites are added).
- ⏳ Optional: richer scheduled maintenance (user-visible schedule / explicit `VACUUM` policy); today lightweight `wal_checkpoint` + `optimize` runs are automatic.

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- Filter parity: **date range**, enabling disabled sort/orientation options, Browse **source** UX.
- Gallery/viewer: edge-case polish; core **TagsDrawer** and **PostCard** progressive loading are shipped.
- Updates feed QoL largely shipped (Creators tab, mark all read); further polish as needed.

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
- Deeper **analytics** (e.g. per-run sync health, history, not only the shipped **Statistics** page that summarizes local DB counts — see `StatsPage`, `getStats`).

---

## Not implemented (known gaps)

Authoritative source remains the codebase; this list is for planning and doc parity.

| Area | Gap (verified against `main` in repo) |
|------|----------------------------------------|
| **Filters** | **Date range** (posted-between) not implemented. **Sort by score / most viewed** and **orientation** (horizontal/vertical) exist in `FiltersPanel` as **disabled** placeholders. On Browse, **Favorites/Subscriptions** require an active tag search (by design). |
| **Viewer / tags** | — (include/exclude, right-click, and ring styling are implemented in `TagsDrawer` inside `ViewerDialog`.) |
| **Gallery** | **Progressive stills** implemented in `PostCard` (viewport + load sample). Remaining gaps only if a surface bypasses `PostCard` or for niche media edge cases. |
| **Layout / nav** | Sidebar/section **labels and structure** vs. older spec; optional UX tweaks. **Sync** is on the top bar (`SyncStatusBadge`). |
| **Masonry** | **Columns-based** masonry vs **Virtuoso** grid — different performance model on very long feeds. |
| **Providers** | New booru backends must implement throttling coherently; Rule34 + Gelbooru share `ProviderThrottle`. |
| **Backups** | **User-configurable** “keep last N” / disk budget (rotation count fixed in main process). |
| **Developer experience** | Main process **HMR / auto-restart** in dev. |
| **Engineering** | **Centralized validation helpers** in main; optional **video decode / GPU** tuning. |
| **Product** | **Smart Collections AI** — research (`Product_Strategy.md`). **Richer sync analytics** than the current **Statistics** page (`/stats`, local aggregates). |

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
