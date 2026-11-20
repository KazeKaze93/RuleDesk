# Development

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server with the userscript install helper |
| `npm run build` | Type-check, then write `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest with jsdom |

## Release

The repository is `KazeKaze93/RuleDesk` (called `ruledesk-web` until 0.24.0). There is one branch, `main`. Users install and update from the built file in it, so the build is committed.

1. Bump the version in `package.json` and in `vite.config.ts` (the userscript header). Run `npm install --package-lock-only` so `package-lock.json` follows.
2. Add an entry at the top of `CHANGELOG.md`: what changed for the user, not how.
3. `npm run build`, `npm test`.
4. Commit as `Release X.Y.Z: <summary>` with `dist/ruledesk-web.user.js` added by `git add -f` (the `dist` folder is ignored otherwise). Push `main`.

Script managers pick the new version up from `@updateURL`. Every change a user should receive needs a version bump; without it the manager does not update.

A change counts as done when it is pushed, the types and tests pass, the build is committed, and the behaviour was checked on the live site.

## Checking behaviour

The live site cannot be opened from an automated session, and its markup is known only from what `docs/site.md` records. Two ways to check:

**Tests.** jsdom with hand-built markup that follows `docs/site.md`. The script manager's storage is stubbed with a `Map` behind `GM_getValue` / `GM_setValue`.

**A local page.** The built script can run in a real browser on a page of your own:

1. An HTML page with `div#header > ul#navbar` and `div#content > div#post-list > div.content > div.image-list`.
2. Before the script, define `GM_getValue` / `GM_setValue` over `localStorage`.
3. Put the content of `dist/ruledesk-web.user.js` inside a `script` tag, escaping any closing `script` tag in it. Loading it by `src` does not work: the main chunk fails to load.
4. Serve the page over HTTP (`python -m http.server`), not `file://`, and open it with `?page=post&s=list#rdw/collections`.

To check a theme without the skin, add the site's font rule to the page (`body, div, input, button { font-family: verdana }`): the site's stylesheet has one, and it is what makes those themes differ.

The screenshots in `docs/img` are taken from such pages with the Dark theme, in a window 800 px wide, and cut to what they are about.

Features mount after the first paint. The local page checks the script's own pages and logic; it has none of the site's markup or styles, so anything that depends on them still needs the live site.

## Script manager

Tampermonkey: Dashboard → Settings → Security → Content Script API → **UserScripts API Dynamic**. Measured on 5.5.1: the site's original look flashed on 5 loads of 5 with "UserScripts API" and on 0 of 5 with Dynamic, and pages opened faster.

## Speed

Measured on a mock list page with 12,000 favorites: first paint about 104 ms without the script and 132 ms (median) with version 0.15.1. The rules that keep it there: before the theme CSS is inserted the script does one settings read and a cheap parse; feature modules load after the first paint; the code of the script's own pages does not run until one is opened. The build has grown since that measurement (about 670 KB at 0.22, about 980 KB at 0.40, about 1,280 KB at 0.72); repeat the measurement before blaming or clearing size. What counts for the first paint is the entry part of the file, the code run at document-start: 306 KB at 0.72.0 (it was 915 KB at 0.71, when the list of features was imported on that path). Since 0.72.1 the build is minified (`build.minify` in `vite.config.ts`): 659 KB in all, 164 KB of entry. The built file is one long text and its diff says nothing: read `src/` at the commit instead. The minifier drops the licence comments of the packages inside the file, so `npm run build` ends with `scripts/third-party-notices.mjs`: it puts the notices of Preact, Zod and SystemJS back as a comment at the end of the built file and writes them to `THIRD_PARTY_LICENSES.md`. A package added to the bundle is added to the list in that script; a missing licence file fails the build.

## Design files

`docs/design/` holds two early HTML mock-ups and a copy of the site's light stylesheet. `src/ui/tokens.ts` cites them as the source of the light palette and of the site-theme colours.
