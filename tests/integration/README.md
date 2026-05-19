# Integration Tests

Vitest tests that exercise **Main-process** IPC controllers and services against an **in-memory SQLite** database (`tests/helpers/mock-db.ts`). They run in the same `npm test` / `npm run test:integration` pipeline as unit tests (Node ABI for `better-sqlite3`).

## Layout

| Path | Focus |
|------|--------|
| `tests/integration/controllers/` | IPC handler wiring + validation |
| `tests/integration/services/` | Service-layer behavior (sync, backup, etc.) |

## Post-audit additions (v16.2.x)

| File | What it proves |
|------|----------------|
| `controllers/ArtistsController.limit.test.ts` | With 5001 tracked artists, `getTrackedArtists` returns 5000 and logs a warning |
| `services/SyncService.queue.test.ts` | `runExclusive()` queues `repairArtist` until `syncAllArtists` finishes (timing-based) |

## Running

```bash
npm run test:integration
npm run test:integration:watch
npm test -- tests/integration
npm test -- tests/integration/services/SyncService.queue.test.ts
```

## Conventions

- Mock Electron (`electron-log`, `safeStorage`) at module boundaries
- Use `mock-db` for isolated schema; do not touch the user’s real `ruledesk.db`
- Prefer asserting observable behavior (return values, logs, timing) over implementation details

See also: [`tests/unit/TEST_COVERAGE.md`](../unit/TEST_COVERAGE.md) for the full Vitest inventory.
