# 🚀 Roadmap

This document reflects the current roadmap for RuleDesk `v17.x` and is aligned with `README.md` and `package.json` (see `version`).

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
- ✅ **Post-audit hardening (v17.x):** shared credential decrypt helper (no ciphertext fallback on IPC paths), `SyncService.runExclusive` queue for sync/repair, `MAX_TRACKED_ARTISTS` (5000) cap, stable Virtuoso list components, Browse worker error UI, worker `mapWorkerPostToPost` field preservation, DI container keyed by `token.id`, orientation filter removed (dead code). See [Architecture](./architecture.md) and [TEST_COVERAGE.md](../tests/unit/TEST_COVERAGE.md).

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
- ✅ **Periodic sync** — interval selected in Settings (Disabled, 15 / 30 / 60 / 120 minutes). Values below the code minimum (`MIN_INTERVAL_MINUTES = 5`) are treated as disabled.

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
- 🔧 `audit/maintenance-vacuum-queue`: VACUUM joined to `maintenanceQueue` (serialize with backup/restore); status cache while DB closed; auto-backup skips when queue busy. Weekly/monthly VACUUM timer still not wired.

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- ✅ Filter panel is aligned to **AI/media/source** scope.
- ✅ Settings tabbed IA shipped (General / Sync / Appearance / Backup / Account / Blacklist), including Danger-zone wipe.
- Gallery/viewer: edge-case polish; core **TagsDrawer** and **PostCard** progressive loading are shipped.
- Updates feed QoL largely shipped (Creators tab, mark all read); further polish as needed.

### M3 - Automation and Reliability (Largely Done)

- ✅ Auto-sync on startup and periodic sync scheduler.
- ✅ Lightweight automatic DB maintenance (checkpoint + optimize).
- ✅ Backup file retention is configurable in Settings (`backupRetention`, bounded `1..20`) and enforced after each successful backup.

## 🔧 Technical Improvements (From Audit) & DX

### Shipped (Jul 2026 — audit v17 PRs #105–#115)

- ✅ **IPC collapse + throttle** (#105): idempotent handlers collapse by full canonical args hash; mutating handlers space calls (~100ms sleep), never reject with rate-limit errors.
- ✅ **Type assertion policy** (#106): ESLint `no-unsafe-type-assertion` on `src/**`; closed `as` boundary allowlist in `.cursorrules` / LESSONS 3b.
- ✅ **Crypto unify** (#107): single `SecureStorage` path; `src/main/lib/crypto.ts` removed.
- ✅ **DI container slim** (#108): typed instance registry keyed by `token.id` (no dead cycle-detection theater).
- ✅ **Main lifecycle + repo hygiene** (#109): one-shot `before-quit`; idempotent DB close; `coverage/` untracked.
- ✅ **Wipe all data** (#110): `system:wipe-all-data` + Settings → General → Danger zone.
- ✅ **Generated IPC docs** (#111): `npm run docs:api` → `docs/api.md`; CI freshness check; narrative in `docs/api-guide.md`.
- ✅ **English-only UI** (#112): removed `i18next` / `react-i18next` / locale packs; inline literals (+ local constants at 3+ uses).
- ✅ **Docs sync #105–#112** (#113): post-audit documentation alignment.
- ✅ **Video cache integrity** (#114): atomic tmp+rename, abort cleanup, `VIDEO_CACHE_MAX_BYTES` eviction.
- ✅ **Sync cursor integrity** (#115): `lastPostId` / `lastChecked` only after natural pagination end; `lastSyncIncomplete`; network errors rethrow as `ProviderSearchError("network")`.

### Audit v17 — branch tracking (complete)

| # | Branch | PR | Status |
|---|--------|----|--------|
| 1 | `fix/video-cache-integrity` | [#114](https://github.com/KazeKaze93/RuleDesk/pull/114) | ✅ merged |
| 2 | `fix/sync-cursor-integrity` | [#115](https://github.com/KazeKaze93/RuleDesk/pull/115) | ✅ merged |
| 3 | `fix/ipc-collapse-and-throttle` | [#105](https://github.com/KazeKaze93/RuleDesk/pull/105) | ✅ merged |
| 4 | `chore/type-assertion-policy` | [#106](https://github.com/KazeKaze93/RuleDesk/pull/106) | ✅ merged (allowlist + ESLint; residual casts remain under policy) |
| 5 | `refactor/crypto-module-unify` | [#107](https://github.com/KazeKaze93/RuleDesk/pull/107) | ✅ merged |
| 6 | `refactor/di-container-slim` | [#108](https://github.com/KazeKaze93/RuleDesk/pull/108) | ✅ merged |
| 7 | `chore/main-lifecycle-and-repo-hygiene` | [#109](https://github.com/KazeKaze93/RuleDesk/pull/109) | ✅ merged |
| 8 | `feat/settings-wipe-all-data` | [#110](https://github.com/KazeKaze93/RuleDesk/pull/110) | ✅ merged |
| 9 | `dx/ipc-docs-generation` | [#111](https://github.com/KazeKaze93/RuleDesk/pull/111) | ✅ merged |
| 10 | `chore/i18n-removal` | [#112](https://github.com/KazeKaze93/RuleDesk/pull/112) | ✅ merged |
| 11 | `chore/as-assertion-gate-alignment` | [#116](https://github.com/KazeKaze93/RuleDesk/pull/116) | ✅ merged |

Both P0 rows (#1–#2) are closed — the full v17 audit pack landed (after one missed first run and one sync-cursor follow-up). Follow-up gate alignment is #116.

### Follow-up audits (post v17)

| # | Branch | PR | Status |
|---|--------|----|--------|
| 1 | `audit/booru-favorites-warmed-db` | — | started (investigation: UA/Cloudflare hypothesis for empty `sync:booru-favorites` — **refuted**; no favorites sync path in code; README account-favorites claim corrected) |

### Baseline DX (earlier)

- ✅ **Testing:** Vitest (unit, integration, property/fuzzing) + Playwright; ABI rebuild scripts for Node vs Electron.
- ✅ **CI:** `validate` → `docs:api` freshness → `npm test` → production `npm audit --omit=dev --audit-level=high`; release tags wait for quality + e2e, then Windows zip + Linux AppImage.
- ✅ **Post-audit regression tests:** **209** Vitest tests across **30** files (includes collapse/throttle + `SecureStorage` + video-proxy suites — see [`TEST_COVERAGE.md`](../tests/unit/TEST_COVERAGE.md); inventory file may lag — trust `npm test` count).
- ✅ **Main process HMR/watch**, shared Zod IPC helpers, provider search typed errors, video pipeline baseline (`<video>` attrs / hardware decode flags).

- ⏳ **Tooling / hygiene:** keep `validate` green; remaining shared validation consolidation as needed. Dev-only audit noise (electron-builder transitive deps) is separate from production `npm audit`.

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
| **Engineering** | Ongoing tooling hygiene; remaining shared validation consolidation as needed. |
| **Media filters (P3)** | Browse worker video regex (`mp4\|webm\|mov` in `data-processor.worker.ts`) is narrower than canonical `VIDEO_EXTENSIONS` in `src/shared/utils/media.ts` — align when touching the worker. |
| **Product** | **Smart Collections AI** (research). |

**Providers:** new sites must implement **`ProviderThrottle`**-class behavior; Rule34 and Gelbooru already share `ProviderThrottle` — not a “gap” unless adding a **third** backend.

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
