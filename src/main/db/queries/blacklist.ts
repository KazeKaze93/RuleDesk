import { getSqliteInstance } from "../client";

const MAX_BLACKLIST_TAGS = 100;

type BlacklistCountRow = { count: number };
type BlacklistTagRow = { tag: string };

const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

export function getAllBlacklistedTags(): string[] {
  const sqlite = getSqliteInstance();
  const rows = sqlite
    .prepare<[], BlacklistTagRow>(
      "SELECT tag FROM tag_blacklist ORDER BY created_at DESC, id DESC"
    )
    .all();
  return rows.map((row) => row.tag);
}

export function addTagToBlacklist(tag: string): void {
  const sqlite = getSqliteInstance();
  const normalizedTag = normalizeTag(tag);

  const countRow = sqlite
    .prepare<[], BlacklistCountRow>("SELECT COUNT(*) as count FROM tag_blacklist")
    .get();
  const currentCount = countRow?.count ?? 0;

  if (currentCount >= MAX_BLACKLIST_TAGS) {
    throw new Error(`Blacklist limit reached (${MAX_BLACKLIST_TAGS} tags maximum).`);
  }

  sqlite
    .prepare("INSERT OR IGNORE INTO tag_blacklist (tag) VALUES (?)")
    .run(normalizedTag);
}

export function removeTagFromBlacklist(tag: string): void {
  const sqlite = getSqliteInstance();
  const normalizedTag = normalizeTag(tag);
  sqlite.prepare("DELETE FROM tag_blacklist WHERE tag = ?").run(normalizedTag);
}
