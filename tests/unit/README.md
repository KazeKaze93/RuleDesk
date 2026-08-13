# Unit & Property Tests

Vitest tests for gallery logic, filters, layout, and shared utilities. Property-based fuzzing lives in `tests/property/`.

**Count source of truth:** `npm test` output (`Test Files` / `Tests`). Do not copy totals into this file.

## Layout

| Path | Focus |
|------|--------|
| `tests/unit/` | Unit tests (hooks, RTL components, utilities) |
| `tests/property/` | Property-based tests (`fast-check`) — e.g. `escapeLikePattern`, Zod schemas |
| `tests/integration/` | IPC controllers & services (see integration folder) |

## Coverage highlights

### Hooks

- **`useGalleryInfiniteScroll.test.ts`** — pagination for local DB vs external API
- **`useMasonryInfiniteScroll.test.ts`** — overflow-auto masonry load-more (debounce, ref guard, no Virtuoso at-bottom cascade)

### Components

- **`SourceSwitcher.test.tsx`**, **`FilterToggleGroup.test.tsx`** — real filter toggles (RTL)
- **`GridContainer.test.tsx`**, **`PostCard/viewType.test.tsx`** — grid vs masonry classes from production
- **`IntersectionObserver.test.tsx`** — `PostCard` video viewport observer
- **`VirtuosoGrid-totalCount.test.ts`** — `totalCount` wired to the displayed collection

### Utilities

- **`filter-utils.test.ts`** — AI tag tokens, video file detection
- **`posts-tag-query.test.ts`** — tag query helpers
- **`utils/decrypted-credentials.test.ts`** — `getDecryptedCredentialsStrict`, `CredentialDecryptionError` (no ciphertext fallback)

### Core (Main)

- **`core/di-container.test.ts`** — `Container` keyed by `token.id` (instance Map; no circular-dependency detection)

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

- Vitest **node** environment by default; jsdom via `// @vitest-environment jsdom` for hook/component render tests
- Component tests import production modules and assert with `@testing-library/react`
- Mock Electron/native deps where needed
- AAA pattern (Arrange, Act, Assert)

For integration IPC/SQLite tests (artist limit, sync queue), see [`tests/integration/README.md`](../integration/README.md).

For the file inventory, see [`TEST_COVERAGE.md`](./TEST_COVERAGE.md). For case counts, run `npm test`.

For E2E workflows, see `tests/e2e/README.md` and Playwright specs.
