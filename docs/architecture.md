# Architecture

RuleDesk Web is one userscript file, `dist/ruledesk-web.user.js`, built from TypeScript with Vite and `vite-plugin-monkey`. Its own interface is Preact (`preact/compat`); data is validated with `zod/mini`. It runs at `document-start` on `https://rule34.xxx/*` with three grants: `GM_getValue`, `GM_setValue`, and for the download manager `GM_download`.

The approach: the site's pages and markup stay. The script recolours the whole site with its own skin, adds controls to the site's pages, and adds pages of its own that open by URL hash without a request to the site.

## Start-up

`src/main.ts` runs three steps, ordered so the first paint is not delayed.

1. `boot/early.ts`, before the DOM exists: one cheap read of the settings, then the theme CSS, so the page never shows the site's original look.
2. `boot/layout.ts`, when the DOM is ready and before paint: the features that change layout (grid size, search panel space).
3. `boot/app.ts`, after the first paint, loaded by dynamic import: everything else. The code of the script's own pages does not run until such a page is opened.

## Source layout

| Folder | Holds |
|---|---|
| `src/boot` | Start-up steps above |
| `src/config` | Constants and interface texts |
| `src/features` | Page tweaks: one module per switch in settings (see below) |
| `src/features/post-panel` | The post page side panel |
| `src/pages` | The script's own pages: Collections, collection detail, Following, settings and its sections; the hash router and the page host |
| `src/search` | Building and recognising site search queries (feed groups, collection id lists, `sort:random`) |
| `src/site` | Everything that knows the site: selectors, page readers, and all network requests |
| `src/skin` | The CSS that recolours the site |
| `src/storage` | Schema, the store, backup, favorites list, `localStorage` mirrors |
| `src/ui` | Shared interface parts; `src/ui/kit` is the component kit |
| `tests` | Vitest with jsdom, mirroring `src` |

## Features

A feature is an object of type `Feature` (`src/features/types.ts`): an id, a label for settings, the page kinds it runs on, a default state, a CSS text and a `mount` function. `src/features/registry.ts` lists them in mount order; `src/features/runtime.ts` adds the body class `rdw-f-<id>`, injects the CSS once and calls `mount` once per page load.

- A feature's CSS is always scoped by its body class, so turning the feature off removes its effect
- `cssOnly: true` means the settings switch applies at once; any other feature reloads the page
- A feature may keep a small state of its own through `ctx.getState` / `ctx.setState` (stored under `settings.featureState[id]`)
- Features talk through one event: `notifyThumbsAdded` / `onThumbsAdded` in `runtime.ts`, fired when thumbnails are appended to the grid (infinite scroll, merged feed)

## Own pages

`#rdw/collections`, `#rdw/collections/<id>`, `#rdw/following`, `#rdw/stats`, `#rdw/settings`. `src/pages/router.ts` parses the hash, `src/pages/host.tsx` mounts the page in a shadow root (`#rdw-page-root`) after the site header and hides the rest of the site until the hash is left. Back returns to the site page.

Two more hash marks sit on site URLs and are not pages:

- `#rdw-c=<collectionId>` on a post page: the post was opened from a custom collection; the panel shows the collection's previous / next strip
- `#rdw-dc=<collectionId>` on a results page: the search was opened from a dynamic collection's card; only then its bar (Shuffle, Edit query, Rename, Delete) is drawn

## Light DOM and shadow DOM

Own pages render inside the shadow root, where the site's CSS does not reach. Controls added to site pages (search panel, collection bar, post panel, menus) render in the light DOM, where it does. The skin therefore excludes every element whose class contains `rdw-` from its rules for site buttons and inputs, and kit components carry explicit rules for the states the site styles (for example a focused text input).

Colours come only from the tokens `--rdw-*` (`src/ui/tokens.ts`); no component hard-codes a colour.

## Storage

| Where | Key | What |
|---|---|---|
| Script manager | `ruledesk-web.storage` | Collections, followed artists, seen marks, settings, the feed's seen mark |
| Script manager | `ruledesk-web.favs` | Local favorite ids |
| Script manager | `ruledesk-web.storage.backup` | Snapshot taken before an import |
| Script manager | `ruledesk-web.api` | The user's API credentials for downloads; never exported |
| Script manager | `ruledesk-web.downloads`, `.position` | The current download job and how far it got |
| IndexedDB | (background store) | The custom theme's background image |
| `localStorage` | mirrors | Followed artists; covers and counts of dynamic collections |
| Site cookies | `tag_blacklist`, `theme` | The site's own blacklist and theme |

