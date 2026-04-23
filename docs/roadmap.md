# 🚀 Roadmap

This document reflects the current roadmap for RuleDesk `v12.x` and is aligned with `README.md` and `package.json` (see `version`).

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
- ✅ **Backup retention:** after each successful backup, older files are pruned — **last 5** timestamped backups kept (not user-configurable in the UI).

---

## 🚀 Active Roadmap (Priority Tasks)

The short version: the core product is shipped, now we focus on parity gaps and polish.

## 🧭 Navigation & UX Revamp

### A. Filters (Advanced Search) - High Priority

**Current state:** 🟡 partially implemented

- ✅ Global top bar exists and is used across core pages (includes `SyncStatusBadge`).
- ✅ `FiltersPanel`: AI, media, source; wired to `searchStore` and post pipelines.
- ✅ **Browse → Source (Favorites / Subscriptions):** requires at least one tag in the search box — **intentional** (subscriptions/favorites are interpreted in the context of a tag query against cached + API flows). Treated as **closed**; not a gap (see [Closed by design](#closed-by-design-not-backlog)).
- ✅ Search is chip-based and supports include/exclude, OR-groups, wildcard/fuzzy token forms (`*`, `~`) in query tokens.

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

### D. Navigation, layout, shell

- ✅ **App shell** — `AppLayout` with **sidebar** (primary navigation) and **global top bar** (`GlobalTopBar`: search, filters, sort, grid/masonry, `SyncStatusBadge`). Routes and layout are **complete** for the shipped feature set.
- 🟡 **Optional polish (backlog, not “missing v1”):** clearer **labels** and **grouping** in the sidebar (e.g. Discover vs Library vs System), **tooltips** for dense controls, **order** of items if it improves first-run discoverability, density on small windows. This is **UX refinement** on the current structure — we are **not** tracking alignment to an obsolete written wireframe; the product is what ships in the build.
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

- ⏳ **User-configurable backup retention** (expose “keep last N” or similar; today fixed at 5 in `MaintenanceController`).
- ✅ **Shared request pacing / UA rotation** via `ProviderThrottle` in `Rule34Provider` and `GelbooruProvider` (tune as new sites are added).
- ⏳ Optional: richer scheduled maintenance (user-visible schedule / explicit `VACUUM` policy); today lightweight `wal_checkpoint` + `optimize` runs are automatic.

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- Filter parity: keep panel aligned to **AI/media/source** scope; **Settings** page redesign (see [Planned product work](#planned-product-work)).
- Gallery/viewer: edge-case polish; core **TagsDrawer** and **PostCard** progressive loading are shipped.
- Updates feed QoL largely shipped (Creators tab, mark all read); further polish as needed.

### M3 - Automation and Reliability (Largely Done)

- ✅ Auto-sync on startup and periodic sync scheduler.
- ✅ Lightweight automatic DB maintenance (checkpoint + optimize).
- ✅ Fixed backup file retention (last 5); user-facing retention policy still open.

## 🔧 Technical Improvements (From Audit) & DX

- ✅ **Testing:** Vitest + Playwright, `better-sqlite3` ABI switching for `pretest`/`posttest` — operational.
- ⏳ **Main process dev experience:** renderer has Vite HMR; **main** still needs a **manual restart** (or a watcher that restarts Electron) when changing IPC, services, or DB code. Improves iteration time for backend-heavy work.
- ⏳ **Shared validation in Main:** Zod is per-handler; extracting **reusable schemas / helpers** for common IPC patterns reduces drift and duplicate error messages.
- ⏳ **Video pipeline:** optional flags or validation for **hardware decode**, `<video>` attributes, and platform-specific quirks; today behavior is “works by default” without a formal tuning pass.
- ⏳ **Tooling / hygiene:** keep `validate` (typecheck, lint, asset checks) green; optional stricter policy on logging and IPC surface over time.

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
| **Statistics — additional metrics (same feature)** | **No** separate “analytics” product. Keep **one** **Statistics** area (`/stats`, `getStats`, `StatsPage`) and **extend** it with **more aggregate metrics** as needed: e.g. **cache** footprint vs **DB** size, **per-provider** post counts, **storage** by category, simple **top tags** or time-sliced **counts** — all read-only rollups, same page pattern. Implementation = extra SQL/aggregates + IPC fields + UI cards/charts. |

---

## Backlog: not implemented yet

| Area | What is still open |
|------|--------------------|
| **Filters** | Keep filter scope lean (`AI`, `Media`, `Source`) and avoid reintroducing removed panel controls without product decision. |
| **Search** | Continue polish/regression coverage for chip-based syntax (`-tag`, OR groups, wildcard/fuzzy). |
| **Navigation & layout** | **Optional** polish: sidebar labels/grouping, tooltips, order, small-window density (see [Navigation, layout, shell](#d-navigation-layout-shell)). |
| **Backups** | **User setting** for retention (“keep last N” or max MB). |
| **Engineering** | [Technical Improvements & DX](#-technical-improvements-from-audit--dx): main **restart in dev**, **shared** validation helpers, **video** tuning. |
| **Product** | **Smart Collections AI** (research). **Statistics** — [additional metrics](#planned-product-work) on the existing page (not a new analytics area). |

**Providers:** new sites must implement **`ProviderThrottle`**-class behavior; Rule34 and Gelbooru already share `ProviderThrottle` — not a “gap” unless adding a **third** backend.

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
