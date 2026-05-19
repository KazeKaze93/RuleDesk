# Unit & Property Tests

Vitest tests for gallery logic, filters, layout, and shared utilities. Property-based fuzzing lives in `tests/property/`.

## Layout

| Path | Focus |
|------|--------|
| `tests/unit/` | Unit tests (hooks, components logic, utilities) |
| `tests/property/` | Property-based tests (`fast-check`) — e.g. `escapeLikePattern`, Zod schemas |
| `tests/integration/` | IPC controllers & services (see integration folder) |

## Coverage highlights

### Hooks

- **`useGalleryInfiniteScroll.test.ts`** — pagination for local DB vs external API

### Components

- **`SourceSwitcher.test.ts`**, **`FilterToggleGroup.test.ts`** — filter toggles
- **`GridContainer.test.ts`**, **`PostCard/viewType.test.ts`** — grid vs masonry
- **`IntersectionObserver.test.ts`** — infinite-scroll sentinel
- **`VirtuosoGrid-totalCount.test.ts`** — virtualized grid sizing

### Utilities

- **`filter-utils.test.ts`** — AI tag detection, video file detection
- **`posts-tag-query.test.ts`** — tag query helpers
- **`utils/decrypted-credentials.test.ts`** — `getDecryptedCredentialsStrict`, `CredentialDecryptionError` (no ciphertext fallback)

### Core (Main)

- **`core/di-container.test.ts`** — `Container` keyed by `token.id`; re-entrant circular detection

### Worker mapping

- **`hooks/useWorkerFilteredPosts.test.ts`** — `mapWorkerPostToPost()` preserves `mediaType`, `viewCount`, `lastViewedAt`

### Property (`tests/property/fuzzing.test.ts`)

- SQL `LIKE` escaping invariants
- `AddArtistSchema` / provider / artist-type validation under random input

## Running tests

```bash
# Full Vitest suite (unit + integration + property)
npm test

# Unit tests only
npm test -- tests/unit

# Property tests only
npm test -- tests/property

# Single file
npm test -- tests/unit/lib/filter-utils.test.ts

# Watch / coverage (rebuilds better-sqlite3 for Node first)
npm run test:watch
npm run test:coverage
```

`npm run test:run` is equivalent to the Vitest portion of `npm test` but skips the posttest Electron rebuild.

## Conventions

- Vitest **node** environment (see `vitest.config.ts`)
- Prefer testing pure logic without React rendering
- Mock Electron/native deps where needed
- AAA pattern (Arrange, Act, Assert)

For integration IPC/SQLite tests (artist limit, sync queue), see [`tests/integration/README.md`](../integration/README.md).

For the full suite inventory (**140** tests), see [`TEST_COVERAGE.md`](./TEST_COVERAGE.md).

For E2E workflows, see `tests/e2e/README.md` and Playwright specs.
