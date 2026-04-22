# 🚀 Roadmap

This document reflects the current roadmap for RuleDesk `v11.x` and is aligned with `README.md`.

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
- ✅ Database is optimized for scale: WAL mode, FTS5, composite indexes, and migration workflow.

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

### C. Layout Consistency - Medium Priority

**Current state:** 🟡 partially implemented

- ✅ Sidebar/top-bar architecture is in place.
- ⏳ Final label/structure consistency across sections.
- ⏳ Masonry mode currently falls back to grid behavior in some contexts.

## 📰 Subscriptions / Updates

### Feed Enhancements

**Current state:** 🟡 partially implemented

- ✅ Per-post viewed state updates.
- ⏳ Batch "mark all as read".
- ⏳ Dedicated creators tab with counters and quick actions.

### Sync Scheduling

**Current state:** ❌ planned

- ❌ Auto-sync on startup.
- ❌ Periodic sync interval scheduler.

## 🛡️ Security & Reliability (Hardening)

### Already Done

- ✅ API key never returned to renderer (`hasApiKey` only).
- ✅ Credentials encrypted at rest via Electron `safeStorage`.
- ✅ Backup/restore with integrity verification.
- ✅ Sequential maintenance queue for DB operations.

### Next Hardening Steps

- ⏳ Backup retention policy (keep last N backups).
- ⏳ Scheduled maintenance runs.
- 🟡 Anti-bot randomization parity across all providers.

## 📋 Milestones

### M1 - Stabilized Core (Done)

- Security boundary, provider pattern, playlists/download/favorites, and backup flow are shipped.

### M2 - UX Parity (In Progress)

- Cross-page filter parity.
- Viewer/galleries polish parity.
- Updates feed quality-of-life improvements.

### M3 - Automation and Reliability (Planned)

- Auto-sync scheduler.
- Maintenance automation.
- Backup retention policy.

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
- Optional dual-mode experience (library + integrated browser workflows).
- Analytics/statistics dashboard for sync and collection insights.

---

## 📝 Notes

- This file is strategic and should not duplicate implementation details from every module.
- Implementation truth source remains code + release tags; this file tracks priority direction.
