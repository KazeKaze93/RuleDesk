# Architecture

RuleDesk is one userscript file, `dist/ruledesk-web.user.js`, built from TypeScript with Vite and `vite-plugin-monkey`. Its own interface is Preact (`preact/compat`); data is validated with `zod/mini`. It runs at `document-start` on `https://rule34.xxx/*` with three grants: `GM_getValue`, `GM_setValue`, and for the download manager `GM_download`.

The approach: the site's pages and markup stay. The script recolours the whole site with its own skin, adds controls to the site's pages, and adds pages of its own that open by URL hash without a request to the site. What each feature does for the user is in [features.md](features.md); this file says how it is built and where it lives.

- [Start-up](#start-up)
- [Source layout](#source-layout)
- [Where each screen lives](#where-each-screen-lives)
- [Features](#features)
- [Own pages](#own-pages)
- [Light DOM and shadow DOM](#light-dom-and-shadow-dom)
- [Themes and tokens](#themes-and-tokens)
- [The component kit](#the-component-kit)
- [The header](#the-header)
- [Storage](#storage)
- [Collections](#collections)
- [Followed tags and the feed](#followed-tags-and-the-feed)
- [Favorites](#favorites)
- [Download manager](#download-manager)
- [Code rules](#code-rules)

## Start-up

`src/main.ts` runs three steps, ordered so the first paint is not delayed.

1. `boot/early.ts`, before the DOM exists: one cheap read of the settings, then the theme CSS, so the page never shows the site's original look.
2. `boot/layout.ts`, while the page is parsed and before paint: the features that change layout (grid size, the space of the search panel, the sidebar side), the menu items (`boot/menu-skeleton.ts`: labels and addresses that need no storage) and the place of the search panel at the height it last had (`boot/search-tools-reserve.ts`, plain `localStorage`).
3. `boot/app.ts`, after the first paint, loaded by dynamic import: everything else. The code of the script's own pages does not run until such a page is opened.

Nothing heavy may be imported on the path of steps 1 and 2.

## Source layout

| Folder | Holds |
|---|---|
| `src/boot` | The start-up steps, the header layout, the sticky header |
| `src/config` | Constants and interface texts |
| `src/features` | Page features: one module per switch in settings |
| `src/features/post-panel` | The post page side panel |
| `src/features/downloads` | The download queue, its corner panel, the buttons on a results page, picking posts in the grid |
| `src/pages` | The script's own pages and the sections of settings; the hash router and the page host |
| `src/search` | Building and recognising site search queries (feed groups, collection id lists, `sort:random`) |
| `src/site` | Everything that knows the site: selectors, page readers, all network requests, and the additions to the site's list pages, forum and Upload |
| `src/skin` | The CSS that restyles the site in the script's themes; the theme palettes |
| `src/storage` | Schema, the store, backup, the favorites list and index, history, `localStorage` mirrors |
| `src/ui` | Shared interface parts; `src/ui/kit` is the component kit; `src/ui/tokens.ts` the colour tokens |
| `tests` | Vitest with jsdom, mirroring `src` |
| `docs/img` | Screenshots used by the README and `features.md` |

## Where each screen lives

| Screen or block | Files |
|---|---|
| Header: one row, zones, icons, More | `boot/header-layout.ts`, `features/menu-cleanup.ts`, `pages/menu.ts` |
| Sticky header and sidebar | `boot/sticky-header.ts` |
| Feed counter | `features/feed-counter.ts` |
| Search panel | `features/search-tools.tsx`; the site's field: `features/site-search-tools.tsx` |
| Sidebar tag groups, Follow buttons | `features/tag-groups.ts`, `ui/artists-sidebar.ts` |
| Tag wiki on "?" | `features/tag-wiki.ts` |
| Grid: star, "+", marks | `ui/fav-button.ts`, `features/playlist-menu.ts`, `features/grid-marks.ts`, `site/video-thumbs.ts` |
| Infinite scroll | `features/infinite-scroll.ts`, `site/next-page.ts` |
| Dynamic collection bar | `features/playlist-bar.ts` |
| Post panel | `features/post-actions.ts`, `features/post-panel/*` |
| Picture viewer, GIFs, video | `features/image-zoom.ts`, `features/gif-post.ts`, `features/video-player.ts`, `features/video-preview.ts` |
| Feed | `features/feed.ts`, `features/feed-merge.ts`, `ui/updates-bar.ts` |
| Following | `pages/following-page.tsx`, `features/artist-snapshots.ts`, `site/artist-snapshot.ts` |
| Collections | `pages/collections-page.tsx`, `pages/collection-detail-page.tsx`, `pages/collections-check.ts`, `ui/collection-picker.tsx`, `ui/bulk-collection-dialog.tsx` |
| Favorites | `features/favorites-bulk.tsx`, `features/favorites-browser.tsx`, `features/favorites-search.ts`, `site/favorites*.ts`, `storage/favorites-index.ts` |
| Downloads | `features/downloads/*`, `site/api.ts`, `site/download.ts`, `pages/downloads-section.tsx` |
| Statistics | `pages/stats-section.tsx`, `site/profile.ts`; `storage/history.ts` keeps a point a day for the backup reminder |
| Settings | `pages/settings-page.tsx`, `ui/appearance-section.tsx`, `pages/blacklist-section.tsx`, `pages/favorites-sync-section.tsx`, `pages/downloads-section.tsx`, `pages/data-section.tsx` |
| Forum, Artists, Tags | `site/list-pages.ts` |
| Comments | `site/comments-page.ts` |
| Upload | `site/upload-page.ts` |
| The look of every site page | `skin/site-skin.ts` |

## Features

A feature is an object of type `Feature` (`src/features/types.ts`): an id, a label for settings, the page kinds it runs on, a default state, a CSS text and a `mount` function. `src/features/registry.ts` lists them in mount order; `src/features/runtime.ts` adds the body class `rdw-f-<id>`, injects the CSS once and calls `mount` once per page load.

- A feature's CSS is always scoped by its body class, so turning the feature off removes its effect
- `cssOnly: true` means the settings switch applies at once; any other feature reloads the page
- A feature may keep a small state of its own through `ctx.getState` / `ctx.setState` (stored under `settings.featureState[id]`)
- Features talk through one event: `notifyThumbsAdded` / `onThumbsAdded` in `runtime.ts`, fired when thumbnails are appended to the grid (infinite scroll, merged feed)
- A caption under a switch in settings comes from `settingsCaption`; a list of options from `choice`

The additions to the forum, the list pages and Upload are not features with switches: `boot/app.ts` mounts them, and each recognises its page by markup and does nothing elsewhere.

## Own pages

`#rdw/collections`, `#rdw/collections/<id>`, `#rdw/following`, `#rdw/stats`, `#rdw/settings`. `src/pages/router.ts` parses the hash, `src/pages/host.tsx` mounts the page in a shadow root (`#rdw-page-root`) after the site header and hides the rest of the site until the hash is left. Back returns to the site page.

Collections and Following span the window so their tiles can (`LAYOUT_WIDE_CLASS`); their toolbar and everything else stay in a centred column. Their titles, and that of Favorites, are kept for screen readers only (`titleHiddenForRoute`): the menu already says which page is open.

Two more hash marks sit on site URLs and are not pages:

- `#rdw-c=<collectionId>` on a post page: the post was opened from a custom collection; the panel shows the collection's previous / next strip
- `#rdw-dc=<collectionId>` on a results page: the search was opened from a dynamic collection's card; only then its bar (Shuffle, Edit query, Rename, Delete) is drawn

## Light DOM and shadow DOM

Own pages render inside the shadow root, where the site's CSS does not reach. Controls added to site pages (search panel, collection bar, post panel, menus, the Favorites row) render in the light DOM, where it does. Two consequences:

- The skin excludes every element whose class contains `rdw-` from its rules for site buttons and inputs, and kit components carry explicit rules for the states the site styles (a focused text input, an autofilled one)
- The site's stylesheet names a font for every `div`, `input` and `button`. A rule of the page beats `:host`, so the host of the own pages sets its font with `!important`, and a block in the light DOM that must look the same in every theme (the search panel) sets the font on itself and its descendants

A dialog or a popover opened from a block must not be clipped by it: no `mask-image` and no `overflow: hidden` on a container that things open from.

## Themes and tokens

`src/ui/tokens.ts` defines `TokenPalette`: background, surface, second surface, border, text, muted text, accent and its soft form, danger and its soft form, the four tag-type colours, three radii, two shadows, the font, and four values for a switch of options. They are written as CSS custom properties `--rdw-*` on `:root` and on the host of the own pages. **No component hard-codes a colour.**

| Theme | Palette | Skin |
|---|---|---|
| Light, Dark | `LIGHT_PALETTE`, `DARK_PALETTE` | on (`html.rdw-skin`) |
| Custom | Light or Dark by its base, plus a background picture on `body` | on |
| Site default, Site dark | `SITE_DEFAULT_PALETTE`, `SITE_DARK_PALETTE` in `src/skin/theme.ts`: the site's own colours, with muted text adjusted to pass contrast | off |

`src/skin/site-skin.ts` is the stylesheet that restyles the site. Every rule in it is scoped under `html.rdw-skin`; a test checks that.

In the two site themes the skin is off and the rule is: **the script does not dress the site's own controls there** (`skinIsOn()` in `src/skin/skin-on.ts`). No magnifier in the site's search field, no card look for the forum, no drop zone on Upload. What the script adds of its own is drawn in every theme, from the tokens. The sticky header gets the page's colour as a background there, because the site's header has none.

Contrast is tested: `tests/features/favorites-panel.test.ts` and the skin tests hold the pairs that must pass.

## The component kit

`src/ui/kit`. The script's own interface is built only from these.

| Component | For |
|---|---|
| `Button` | Variants primary, secondary, ghost, danger; sizes; `pressed` for a toggle |
| `IconButton` | A button that is only an icon, always with a name for the tooltip and screen readers |
| `Segmented` | A switch of two to four options |
| `Switch` | On / off |
| `Select` | A list of options |
| `TextField`, `NumberField` | Text and number input |
| `SearchField` | A text field with a magnifier, a clear button, an optional "?" that lists what can be typed, and optional suggestions from a source the page gives it |
| `AutocompleteField` | A tag field with the site's suggestions |
| `Chip` | A tag; can be removed or toggled |
| `Card`, `SectionLabel`, `EmptyState` | Layout pieces |
| `Tabs` | Info / Comments on the post panel |
| `Dialog`, `Popover` | Modal and anchored surfaces |
| `ProgressBar`, `Toast` | Progress and a short message |
| `icons.tsx` | The icon set, one stroke style |

The height and the text size of controls come from two custom properties (`--rdw-control-h`, `--rdw-control-font`): 28 px and 12 px on site pages, a step larger on the script's own pages.

## The header

`src/boot/header-layout.ts`, style only apart from two small fixes:

- the site's title is put into the row of the menu, only when the header is `#site-title` followed by `ul#navbar`
- the three zones: frequent sections, More, icons
- the Favorites item is marked current on the Favorites page (the site does not do it), and `aria-current` is kept on the link of the current item
- a dot on the gear when a backup is due

`src/boot/sticky-header.ts` holds the header at the top and the sidebar beside the content, and publishes the header's height as `--rdw-header-h` for whatever else sticks under it (the Favorites row, the toolbars of Collections and Following).

## Storage

| Where | Key | What |
|---|---|---|
| Script manager | `ruledesk-web.storage` | Collections, followed tags, seen marks, settings, the feed's seen mark, history points |
| Script manager | `ruledesk-web.favs` | Local favorite ids and the state of the sync |
| Script manager | `ruledesk-web.storage.backup` | Snapshot taken before an import |
| Script manager | `ruledesk-web.api` | The user's API credentials for downloads; never exported |
| Script manager | `ruledesk-web.downloads`, `.position` | The current download job and how far it got |
| IndexedDB | `ruledesk-web.favorites-index` | Tags of each favorite, for the search on Favorites |
| IndexedDB | (background store) | The custom theme's background picture |
| `localStorage` | mirrors | Followed tags; covers and counts of dynamic collections; the Feed counter's last answer; the height of the search panel |
| Site cookies | `tag_blacklist`, `theme` | The site's own blacklist and theme |

`src/storage/schema.ts` is the single definition of the stored shape; `src/storage/store.ts` is the only module that writes it. Reading and validating the whole storage costs tens of milliseconds on a large library, so there are three ways to get it: `load()` returns the in-memory copy; `loadRecent()` returns it when it is under a second old and reads otherwise, and is what read-only code on a page uses; `reloadFromStorage()` always reads, and every write goes through it first so that a change made in another tab is not overwritten. The mirrors exist because a page restored by the Back button can get stale data from the script manager; pages that list data re-read it on `pageshow`.

The storage keys and the userscript's name and namespace keep the old `ruledesk-web` spelling on purpose: they identify the script and its data to the manager.

The backup file format is described in [data-format.md](data-format.md).

## Collections

- **Custom**: `kind: "posts"`, a list of post ids with their thumbnail URLs, shown on its own page. It opens on the site as `id:` searches split into parts
- **Dynamic**: `kind: "search"` (or no kind), a saved query. Its cover and post count are taken from the first results page whenever that search is shown. `openedPostId` is the newest post when it was last opened; `newestPostId` the newest found by "Check for new" (`pages/collections-check.ts`: one request per collection, 1.5 s apart, one retry after 8 s)

Names are unique across both kinds, case-insensitively. A query that narrows nothing (empty, or the site's `all`) cannot be saved.

## Followed tags and the feed

A followed entry is a tag with an optional `kind` (artist when absent, or character, copyright) and an optional `group`.

The feed is a normal site search of the form `( tag1 ~ tag2 … )`. Tags are split into groups (`updatesGroupSize`, 400 by default). With one group the feed is that one search. With several, `src/features/feed-merge.ts` reads the other groups' pages and merges all groups into one grid, newest first: a post is shown only when every group that still has unread pages has a post buffered, so nothing newer can appear later.

What Following shows about an entry (cover, exact count, newest post) is collected by `src/features/artist-snapshots.ts` from pages the user opens anyway; only the Refresh button makes requests.

## Favorites

The top of the Favorites page is two elements, both inserted before the grid by `src/features/favorites-bulk.tsx`: `#rdw-favorites-bulk`, which holds only the page's heading for screen readers, and the pinned row `#rdw-favorites-pin`, which is sticky. The row is a child of the block the grid is in because a sticky element cannot leave its parent. One Preact tree draws both, the pinned row through a portal.

The pinned row holds the filters (`FavoritesBrowser`: search, the switches, Shuffle, the count, and at its right end a slot the bulk bar fills with Random post, Select and the menu) or, while posts are being selected or removed, the selection bar; the filters are hidden then, not unmounted. The row is squeezed in steps by what fits (`fitControlsRow`, a `ResizeObserver` on the row), not by window width.

The index is filled from the favorites pages, where the site cuts one character off each end of the tag list. `src/features/favorites-tags.ts` restores those ends from the whole spellings it knows (entries made at the star or on a post page, flagged `cut: false`, and the tags that stand inside a cut list) and marks what it could not restore; the search and the tag counts work on the restored lists. Nothing is written back to the index.

The index can also hold the rating, score and size of a favorite, read from the site API (`collectPostDetails` in `src/site/api.ts`, started from `pages/favorites-sync-section.tsx`). `putFavoriteIndexEntries` carries them over when a sync writes an entry again. `favorites-search.ts` turns `rating:`, `score:`, `width:`, `height:` into conditions (`DetailTest`); an entry without the details passes none of them.

`src/features/favorites-suggest.ts` makes the suggestions of the search field from the counted tags of the index: the word under the caret, the tags that begin with it and those that hold it, the completed query, and for an empty result the word that is no tag and the nearest tag to it. `SearchField` in the kit draws them when it is given a `suggest` source (ARIA combobox; the list is portaled to `<body>` and fixed under the field, because the pinned row clips its content) and tells the page through `onCommit` when what is typed is meant. `FavoritesBrowser` keeps two texts for that: what is in the field and what the list is narrowed to.

`src/features/favorites-search.ts` parses the query into include, exclude, any-of groups and a sort; what the local index cannot answer (other metatags, fuzzy `tag~`) is reported back to the user instead of being ignored silently. While a search, the type switch, Scroll or Shuffle is on, the site's own grid and pager are hidden and the matching favorites are drawn in cells of the same markup the site uses, so everything that works on the site's cells works on these.

## Download manager

`src/features/downloads/queue.ts` holds one job at a time. `startDownload(label, source)` first collects the files through `src/site/api.ts` (a search is walked with an id cursor; explicit post ids are asked for in groups), then saves them one by one with `GM_download` into a folder named after the job, inside the browser's download folder (a script manager cannot save anywhere else). The job and its position are stored, so a page change does not lose it: the tab that was running it (marked in `sessionStorage`) continues by itself, any other tab shows it paused.

`panel.tsx` draws the corner panel on every page; `search-controls.tsx` adds the buttons under the search panel; `grid-select.ts` lets posts be picked on a results page by marking `span.thumb`. Bulk buttons appear only when `downloadsAvailable()` is true, which needs a stored API key. The single Download button of a post (`features/post-panel/download-one.tsx`) takes the file's address from the page and needs no key.

The file name is built by `buildFileName` in `src/site/download.ts` from a mask kept in `src/storage/download-name.ts`.

## Code rules

- TypeScript `strict`, no `any`, no `as` except `as const`
- No `console.*`; use `src/log.ts`
- No magic numbers or strings: name them as constants
- The script's own interface is built only from `src/ui/kit`; colours only from the tokens
- A selector for the site's markup is never invented: it comes from `docs/site.md`, which records what was read from a live page
- A new kind of request to the site needs the maintainer's consent
- Read the code and reproduce a problem before fixing it
