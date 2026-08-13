# Test Coverage Summary

## Overview

Vitest covers unit logic, integration flows (IPC + SQLite), and property-based fuzzing. The default `npm test` run executes unit + integration + property suites (`tests/unit`, `tests/integration`, `tests/property`). In-memory DB fixtures live in `tests/helpers/mock-db.ts` and are covered by `tests/unit/helpers/mock-db.test.ts`.

## Test files (unit)

| File | Tests | Area |
|------|-------|------|
| `helpers/mock-db.test.ts` | 3 | Canonical in-memory `createMockDb` (migrations, isolation) |
| `hooks/useGalleryInfiniteScroll.test.ts` | 9 | Real `useGalleryInfiniteScroll` (default + Browse `getSearchBrowseNextPageParam`, 150ms debounce, unmount timer cleanup, `handleAtBottomStateChange`) |
| `hooks/useWorkerFilteredPosts.test.ts` | 7 | Worker post → Post field mapping |
| `lib/filter-utils.test.ts` | 29 | AI tags, video detection |
| `lib/backup-retention-size-cap.test.ts` | 6 | Backup size-cap prune (no over-delete / keep newest over cap) |
| `utils/decrypted-credentials.test.ts` | 10 | API key decrypt fail-safe |
| `utils/parse-credentials.test.ts` | 6 | Credential paste parsing |
| `utils/react-query-cache.test.ts` | 8 | Browse pagination / cursor helpers |
| `core/di-container.test.ts` | 6 | Slim DI registry (`token.id` Map keys) |
| `core/BaseController.collapse-throttle.test.ts` | 6 | Idempotent collapse (full-args hash) + mutate spacing |
| `components/filters/SourceSwitcher.test.tsx` | 8 | Real `SourceSwitcher` (RTL: values, disabled Favorites/Subscriptions) |
| `components/filters/FilterToggleGroup.test.tsx` | 7 | Real `FilterToggleGroup` (RTL: change, disabled + Coming soon, icons) |
| `components/layout/GridContainer.test.tsx` | 5 | Real `createVirtuosoGridFactories` GridContainer (grid-template-columns / columns-N) |
| `components/PostCard/viewType.test.tsx` | 10 | Real `PostCard` viewType classes (`aspect-[2/3]`, `object-contain` / `h-auto`) |
| `components/IntersectionObserver.test.tsx` | 3 | Real `PostCard` video viewport observer (`rootMargin: 100px`, `threshold: 0.01`) |
| `components/VirtuosoGrid-totalCount.test.ts` | 5 | Gallery sources wire `totalCount` to the displayed collection length |
| `controllers/posts-tag-query.test.ts` | 5 | Tag query helpers |
| `store/searchStore.test.ts` | 3 | Search store |
| `shared/provider-search-ipc-payload.test.ts` | 8 | Provider IPC error parsing |
| `shared/autocomplete-label-count.test.ts` | 2 | Rule34 autocomplete `(count)` label parse |
| `lib/filter-artist-autocomplete.test.ts` | 5 | Add Artist artist-only filter (Gelbooru category + Rule34 top-N) |
| `providers/rule34-provider-fetch-posts.test.ts` | 7 | fetchPosts error classification + searchTags live shape (no `type`) |
| `providers/gelbooru-provider-fetch-posts.test.ts` | 8 | Gelbooru fetchPosts 429 / network / parse + empty JSON `[]` + searchTags `category` → `SearchResults.type` |
| `services/tag-resolve-coordinator.test.ts` | 8 | Tag resolve dedup / rate limit + Add Artist user-priority options |
| `services/secure-storage.test.ts` | 3 | `SecureStorage` encrypt/decrypt (sole crypto path) |
| `services/video-proxy-server.test.ts` | 8 | Video proxy allowlist / cache / eviction |
| `providers/throttle.test.ts` | 8 | Priority queue + shared 429 gate + abort dequeue (`vi.useFakeTimers`) |
| `db/sync-status-recovery.test.ts` | 1 | Hard-kill `syncing` → `idle` reset; error rows untouched |
| `features/viewer/buildViewerOriginQueryKey.test.ts` | 8 | Viewer origin → React Query key (artist/browse/favorites/playlist/updates) |

## Other Vitest suites

| Suite | Location | Tests |
|-------|----------|-------|
| Integration | `tests/integration/` | 24 |
| Property / fuzzing | `tests/property/fuzzing.test.ts` | 12 |

### Integration highlights

| File | Area |
|------|------|
| `controllers/ArtistsController.limit.test.ts` | `MAX_TRACKED_ARTISTS` truncation |
| `controllers/ArtistsController.test.ts` | Add/update artist IPC |
| `controllers/SearchController.blacklist.test.ts` | Browse blacklist filtering |
| `controllers/SearchController.errors.test.ts` | Network throw skips alias/user: heuristics; genuine `[]` still runs them |
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
3. E2E follow-ups live in [`docs/roadmap.md`](../../docs/roadmap.md) backlog (`global-setup` mtime/hash rebuild-skip; keep `retries: 2` + flaky visibility). Not in this branch.
