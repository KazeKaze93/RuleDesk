/**
 * Renderer-facing provider DTOs.
 *
 * Source of truth remains `src/main/providers/types.ts` (not the runtime
 * registry in `providers/index.ts`). Type-only re-export so the renderer
 * never imports `main/` directly.
 */
export type { SearchResults } from "../../main/providers/types";
