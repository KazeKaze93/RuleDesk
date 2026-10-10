# Development

## Quality gate (local)

Quality and tests are **not** run on GitHub Actions. After `git config core.hooksPath .githooks`, every push runs `.githooks/pre-push`:

1. `npm run validate` (typecheck, lint, img attrs)
2. `docs:api` freshness (`git diff --exit-code docs/api.md`)
3. `npm test` and `npm run test:isolated` (see `architecture.md`)

`npm run test:verify` matches that Vitest path for a full local check. Pushing ordinary branches does **not** start a packaging build.

## Release packaging (CI)

Tagged releases are packaged by [`.github/workflows/release.yml`](../.github/workflows/release.yml):

| Trigger | Behavior |
|---------|----------|
| Push tag `v*` | Matrix: `windows-latest` → `npm run dist:win`, `ubuntu-latest` → `npm run dist:linux`; audit (`check:release-artifacts`); upload both files to the GitHub Release for that tag (author `github-actions[bot]`) |
| `workflow_dispatch` + input `tag` | Same packaging from the given existing tag; assets are uploaded into that release (`overwrite_files: true` replaces same-name files; missing files such as AppImage are added) |

Artifacts (electron-builder `directories.output` = `release`):

- Windows: `RuleDesk-<version>-win.zip`
- Linux: `RuleDesk-<version>.AppImage`

Native `better-sqlite3` is rebuilt on each runner (`postinstall` / `electron-builder install-app-deps`; Linux also runs `npm run db:rebuild` before package, matching the former release job).

Typical flow after quality is green locally:

```bash
npm run release:patch   # or release:minor / release:major
# → npm version … && git push --follow-tags
# → Release workflow packages and publishes both platforms
```

## Fallback: manual package and upload

If Actions is unavailable, package on the target OS and attach to the release:

```bash
npm run release:patch          # version bump + tag push (or use an existing tag)
npm run dist:win               # on Windows → release/RuleDesk-*-win.zip
npm run dist:linux             # on Linux → release/*.AppImage
npm run check:release-artifacts
gh release create vX.Y.Z release/RuleDesk-X.Y.Z-win.zip release/RuleDesk-X.Y.Z.AppImage
# or, for an existing release:
gh release upload vX.Y.Z release/RuleDesk-X.Y.Z.AppImage --clobber
```

Do not print or commit secrets. User credentials are never bundled; they live encrypted under `RuleDesk-Data` at runtime.
