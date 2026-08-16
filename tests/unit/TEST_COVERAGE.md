# Test Coverage Summary

## Overview

Vitest covers unit logic, integration flows (IPC + SQLite), and property-based fuzzing. The default `npm test` run executes `tests/unit`, `tests/integration`, and `tests/property` (see `vitest.config.ts` include). Playwright E2E lives under `tests/e2e/` and is **not** part of `npm test`.

**Count source of truth:** the Vitest summary line (`Test Files` / `Tests`) from `npm test`. This file is a **file inventory**, not a case counter — do not copy totals here.

In-memory DB fixtures live in `tests/helpers/mock-db.ts` and are covered by `tests/unit/helpers/mock-db.test.ts`.

## Test files (unit)

| File | Area |
|------|------|
| `helpers/mock-db.test.ts` | Canonical in-memory `createMockDb` (migrations, isolation) |
| `hooks/useGalleryInfiniteScroll.test.ts` | Real `useGalleryInfiniteScroll` (Browse next-page param, debounce, unmount cleanup) |
| `hooks/useMasonryInfiniteScroll.test.ts` | Real `useMasonryInfiniteScroll` (threshold, debounce, leave-zone re-arm, no at-bottom cascade) |
| `hooks/useWorkerFilteredPosts.test.ts` | Worker post → Post field mapping |
| `lib/filter-utils.test.ts` | AI tag tokens, video URL detection |
| `lib/backup-retention-size-cap.test.ts` | Backup size-cap prune |
| `lib/filter-artist-autocomplete.test.ts` | Add Artist artist-only filter |
| `lib/redact-error.test.ts` | Credential redaction in logged URLs / Axios errors |
| `utils/decrypted-credentials.test.ts` | API key decrypt fail-safe |
| `utils/parse-credentials.test.ts` | Credential paste parsing |
| `utils/react-query-cache.test.ts` | Browse pagination / cursor helpers |
| `core/di-container.test.ts` | Slim DI registry (`token.id` Map keys) |
| `core/BaseController.collapse-throttle.test.ts` | Idempotent collapse (full-args hash) + mutate spacing |
| `components/filters/SourceSwitcher.test.tsx` | Real `SourceSwitcher` (RTL) |
| `components/filters/FilterToggleGroup.test.tsx` | Real `FilterToggleGroup` (RTL) |
| `components/layout/GridContainer.test.tsx` | Real `createVirtuosoGridFactories`: CSS columns masonry + `w-full mb-4 break-inside-avoid` items |
| `components/PostCard/viewType.test.tsx` | Real `PostCard` viewType classes |
| `components/IntersectionObserver.test.tsx` | Real `PostCard` video viewport observer |
| `components/VirtuosoGrid-totalCount.test.ts` | Gallery sources wire `totalCount` to the displayed collection |
| `controllers/posts-tag-query.test.ts` | Tag query helpers |
| `controllers/PostsController.ai-filter.test.ts` | AI filter during FTS bulk-sync window |
| `store/searchStore.test.ts` | Search store |
| `shared/provider-search-ipc-payload.test.ts` | Provider IPC JSON payload / explicit `providerKind` (no copy-matching) |
| `shared/autocomplete-label-count.test.ts` | Rule34 autocomplete `(count)` label parse |
| `providers/rule34-provider-fetch-posts.test.ts` | fetchPosts error classification + searchTags shape |
| `providers/gelbooru-provider-fetch-posts.test.ts` | Gelbooru fetchPosts errors + empty JSON `[]` |
| `providers/assert-cdn-domains-subset.test.ts` | `cdnDomains ⊆ allowedDomains` throw vs live registry |
| `providers/warn-unknown-media-host.test.ts` | Fetch-time unknown-host warn + per-hostname dedup |
| `providers/throttle.test.ts` | Priority queue + 429 gate (`vi.useFakeTimers`) |
| `services/tag-resolve-coordinator.test.ts` | Tag resolve dedup / rate limit |
| `services/search-results-cache.test.ts` | Browse search SQLite TTL cache (found / not_found / unresolved, key isolation, maintenance ms) |
| `services/secure-storage.test.ts` | `SecureStorage` encrypt/decrypt |
| `services/credentials.test.ts` | `getDecryptedApiSettings` fail-closed |
| `services/video-proxy-server.test.ts` | Video proxy allowlist / cache / eviction |
| `db/sync-status-recovery.test.ts` | Hard-kill `syncing` → `idle` reset |
| `db/fts-table-check.test.ts` | `postsFtsTableExists` |
| `db/fts-triggers.test.ts` | FTS5 content-table triggers |
| `features/viewer/buildViewerOriginQueryKey.test.ts` | Viewer origin → React Query key |
| `features/viewer/openViewer-hasNextPage.test.ts` | Gallery `openViewer` passes react-query `hasNextPage`, not count-vs-page-size |
| `features/viewer/gallery-background-scroll-queue.test.ts` | Masonry / local grid infinite scroll use `handleLoadMore` (`appendQueueIds`) |
| `features/viewer/viewer-media-urls.test.ts` | Rule34 image CDN fallback chain includes `api-cdn-mp4` as a source host |
| `ipc/PlaylistController.empty-guard.test.ts` | Playlist FTS empty-guard |

## Other Vitest suites

| Suite | Location |
|-------|----------|
| Integration | `tests/integration/` |
| Property / fuzzing | `tests/property/fuzzing.test.ts` |

### Integration highlights

| File | Area |
|------|------|
| `controllers/ArtistsController.limit.test.ts` | `MAX_TRACKED_ARTISTS` truncation |
| `controllers/ArtistsController.test.ts` | Add/update artist IPC |
| `controllers/SearchController.blacklist.test.ts` | Browse blacklist filtering |
| `controllers/SearchController.errors.test.ts` | Network throw skips alias/user: heuristics; genuine `[]` still runs them |
| `controllers/SearchController.cache.test.ts` | `searchBooru` cache-first: repeat tags+page skips HTTP; 429 not stored as empty; untagged page 2 empty cached, page 1 empty not |
| `db/search-results-cache-migration.test.ts` | `0035` overlay on populated pre-0035 DB; `sqlite_master` table + index |
| `controllers/SettingsController.test.ts` | Partial settings save |
| `controllers/StatsController.timeline.test.ts` | Timeline bucket units |
| `services/SyncService.queue.test.ts` | `runExclusive` — repair after full sync |
| `services/SyncService.test.ts` | Sync pagination, graceful errors, auth → `SYNC.ERROR`, per-artist `syncStatus` / `lastError` |

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

- Vitest default environment is Node; jsdom is opted in per file (`// @vitest-environment jsdom`) for hook and component render tests
- Unit include is `tests/unit/**/*.{test,spec}.{ts,tsx}` so RTL component suites can use JSX
- Component tests import production modules and assert via `@testing-library/react` (DOM/classes/props), not local copies of layout logic
- Hook debounce/unmount coverage renders the real hook via `react-dom`
- Integration tests use in-memory SQLite (`tests/helpers/mock-db.ts`)
- Property tests guard schema and SQL escaping invariants
- Post-audit: pure `mapWorkerPostToPost()` in `src/renderer/lib/map-worker-post.ts` (tested without Web Worker)
- Crypto tested via `SecureStorage` only (`src/main/lib/crypto.ts` removed)

## Future improvements

1. Broader IPC contract tests via shared Zod schemas
2. Visual regression for masonry/grid layouts (Playwright)
3. E2E follow-ups live in [`docs/roadmap.md`](../../docs/roadmap.md) backlog (`global-setup` mtime/hash rebuild-skip; keep `retries: 2` + flaky visibility).
