# 🚀 Roadmap

This document reflects the current roadmap for RuleDesk `v16.x` and is aligned with `README.md` and `package.json` (see `version`).

## 📑 Table of Contents

- [Recent Fixes & Current Status](#-recent-fixes--current-status-completed)
- [Active Roadmap](#-active-roadmap-priority-tasks)
- [Navigation & UX Revamp](#-navigation--ux-revamp)
- [Subscriptions / Updates](#-subscriptions--updates)
- [Security & Reliability](#-security--reliability-hardening)
- [Milestones](#-milestones)
- [Technical Improvements & DX](#-technical-improvements-from-audit--dx)
- [Architecture Considerations](#-architecture-considerations)
- [Long-Term Goals](#-long-term-goals-future-considerations)
- [Closed by design (not backlog)](#closed-by-design-not-backlog)
- [Planned product work](#planned-product-work)
- [Backlog: not implemented yet](#backlog-not-implemented-yet)

---

## ✅ Recent Fixes & Current Status (COMPLETED)

- ✅ Core architecture is stable: Electron Main/Renderer separation, typed IPC, secure credential storage.
- ✅ Multi-provider support is in production (`Rule34Provider`, `GelbooruProvider`).
- ✅ Playlists, favorites, downloads, backup/restore, and full-screen viewer are implemented.
- ✅ Playlists now include import/export, manual drag-and-drop reorder, and smart hybrid local+remote resolution.
- ✅ Database is optimized for scale: WAL mode, FTS5, composite indexes, and migration workflow.
- ✅ **Sync automation:** auto-sync on startup, periodic background sync (presets in Settings, minimum interval enforced in `SyncScheduler`), and sync scheduler restart when settings are saved.
- ✅ **DB maintenance:** passive `WAL` checkpoint + `PRAGMA optimize` after startup (delayed) and on a daily timer (`MaintenanceScheduler`).
- ✅ **Backup retention:** after each successful backup, older files are pruned based on `backupRetention` from Settings (`1..20`).
- ✅ **User-visible DB maintenance:** Settings now exposes VACUUM status (last run timestamp/status/error), manual trigger, and schedule (`manual` / `weekly` / `monthly`).
- ✅ **Post-audit hardening (v16.2.x):** shared credential decrypt helper (no ciphertext fallback on IPC paths), `SyncService.runExclusive` queue for sync/repair, `MAX_TRACKED_ARTISTS` (5000) cap, stable Virtuoso list components, Browse worker error UI, worker `mapWorkerPostToPost` field preservation, DI container keyed by `token.id`, orientation filter removed (dead code). See [Architecture](./architecture.md) and [TEST_COVERAGE.md](../tests/unit/TEST_COVERAGE.md).

---

## 🚀 Active Roadmap (Priority Tasks)

The short version: the core product is shipped, now we focus on parity gaps and polish.

## 🧭 Navigation & UX Revamp

### A. Filters (Advanced Search) - High Priority

**Current state:** ✅ implemented, ongoing regression/polish

- ✅ Global top bar exists and is used across core pages (includes `SyncStatusBadge`).
- ✅ `FiltersPanel`: AI, media, source; wired to `searchStore` and post pipelines.
- ✅ **Browse → Source (Favorites / Subscriptions):** requires at least one tag in the search box — **intentional** (subscriptions/favorites are interpreted in the context of a tag query against cached + API flows). Treated as **closed**; not a gap (see [Closed by design](#closed-by-design-not-backlog)).
- ✅ Search is chip-based and supports include/exclude, OR-groups, wildcard/fuzzy token forms (`*`, `~`) in query tokens.

### B. Viewer and Gallery Polish - High Priority

**Current state:** 🟡 polish / edge cases

- ✅ **Tags drawer** (`ViewerDialog` / `TagsDrawer`): click to **include** tag in query, **right-click** to **exclude**; green/red ring styling and `aria-pressed` for include vs exclude state (see `useSearchStore` `addIncludeTag` / `addExcludeTag`).
- ✅ **Progressive stills in grid:** `PostCard` promotes **preview → sample** when the card enters the viewport (image decode + deduped URLs); videos use separate hover/preview behavior.
- ⏳ Card/overlay consistency on special surfaces (e.g. playlist-only affordances) if any remain.

### C. Playlists & Collections - Implemented, Minor Polish

**Current state:** ✅ implemented (core + transfer + ordering)

- ✅ Full CRUD for manual and smart playlists.
- ✅ Smart playlists use hybrid local DB + remote API query resolution with merge/dedup.
- ✅ Manual playlists support drag-and-drop ordering (`position`-based sorting).
- ✅ Playlist transfer is available via export/import (`.ruledesk-playlist.json`).
- ✅ Transfer/error flows and empty-state guidance are implemented (import/export outcomes and empty list states in UI).
- ⏳ Minor visual/interaction polish may continue as routine UX refinement.

### D. Navigation, layout, shell

- ✅ **App shell** — `AppLayout` with **sidebar** (primary navigation) and **global top bar** (`GlobalTopBar`: search, filters, sort, grid/masonry, `SyncStatusBadge`). Routes and layout are **complete** for the shipped feature set.
- ✅ Sidebar information architecture includes grouped sections (**Discover / Library / System**).
- 🟡 **Optional polish (backlog, not “missing v1”):** additional tooltips for dense controls, item order tweaks for first-run discoverability, and density tuning on small windows. This is **UX refinement** on the current structure — we are **not** tracking alignment to an obsolete written wireframe; the product is what ships in the build.
- ✅ **Masonry vs grid** — two explicit modes; **closed** as a gap ([Closed by design](#closed-by-design-not-backlog)).

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

- ✅ **User-configurable backup retention** is shipped (`settings.backupRetention`, range `1..20`, applied in `MaintenanceController` cleanup).
- ✅ **Shared request pacing / UA rotation** via `ProviderThrottle` in `Rule34Provider` and `GelbooruProvider` (tune as new sites are added).
- ✅ Explicit VACUUM policy is shipped (manual run + persisted schedule + last-run telemetry in Settings).

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- ✅ Filter panel is aligned to **AI/media/source** scope.
- ⏳ Settings page redesign (see [Planned product work](#planned-product-work)) remains product-driven.
- Gallery/viewer: edge-case polish; core **TagsDrawer** and **PostCard** progressive loading are shipped.
- Updates feed QoL largely shipped (Creators tab, mark all read); further polish as needed.

### M3 - Automation and Reliability (Largely Done)

- ✅ Auto-sync on startup and periodic sync scheduler.
- ✅ Lightweight automatic DB maintenance (checkpoint + optimize).
- ✅ Backup file retention is configurable in Settings (`backupRetention`, bounded `1..20`) and enforced after each successful backup.

## 🔧 Technical Improvements (From Audit) & DX

- ✅ **Testing:** Vitest (unit, integration, property/fuzzing) + Playwright; `test:run` / watch / coverage rebuild `better-sqlite3` for Node before running; `npm test` restores Electron ABI via `posttest`.
- ✅ **CI:** `validate`, `npm test`, and production `npm audit --omit=dev --audit-level=high` on every push/PR; release tags wait for quality + e2e, then publish Windows zip + Linux AppImage (macOS binaries not distributed).
- ✅ **Dependencies:** Removed unused UI packages; `repomix` in devDependencies; security bumps (Electron 39.8.x, drizzle-orm 0.45+, axios, dompurify, react-router-dom).
- ✅ **Main process dev experience:** main sources are watched in development (`electron.vite.config.ts`), closing the previous manual-restart-only loop for routine IPC/service edits.
- ✅ **Shared validation in Main:** IPC controller registration uses typed wrapper handlers; shared tuple parsing helpers in handler modules where appropriate.
- ✅ **Video pipeline baseline:** hardware decode flags and `<video>` attribute tuning landed; remaining work is regression-driven per platform/device.
- ✅ **Post-audit regression tests:** Vitest coverage for decrypt fail-safe, DI token keys, artist list cap, sync/repair serialization, worker post mapping, provider search IPC payload parsing, Rule34 fetch error classification, and tag-resolve dedup (171 tests total).
- ✅ **Provider search errors:** Typed provider failures, IPC-safe serialization, `BrowseErrorState` UI, sync auth → `SYNC.ERROR` (no silent empty Browse on auth/429).
- ⏳ **Tooling / hygiene:** keep `validate` green; optional stricter policy on logging and IPC surface over time. Remaining dev-only audit noise (electron-builder transitive deps) is tracked separately from production `npm audit`.

## 🏗️ Architecture Considerations

- Keep strict Main/Renderer separation.
- Keep synchronous `better-sqlite3` rules (`.run()` for writes, no async transactions).
- Keep typed IPC + Zod boundary validation.
- Preserve behavior during refactors (no business logic regressions).

## 🔮 Long-Term Goals (Future Considerations)

- More **booru providers** (beyond Rule34 + Gelbooru) on `IBooruProvider`.
- **Smart Collections AI** — research; see `Product_Strategy.md`.

---

## Closed by design (not backlog)

| Topic | Status |
|-------|--------|
| **Browse → Source: Favorites / Subscriptions** | Requires a **non-empty tag query** so “favorites” and “subscriptions” are interpreted in context (cached + API). **Working as designed;** not a defect to “fix” unless product explicitly changes the model. |
| **Masonry vs grid** | Two **first-class** view toggles. No silent fallback; no open “masonry not implemented” item. |
| **Viewer tags / progressive cards** | Shipped (`TagsDrawer`, `PostCard`). |

---

## Planned product work

Items explicitly scheduled for product/engineering (beyond small bugs).

| Item | Description |
|------|-------------|

---

## Backlog: not implemented yet

| Area | What is still open |
|------|--------------------|
| **Filters** | Keep filter scope lean (`AI`, `Media`, `Source`) and avoid reintroducing removed panel controls without product decision (**scope is already implemented; this is a guardrail**). |
| **Search** | Continue polish/regression coverage for chip-based syntax (`-tag`, OR groups, wildcard/fuzzy). |
| **Navigation & layout** | **Optional** polish: tooltips, item order tuning, and small-window density improvements (see [Navigation, layout, shell](#d-navigation-layout-shell)). |
| **Backups** | `keep last N` is implemented; optional **total-size cap** is also supported via `BACKUP_RETENTION_MAX_TOTAL_MB` env for deployments that need hard storage ceilings. UI exposure for this cap remains optional future UX work. |
| **Engineering** | [Technical Improvements & DX](#-technical-improvements-from-audit--dx): remaining **shared** validation helper consolidation and ongoing tooling hygiene. |
| **Product** | **Smart Collections AI** (research). |

**Providers:** new sites must implement **`ProviderThrottle`**-class behavior; Rule34 and Gelbooru already share `ProviderThrottle` — not a “gap” unless adding a **third** backend.

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