`src/storage/schema.ts` is the single definition of the stored shape; `src/storage/store.ts` is the only module that writes it. Reading and validating the whole storage costs tens of milliseconds on a large library, so there are three ways to get it: `load()` returns the in-memory copy; `loadRecent()` returns it when it is under a second old and reads otherwise, and is what read-only code on a page uses; `reloadFromStorage()` always reads, and every write goes through it first so that a change made in another tab is not overwritten. The mirrors exist because a page restored by the Back button can get stale data from the script manager; pages that list data re-read it on `pageshow`.

The backup file format is described in [data-format.md](data-format.md).

## Collections

- **Custom**: `kind: "posts"`, a list of post ids with their thumbnail URLs, shown on its own page. It opens on the site as `id:` searches split into parts
- **Dynamic**: `kind: "search"` (or no kind), a saved query. Its cover and post count are taken from the first results page whenever that search is shown; no request is made for them

Names are unique across both kinds, case-insensitively. A query that narrows nothing (empty, or the site's `all`) cannot be saved.

## Followed artists and the feed

The feed is a normal site search of the form `( artist1 ~ artist2 … )`. Artists are split into groups (`updatesGroupSize`, 400 by default). With one group the feed is that one search. With several, `src/features/feed-merge.ts` reads the other groups' pages and merges all groups into one grid, newest first: a post is shown only when every group that still has unread pages has a post buffered, so nothing newer can appear later.

What Following shows about an artist (cover, exact count, newest post) is collected by `src/features/artist-snapshots.ts` from pages the user opens anyway; only the Refresh button makes requests.

## Download manager

`src/features/downloads/queue.ts` holds one job at a time. `startDownload(label, source)` first collects the files through `src/site/api.ts` (a search is walked with an id cursor; explicit post ids are asked for in groups), then saves them one by one with `GM_download` into a folder named after the job, inside the browser's download folder (a script manager cannot save anywhere else). The job and its position are stored, so a page change does not lose it: the tab that was running it (marked in `sessionStorage`) continues by itself, any other tab shows it paused. `panel.tsx` draws the corner panel on every page; `search-controls.tsx` adds the buttons under the search panel; `grid-select.ts` lets posts be picked on a results page by marking `span.thumb`. Buttons appear only when `downloadsAvailable()` is true, which needs a stored API key.

The storage keys and the userscript's name and namespace keep the old `ruledesk-web` spelling on purpose: they identify the script and its data to the manager.

## Code rules

- TypeScript `strict`, no `any`, no `as` except `as const`
- No `console.*`; use `src/log.ts`
- No magic numbers or strings: name them as constants
- The script's own interface is built only from `src/ui/kit`
- Read the code and reproduce a problem before fixing it

## Before the first paint

`main.ts` runs `bootEarly()` (theme and skin CSS) and `startEarlyLayout()` at document-start. The second watches the page while it is parsed and, as soon as the header and the search form are in, puts in the script's menu items (`src/boot/menu-skeleton.ts`: labels and addresses that need no storage) and reserves the place of the search panel at the height it last had (`src/boot/search-tools-reserve.ts`, plain localStorage). The menu code and the Feed feature find those items by id after the first paint and finish them. Nothing heavy may be imported on this path.

Features added in 0.37.0, each in one file: `src/features/hide-seen.ts` and `recent-queries.ts` with their rows in `search-extras.tsx`; `post-panel/download-one.tsx`; `image-zoom.ts` (the viewer, plain DOM); `layout-options.ts` (two style-only features, "Sidebar on the right" and "Motion"); `feed-counter.ts` (the only request made without a user action, cached in localStorage for 15 minutes); `src/site/list-pages.ts` (Forum marks, Follow on Artists, actions on Tags); `src/pages/collections-check.ts` ("Check for new"); `src/storage/history.ts` with `src/pages/stats-history.tsx` (a point a day, the History block, the backup reminder). A followed entry has an optional `kind` (absent means artist) and an optional `group`; a saved search has optional `openedPostId` and `newestPostId`.

`src/boot/header-layout.ts` also puts the site's title into the row of the menu (only when the header is `#site-title` followed by `ul#navbar`), marks the Favorites item as current on the Favorites page (the site does not) and keeps `aria-current` on the link of the current item.

The top of the Favorites page is two elements, both inserted before the grid by `src/features/favorites-bulk.tsx`: `#rdw-favorites-bulk`, which holds only the page's heading for screen readers, and the pinned row `#rdw-favorites-pin`, which is sticky. The row is a child of the block the grid is in because a sticky element cannot leave its parent. One Preact tree draws both, the pinned row through a portal. The pinned row holds the filters (`FavoritesBrowser`: search, the switches, Shuffle, the count, and at its right end a slot the bulk bar fills with Random post, Select and the menu) or, while posts are being selected or removed, the selection bar; the filters are hidden then, not unmounted. The titles of Collections and Following are hidden the same way (`titleHiddenForRoute` in `src/pages/host.tsx`). The row of filters is squeezed in steps by what fits (`fitControlsRow`, a `ResizeObserver` on the row), not by window width.
