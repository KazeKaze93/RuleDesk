# RuleDesk 19.0.0

## Breaking — Gelbooru removed

RuleDesk is **Rule34.xxx only**. The Gelbooru API client, provider picker, and provider-switch dialog are gone.

### What happens to existing data

| Data | Behavior |
|------|----------|
| **Gelbooru artists** | Stay in the database. Sync skips them with an explicit error: `<artist>: Gelbooru support was removed; this artist is no longer synced`. Other (Rule34) artists still sync. |
| **Gelbooru posts** | Stay in the library. Previews, videos, and “Open on site” links still work (legacy CDN/CSP/openExternal hosts). |
| **Smart playlists** with `query.provider = "gelbooru"` | Opening/resolving throws typed `UNSUPPORTED_PROVIDER` (not an empty list, not a crash). Recreate the playlist for Rule34 or edit the stored query. |
| **Settings `provider = "gelbooru"`** | Load coerces the IPC value to `rule34` and logs a warning; the DB row is not rewritten until the next settings save. There is no provider field on save anymore. |

### What you should do

1. Track / sync artists on **Rule34.xxx** only going forward.
2. Recreate any smart collections that targeted Gelbooru.
3. Optionally delete unused Gelbooru artists from Tracked if you no longer need them (posts can remain for browsing).

### Not removed

- SQLite `provider` columns, unique keys, and existing Gelbooru rows (no migration / no mass delete).
- Legacy Gelbooru media hosts for display of stored posts.

## Pull requests

- (fill after merge) `chore/remove-gelbooru`
