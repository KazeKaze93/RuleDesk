/**
 * Pure helpers for `scripts/release.mjs` (version/tag assertions, argv parsing).
 */

export const RELEASE_BUMP_TYPES = Object.freeze(["patch", "minor", "major"]);

/**
 * @param {string} value
 * @returns {string}
 */
export function stripVersionPrefix(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith("v") ? trimmed.slice(1) : trimmed;
}

/**
 * Tag name must be `v` + package.json version on the tagged commit.
 * @param {{ tagName: string, packageVersion: string }} input
 * @returns {{ ok: true, version: string } | { ok: false, error: string }}
 */
export function assertTagMatchesPackageVersion(input) {
  const tagName = String(input.tagName ?? "").trim();
  const packageVersion = String(input.packageVersion ?? "").trim();

  if (!tagName.startsWith("v") || tagName === "v") {
    return {
      ok: false,
      error: `tag name must look like vX.Y.Z (got ${JSON.stringify(tagName)})`,
    };
  }
  if (!/^\d+\.\d+\.\d+/.test(packageVersion)) {
    return {
      ok: false,
      error: `package.json version is not semver-like (got ${JSON.stringify(packageVersion)})`,
    };
  }

  const tagVersion = stripVersionPrefix(tagName);
  if (tagVersion !== packageVersion) {
    return {
      ok: false,
      error: `tag ${tagName} does not match package.json version ${packageVersion}`,
    };
  }

  return { ok: true, version: packageVersion };
}

/**
 * @param {string[]} argv process.argv.slice(2)
 * @returns {{ bump: "patch" | "minor" | "major", dryRun: boolean } | { error: string }}
 */
export function parseReleaseArgs(argv) {
  const tokens = argv.map((a) => String(a));
  let dryRun = false;
  /** @type {string[]} */
  const positionals = [];

  for (const token of tokens) {
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token.startsWith("-")) {
      return { error: `unknown flag ${token} (supported: --dry-run)` };
    }
    positionals.push(token);
  }

  if (positionals.length !== 1) {
    return {
      error: `usage: node scripts/release.mjs <patch|minor|major> [--dry-run]`,
    };
  }

  const bump = positionals[0];
  if (!RELEASE_BUMP_TYPES.includes(bump)) {
    return {
      error: `bump must be one of ${RELEASE_BUMP_TYPES.join(", ")} (got ${JSON.stringify(bump)})`,
    };
  }

  return {
    bump: /** @type {"patch" | "minor" | "major"} */ (bump),
    dryRun,
  };
}
