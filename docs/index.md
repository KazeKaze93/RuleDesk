# Documentation Index

Welcome to the RuleDesk documentation. This index provides a structured navigation guide to all documentation resources.

## 📚 Documentation Structure

### Getting Started

**Start here if you're new to RuleDesk:**

1. **[README.md](../README.md)** - Main entry point with overview, features, and quick start guide
2. **[Glossary](./glossary.md)** - Key terms and concepts used throughout the documentation

### User Guides

**For end users:**

- **[User Guide](./user-guide.md)** - Complete guide for end users (start here!)
  - [Installation](./user-guide.md#installation) - How to install RuleDesk
  - [First Launch](./user-guide.md#first-launch) - Getting started
  - [Basic Usage](./user-guide.md#basic-usage) - Adding artists, syncing, viewing posts
  - [Features](./user-guide.md#features) - Search, favorites, downloads, filters
  - [Troubleshooting](./user-guide.md#troubleshooting) - Common problems and solutions
- **[README.md - Quick Start](../README.md#-quick-start)** - Fast launch checklist
- **[README.md - Features](../README.md#-features)** - Complete feature list

### External API Reference

- **[Rule34 API Reference](./rule34-api-reference.md)** - Unofficial Rule34.xxx API documentation
  - [API Keys](./rule34-api-reference.md#api-keys) - Requesting and managing API keys
  - [Endpoints](./rule34-api-reference.md#endpoints) - Available API endpoints
  - [Pagination beyond the offset cap](./rule34-api-reference.md#pagination-beyond-the-offset-cap) - Browse cursor pagination (`id:<postId>`)
  - [Best Practices](./rule34-api-reference.md#best-practices-and-cautions) - Rate limiting, caching, security

### Planning & Roadmap

- **[Roadmap](./roadmap.md)** - Development roadmap and planned features
  - [Active Roadmap](./roadmap.md#-active-roadmap-priority-tasks) - Current priority tasks
  - [Milestones](./roadmap.md#-milestones) - MVP and future phases
  - [Technical Improvements](./roadmap.md#-technical-improvements-from-audit--dx) - Planned technical enhancements
  - [Backlog (not implemented yet)](./roadmap.md#backlog-not-implemented-yet) - Open items and [planned product work](./roadmap.md#planned-product-work)
- **[Features.md](../Features.md)** (repository root) - Concise feature priority list (P1 / P2)
- **[Product Strategy](../Product_Strategy.md)** (repository root) - Long-term product positioning and research pillars

---

## 🗺️ Navigation Guide

### By Role

#### I'm a User
1. Start with [User Guide](./user-guide.md)
2. Use [README.md - Quick Start](../README.md#-quick-start) for first launch
3. Configure app via [README.md - Settings](../README.md#-settings)
4. Check [README.md - Sync & Background](../README.md#-sync--background) for sync behavior
5. If anything is unclear, open [Glossary](./glossary.md)

### By Topic

#### Setup & First Launch
- [README.md - Quick Start](../README.md#-quick-start) - Launch checklist
- [User Guide - First Launch](./user-guide.md#first-launch) - Initial onboarding steps
- [README.md - Settings](../README.md#-settings) - Core configuration

#### Daily Usage
- [User Guide - Basic Usage](./user-guide.md#basic-usage) - Artists, browsing, viewer
- [README.md - Sync & Background](../README.md#-sync--background) - Sync behavior and timing
- [README.md - Features](../README.md#-features) - Full capability map

#### Safety & Troubleshooting
- [User Guide - Troubleshooting](./user-guide.md#troubleshooting) - Common issues
- [README.md - License & Legal](../README.md#-license--legal) - Legal boundaries
- [Glossary](./glossary.md) - Terminology reference

---

## 🔗 Quick Links

### End User Essentials
- [Quick Start Guide](../README.md#-quick-start) - Get started in 5 minutes
- [User Guide](./user-guide.md) - End-to-end usage walkthrough
- [Glossary](./glossary.md) - Key terms and concepts

### Product & Planning
- [Roadmap](./roadmap.md) - Priorities and delivery track
- [Features.md](../Features.md) - Current feature priority short-list
- [Product Strategy](../Product_Strategy.md) - Long-term direction

---

## 🛠️ Maintainer Appendix

Engineering materials are intentionally grouped here to keep the top-level index user-first.

- [Architecture Documentation](./architecture.md) - System architecture and boundaries
- [API Reference (generated)](./api.md) - IPC channel table from `channels.ts` + handlers (`npm run docs:api`)
- [API Guide](./api-guide.md) - IPC usage patterns, examples, security narrative
- [API channel notes](./api-notes/) - Optional human notes merged into the generated reference
- [Database Documentation](./database.md) - Schema, migrations, and operational notes
- [Rule34 API Reference](./rule34-api-reference.md) - External API specifics
- [README — Development Setup](../README.md#-development-setup) - Local dev, quality gates, testing, CI/CD
- [Unit test guide](../tests/unit/README.md) - Vitest unit/property test layout
- [Test coverage summary](../tests/unit/TEST_COVERAGE.md) - Suite inventory (**209** Vitest tests across 30 files)
- [Integration test notes](../tests/integration/README.md) - IPC + SQLite integration tests
- [.cursorrules](../.cursorrules) - Engineering standards (includes English-only UI copy; no i18n stack)
- [Canonical Lessons](../.ai/LESSONS.txt) - Reusable invariants (do not add root `LESSONS.md`)

### Quality gates (local & CI)

| Step | Command |
|------|---------|
| Typecheck + lint + img policy | `npm run validate` |
| IPC API docs freshness | `npm run docs:api` (CI: then `git diff --exit-code docs/api.md`) |
| All Vitest suites (209 tests) | `npm test` |
| Pre-PR full gate | `npm run test:verify` |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` |

CI (`.github/workflows/ci.yml`) runs **validate**, **docs:api freshness**, **npm test**, production audit, then **E2E**; tagged releases also require e2e to pass, then publish **Windows zip** and **Linux AppImage** (macOS binaries are not distributed — see [user guide — Installation](./user-guide.md#installation)).

---

## 📖 Document Relationships

```
README.md (Entry Point)
├── Quick Start → User Guide
├── Features → Glossary
├── Architecture → Architecture Documentation
└── Documentation → This Index

Architecture Documentation
├── Security → .cursorrules / Architecture
├── Database → Database Documentation
└── IPC → API Reference (generated) + API Guide

API Reference (docs/api.md, generated)
├── Channel notes → docs/api-notes/
└── Narrative → API Guide (docs/api-guide.md)

API Guide
├── Implementation → Architecture Documentation
└── External API → Rule34 API Reference

Database Documentation
├── Schema → Architecture Documentation
└── Migrations → README Development Setup

Roadmap
└── All documents (references features and improvements)
```

---

## 🆘 Need Help?

1. **Check the Glossary** - [Glossary](./glossary.md) defines all key terms
2. **Search Documentation** - Use your editor's search to find specific topics
3. **Review Examples** - Each document includes code examples
4. **Check Roadmap** - [Roadmap](./roadmap.md) shows planned features and improvements

---

## 📝 Documentation Maintenance

This documentation is maintained alongside the codebase. When making changes:

1. **Update relevant docs** - Keep documentation in sync with code changes
2. **Add cross-references** - Link related sections using markdown links
3. **Update glossary** - Add new terms to [Glossary](./glossary.md)
4. **Keep lessons canonical** - Update [`.ai/LESSONS.txt`](../.ai/LESSONS.txt) for reusable engineering invariants
5. **Check links** - Verify all internal links work correctly
6. **IPC reference** - After channel/handler changes, run `npm run docs:api` and commit `docs/api.md` (do not hand-edit)
7. **UI copy** - App is English-only; do not reintroduce i18n libraries or locale JSON packs

---

**Last Updated:** July 2026 — Audit v17 pack complete: PRs #105–#115 (including P0 video-cache #114 and sync-cursor #115). See [roadmap — branch tracking](./roadmap.md#-technical-improvements-from-audit--dx). Vitest **209** / **30** files (`npm run test:run`).

