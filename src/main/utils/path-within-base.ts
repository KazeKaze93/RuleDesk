import path from "node:path";

/**
 * Returns true if `resolvedCandidate` lies inside `basePath` (after path.resolve).
 * Rejects traversal via `..` relative to base.
 */
export function isResolvedPathWithinBase(
  resolvedCandidate: string,
  basePath: string,
): boolean {
  const resolved = path.resolve(resolvedCandidate);
  const base = path.resolve(basePath);
  if (resolved === base) {
    return true;
  }
  const rel = path.relative(base, resolved);
  if (rel === "") {
    return true;
  }
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return false;
  }
  return true;
}
