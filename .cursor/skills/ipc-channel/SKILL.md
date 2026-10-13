---
name: ipc-channel
description: Steps to add, change, or remove an IPC channel between renderer and main in RuleDesk. Use for any work on channels, controllers, preload bridge methods, or IPC error shapes.
---
# IPC channel change (RuleDesk)

Verify every path below with grep before editing; paths may have moved.

1. Channel name: src/main/ipc/channels.ts (the only place channels are declared).
2. Argument schema: Zod schema in src/shared/schemas/<domain>.ts. Reuse existing schemas.
3. Handler: in the domain controller under src/main/ipc/controllers/, via this.handle(CHANNEL, schema, handler, options?).
   - Base class: src/main/core/ipc/BaseController.ts.
   - New controller: extends BaseController, register in src/main/ipc/index.ts.
   - Do not re-parse args inside the handler; BaseController already validated them.
4. Errors: throw (prefer createCodedError from src/shared/utils/coded-error.ts). Never return empty success. BaseController turns errors into the { ok: false, error } envelope; preload rethrows them.
5. DB writes: synchronous db.transaction((tx) => …) with .run(); network before the transaction; getDb() at write time.
6. Bridge: method in the preload bridge (find via the preload entry in electron.vite.config.ts) plus its signature in src/shared/types/ipc-bridge.ts. Push events: webContents.send in main plus an on… subscription in the bridge that returns an unsubscribe function.
7. Renderer: useQuery / useMutation with a query key consistent across page, viewer, and manual cache writes.
8. Docs: npm run docs:api and commit docs/api.md (generated, never hand-edit).
9. Removal: delete channel, handler, bridge method, type, tests, and docs entries together; grep src/ and tests/ for leftovers.
10. Error shapes, credentials, or bridge contracts changed → MANUAL-CHECK in a live Electron instance (DevTools), per LIVE ELECTRON VERIFICATION in .cursorrules.
