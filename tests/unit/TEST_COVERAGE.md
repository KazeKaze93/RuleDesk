# Test Coverage Summary

## Overview

Vitest covers unit logic, integration flows (IPC + SQLite), and property-based fuzzing. The default `npm test` run executes unit + integration + property suites. Helper suites under `tests/helpers/` and `tests/utils/` are separate and not counted in that total.

## Test files (unit)

| File | Tests | Area |
|------|-------|------|
| `hooks/useGalleryInfiniteScroll.test.ts` | 9 | Real `useGalleryInfiniteScroll` (default + Browse `getSearchBrowseNextPageParam`, 150ms debounce, unmount timer cleanup, `handleAtBottomStateChange`) |
| `hooks/useWorkerFilteredPosts.test.ts` | 7 | Worker post → Post field mapping |
| `lib/filter-utils.test.ts` | 29 | AI tags, video detection |
| `lib/backup-retention-size-cap.test.ts` | 6 | Backup size-cap prune (no over-delete / keep newest over cap) |
| `utils/decrypted-credentials.test.ts` | 10 | API key decrypt fail-safe |
| `utils/parse-credentials.test.ts` | 6 | Credential paste parsing |
| `utils/react-query-cache.test.ts` | 8 | Browse pagination / cursor helpers |
| `core/di-container.test.ts` | 6 | Slim DI registry (`token.id` Map keys) |
| `core/BaseController.collapse-throttle.test.ts` | 6 | Idempotent collapse (full-args hash) + mutate spacing |
| `components/filters/SourceSwitcher.test.ts` | 8 | Source filter |
| `components/filters/FilterToggleGroup.test.ts` | 8 | Toggle group |
| `components/layout/GridContainer.test.ts` | 8 | Grid/masonry layout |
| `components/PostCard/viewType.test.ts` | 9 | PostCard view modes |
| `components/IntersectionObserver.test.ts` | 11 | Scroll sentinel |
| `components/VirtuosoGrid-totalCount.test.ts` | 5 | Virtualized grid |
| `controllers/posts-tag-query.test.ts` | 5 | Tag query helpers |
| `store/searchStore.test.ts` | 3 | Search store |
| `shared/provider-search-ipc-payload.test.ts` | 8 | Provider IPC error parsing |
| `shared/autocomplete-label-count.test.ts` | 2 | Rule34 autocomplete `(count)` label parse |
| `lib/filter-artist-autocomplete.test.ts` | 5 | Add Artist artist-only filter (Gelbooru category + Rule34 top-N) |
| `providers/rule34-provider-fetch-posts.test.ts` | 7 | fetchPosts error classification + searchTags live shape (no `type`) |
| `providers/gelbooru-provider-fetch-posts.test.ts` | 7 | Gelbooru fetchPosts 429 + searchTags `category` → `SearchResults.type` |
| `services/tag-resolve-coordinator.test.ts` | 8 | Tag resolve dedup / rate limit + Add Artist user-priority options |
| `services/secure-storage.test.ts` | 3 | `SecureStorage` encrypt/decrypt (sole crypto path) |
| `services/video-proxy-server.test.ts` | 8 | Video proxy allowlist / cache / eviction |
| `providers/throttle.test.ts` | 8 | Priority queue + shared 429 gate + abort dequeue |
| `db/sync-status-recovery.test.ts` | 1 | Hard-kill `syncing` → `idle` reset; error rows untouched |
| `features/viewer/buildViewerOriginQueryKey.test.ts` | 8 | Viewer origin → React Query key (artist/browse/favorites/playlist/updates) |

## Other Vitest suites

| Suite | Location | Tests |
|-------|----------|-------|
| Integration | `tests/integration/` | 22 |
| Property / fuzzing | `tests/property/fuzzing.test.ts` | 12 |

### Integration highlights

| File | Area |
|------|------|
| `controllers/ArtistsController.limit.test.ts` | `MAX_TRACKED_ARTISTS` truncation |
| `controllers/ArtistsController.test.ts` | Add/update artist IPC |
| `controllers/SearchController.blacklist.test.ts` | Browse blacklist filtering |
| `controllers/SettingsController.test.ts` | Partial settings save |
| `services/SyncService.queue.test.ts` | `runExclusive` — repair after full sync |
| `services/SyncService.test.ts` | Sync pagination, graceful errors, auth → `SYNC.ERROR`, per-artist `syncStatus` / `lastError`, `sync:artist` / repair event order |

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

- Vitest node environment (jsdom only for `useGalleryInfiniteScroll` hook render tests)
- Logic-first tests; hook debounce/unmount coverage renders the real hook via `react-dom` (no `@testing-library/react`)
- Integration tests use in-memory SQLite (`tests/helpers/mock-db.ts`)
- Property tests guard schema and SQL escaping invariants
- Post-audit: pure `mapWorkerPostToPost()` in `src/renderer/lib/map-worker-post.ts` (tested without Web Worker)
- Crypto tested via `SecureStorage` only (`src/main/lib/crypto.ts` removed)

## Future improvements

1. Component rendering tests with `@testing-library/react` (optional)
2. Broader IPC contract tests via shared Zod schemas
3. Visual regression for masonry/grid layouts (Playwright)
