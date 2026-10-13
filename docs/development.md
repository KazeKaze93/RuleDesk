# Development

## Process

Branch protection on `master` is **enabled**: pull requests required (including for admins), 0 required approving reviews for solo flow, force pushes and branch deletion blocked. Version bumps use the same rule: `release:patch|minor|major` open a `release/<version>` PR; the Release workflow still starts only from a pushed `v*` tag (see below). Tag pushes are not restricted.

## Quality gate (local)

Quality and tests are **not** run on GitHub Actions. After `git config core.hooksPath .githooks`, every push runs `.githooks/pre-push`:

1. `npm run validate` (typecheck, lint, img attrs)
2. `docs:api` freshness (`git diff --exit-code docs/api.md`)
3. `npm test` and `npm run test:isolated` (see `architecture.md`)

`npm run test:verify` matches that Vitest path for a full local check. Pushing ordinary branches does **not** start a packaging build.

## Release packaging (CI)

Release CI intentionally has no lint/typecheck/test/e2e steps — those stay on local `pre-push`; Actions quality jobs were dropped in `5d7a263` for cost and flake cost on every push, and only packaging was restored.

Tagged releases are packaged by [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Trigger | Behavior |
|---------|----------|
| Push tag `v*` | Matrix: `windows-latest` → `npm run dist:win`, `ubuntu-latest` → `npm run dist:linux`; audit (`check:release-artifacts`); upload both files to the GitHub Release for that tag (author `github-actions[bot]`) |
| `workflow_dispatch` + input `tag` | Same packaging from the given existing tag; assets are uploaded into that release (`overwrite_files: true` replaces same-name files; missing files such as AppImage are added) |

Artifacts (electron-builder `directories.output` = `release`):

- Windows: `RuleDesk-<version>-win.zip`
- Linux: `RuleDesk-<version>.AppImage`

Native `better-sqlite3` is rebuilt on each runner (`postinstall` / `electron-builder install-app-deps`; Linux also runs `npm run db:rebuild` before package, matching the former release job).

### Release flow (PR + tag)

Preconditions (enforced by `scripts/release.mjs`): clean worktree, current branch `master`, `master` == `origin/master`.

```bash
npm run release:patch   # or release:minor / release:major
# → branch release/<version>, npm version --no-git-tag-version, commit "<version>"
# → push branch, open PR, merge (or wait until merged)
# → tag v<version> on the PR merge commit on origin/master and push the tag
# → Release workflow packages and publishes both platforms
```

Dry-run (branch + PR only; **no** tag):

```bash
npm run release:patch -- --dry-run
# Cleanup afterwards:
gh pr close <n> --delete-branch
git checkout master && git fetch origin && git reset --hard origin/master
```

The script refuses to push a tag when `v<version>` does not match `package.json` `version` on the tagged commit, and removes any local tag if the remote push fails.

## Fallback: manual package and upload

If Actions is unavailable, finish the version PR + tag as usual (or tag an existing merge commit), then package on the target OS and attach to the release:

```bash
npm run release:patch          # PR + tag (or tag an existing merge commit as vX.Y.Z)
npm run dist:win               # on Windows → release/RuleDesk-*-win.zip
npm run dist:linux             # on Linux → release/*.AppImage
npm run check:release-artifacts
gh release create vX.Y.Z release/RuleDesk-X.Y.Z-win.zip release/RuleDesk-X.Y.Z.AppImage
# or, for an existing release:
gh release upload vX.Y.Z release/RuleDesk-X.Y.Z.AppImage --clobber
```

Do not print or commit secrets. User credentials are never bundled; they live encrypted under `RuleDesk-Data` at runtime.
