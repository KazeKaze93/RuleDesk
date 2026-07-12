# IPC channel notes

Optional human-written notes merged into the generated [`../api.md`](../api.md).

- Edit **`channels.json`**: map of `"channel-string"` → short description.
- Prefer **JSDoc** directly above `this.handle(...)` for new handlers (picked up by the generator).
- Do **not** edit `docs/api.md` by hand — run `npm run docs:api`.

Narrative / examples live in [`../api-guide.md`](../api-guide.md).
