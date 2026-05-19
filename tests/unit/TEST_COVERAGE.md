# Test Coverage Summary

## Overview

Vitest covers unit logic, integration flows (IPC + SQLite), and property-based fuzzing. As of the v16.2.x post-audit suite, the default `npm test` run executes **140 tests** across **20 files** (unit + integration + property).

## Test files (unit)

| File | Tests | Area |
|------|-------|------|
| `hooks/useGalleryInfiniteScroll.test.ts` | 7 | Infinite scroll pagination |
| `hooks/useWorkerFilteredPosts.test.ts` | 7 | Worker post → Post field mapping |
| `lib/filter-utils.test.ts` | 29 | AI tags, video detection |
| `utils/decrypted-credentials.test.ts` | 7 | API key decrypt fail-safe |
| `core/di-container.test.ts` | 6 | DI token.id Map keys |
| `components/filters/SourceSwitcher.test.ts` | 8 | Source filter |
| `components/filters/FilterToggleGroup.test.ts` | 8 | Toggle group |
| `components/layout/GridContainer.test.ts` | 8 | Grid/masonry layout |
| `components/PostCard/viewType.test.ts` | 9 | PostCard view modes |
| `components/IntersectionObserver.test.ts` | 11 | Scroll sentinel |
| `components/VirtuosoGrid-totalCount.test.ts` | 5 | Virtualized grid |
| `controllers/posts-tag-query.test.ts` | 5 | Tag query helpers |
| `store/searchStore.test.ts` | 3 | Search store |

## Other Vitest suites

| Suite | Location | Tests (approx.) |
|-------|----------|-----------------|
| Integration | `tests/integration/` | 16 |
| Property / fuzzing | `tests/property/fuzzing.test.ts` | 12 |

### Post-audit integration additions

| File | Tests | Area |
|------|-------|------|
| `controllers/ArtistsController.limit.test.ts` | 1 | `MAX_TRACKED_ARTISTS` truncation |
| `services/SyncService.queue.test.ts` | 1 | `runExclusive` repair queue |

## Running tests

```bash
npm test                              # all Vitest suites + Electron ABI restore
npm test -- tests/unit                # unit only
npm test -- tests/integration         # integration only
npm test -- tests/property            # property only
npm run test:coverage                 # with v8 coverage report
npm run test:verify                   # validate + all tests + ABI restore
```

## Approach

- Vitest node environment
- Logic-first tests; minimal React rendering
- Integration tests use in-memory SQLite (`tests/helpers/mock-db.ts`)
- Property tests guard schema and SQL escaping invariants
- Post-audit: pure `mapWorkerPostToPost()` in `src/renderer/lib/map-worker-post.ts` (tested without Web Worker)

## Future improvements

1. Component rendering tests with `@testing-library/react` (optional)
2. Broader IPC contract tests via shared Zod schemas
3. Visual regression for masonry/grid layouts (Playwright)
