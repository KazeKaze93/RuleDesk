/**
 * Canonical TanStack Query keys for Post Metadata tag-resolve IPC.
 * Single factory so TagsDrawer reads and any cache writes stay isomorphic.
 */

export type PostMetadataResolveKind = "artist" | "character" | "copyright";

const RESOLVE_KIND_KEY_PREFIX: Record<PostMetadataResolveKind, string> = {
  artist: "resolve-tags-ipc",
  character: "resolve-character-tags-ipc",
  copyright: "resolve-copyright-tags-ipc",
};

/**
 * Normalize post.tags (DB string or accidental string[]) into a stable
 * space-joined key token. Empty / unknown → "".
 */
export function canonicalizePostTagsForResolve(
  tags: unknown
): string {
  let tokens: string[] = [];
  if (typeof tags === "string") {
    tokens = tags.split(/\s+/).filter((t) => t.length > 0);
  } else if (Array.isArray(tags)) {
    tokens = tags.filter((t): t is string => typeof t === "string" && t.length > 0);
  }
  return tokens.join(" ");
}

export function buildPostMetadataResolveQueryKey(
  kind: PostMetadataResolveKind,
  tags: unknown
): readonly [string, string] {
  return [RESOLVE_KIND_KEY_PREFIX[kind], canonicalizePostTagsForResolve(tags)];
}
