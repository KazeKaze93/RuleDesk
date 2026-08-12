/**
 * Renderer-facing DB row types.
 *
 * Source of truth remains `src/main/db/schema.ts` (`$inferSelect` / `$inferInsert`).
 * This file is a type-only door so the renderer never imports `main/` directly.
 * A value import of the schema module would pull Drizzle and better-sqlite3
 * into the browser bundle.
 */
export type {
  Artist,
  Post,
  Playlist,
  NewArtist,
  NewPost,
  NewPlaylist,
  Settings,
  TagMetadata,
  PlaylistEntry,
} from "../../main/db/schema";
