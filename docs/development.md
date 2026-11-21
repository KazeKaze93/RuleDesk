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

The repository is `KazeKaze93/RuleDesk` (called `ruledesk-web` until 0.24.0). Users install and update from the built file in `main`, so the build is committed, and what is in `main` is what every user gets at the next update.

Since 20.11.2026 nothing is pushed to `main` directly: the branch is protected, for the owner too. Work is done on a branch (`dev/<what-it-is>`), pushed, and brought in by a pull request. Only the owner of the repository can merge; nobody else has write access.

1. Bump the version in `package.json` and in `vite.config.ts` (the userscript header). Run `npm install --package-lock-only` so `package-lock.json` follows.
2. Add an entry at the top of `CHANGELOG.md`: what changed for the user, not how.
3. `npm run build`, `npm test`.
4. On the branch, commit as `Release X.Y.Z: <summary>` with `dist/ruledesk-web.user.js` added by `git add -f` (the `dist` folder is ignored otherwise). Push the branch and open a pull request into `main`.
5. Merge the pull request. For a minor version, tag the merge commit `vX.Y.0` and make the GitHub release from the changelog entry.

Since 0.75.0 the header has no `@updateURL` and no `@downloadURL`: a catalogue of userscripts does not take a script whose header sends updates past it. A script manager then checks the address the script was installed from. Every change a user should receive needs a version bump; without it the manager does not update.

A change counts as done when its pull request is merged, the types and tests pass, the build is committed, and the behaviour was checked on the live site. A branch can be tried before the merge: the raw address of the built file at the branch's commit installs that build.

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

Measured on a mock list page with 12,000 favorites: first paint about 104 ms without the script and 132 ms (median) with version 0.15.1. The rules that keep it there: before the theme CSS is inserted the script does one settings read and a cheap parse; feature modules load after the first paint; the code of the script's own pages does not run until one is opened. The build has grown since that measurement (about 670 KB at 0.22, about 980 KB at 0.40, about 1,280 KB at 0.72); repeat the measurement before blaming or clearing size. What counts for the first paint is the entry part of the file, the code run at document-start: 306 KB at 0.72.0 (it was 915 KB at 0.71, when the list of features was imported on that path). From 0.72.1 to 0.74.3 the build was minified: 659 KB in all, 164 KB of entry. Since 0.75.0 it is not (`build.minify` in `vite.config.ts`): 1,364 KB in all, with the names and the spaces of the source, because a catalogue of userscripts asks for code that can be read. Everything the script needs is inside the one file: the header has no `@require`, and nothing is fetched when the script is installed. The three packages inside it are readable too, and that takes two steps of the build. Preact is built from the sources its package carries (`resolve.alias` in `vite.config.ts`), because the build the package publishes is minified. SystemJS, the loader of the parts of the script, is put in by the plugin in its minified build only, so `scripts/readable-systemjs.mjs` swaps in `dist/system.js` and `dist/extras/named-register.js` of the same package. Zod is readable as published. `scripts/check-built-file.mjs` ends the build and fails it on an `@require`, on minified SystemJS, on Preact's published build or on a file over 2 MB. The name, the version and the source of each package are at the end of the built file and in `THIRD_PARTY_LICENSES.md`. What that costs was measured on 0.74.3 (21.11.2026). On a mock Favorites page with 12,000 favorites, in headless Chrome, 30 loads each: first paint 20 ms without the script, 28 ms minified, 32 ms not minified. On the site, in Chrome with Tampermonkey and the processor slowed six times, 10 loads each: 1,254 ms minified, 1,326 ms not minified, with some 200 ms between the fastest and the slowest load of either, so about 12 ms on a machine that is not slowed. The bundler drops the licence comments of the packages inside the file, minified or not, so `npm run build` ends with `scripts/third-party-notices.mjs`: it puts the notices of Preact, Zod and SystemJS back as a comment at the end of the built file and writes them to `THIRD_PARTY_LICENSES.md`. A package added to the bundle is added to the list in that script; a missing licence file fails the build.

## Design files

`docs/design/` holds two early HTML mock-ups and a copy of the site's light stylesheet. `src/ui/tokens.ts` cites them as the source of the light palette and of the site-theme colours.
