# RuleDesk Web

Userscript for [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/) on `https://rule34.xxx/*`.

## Install / update

Install or update from the built file on GitHub:

https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js

Managers that honor `@updateURL` / `@downloadURL` can auto-check that same raw URL.

Local build: `npm install` then `npm run build` → `dist/ruledesk-web.user.js`.

### Tampermonkey (recommended)

**Tampermonkey → Dashboard → Settings → Security → Content Script API → UserScripts API Dynamic.**

Measured on Tampermonkey 5.5.1: with Dynamic, native page flash on load is typically 0/5 vs ~5/5 with UserScripts API; pages also open faster. Prefer Dynamic for RuleDesk Web.

### 0.17.1 notes

- **Add to collection:** a new name that a dynamic collection already has is refused with a message, the same rule as on the Collections page

### 0.17.0 notes

- **Add to collection:** one compact list in both places, the Collections button on the post page and the "+" on a grid thumb: a checkbox row per custom collection with its post count, and a "New collection name + Create" row at the bottom. The grid menu now follows the theme and stays open after Create
- A new name that matches an existing custom collection adds the post to it instead of making a duplicate. The name filter appears once there are more than 8 collections

### 0.16.7 notes

- **Dialogs on site pages:** a focused text field keeps the theme colours (the site painted it light yellow, hiding the text on dark themes)
- **Dynamic cards:** the caption shows the post count once the results page has been opened: exact for a single page, "N+" otherwise (read from the pager, no extra requests)

### 0.16.6 notes

- **Dynamic bar:** drawn like the custom collection header: no boxed panel, larger name, plain buttons, red Delete
- **Dynamic cards:** the cover shows up right after coming back from the results page (no refresh); the query tooltip is gone

### 0.16.5 notes

- **Collection bar:** the bar above search results (Custom parts and Dynamic controls) follows the theme colours instead of staying light
- **Dynamic cards:** a 2×2 cover like Custom cards, no tag chips (the query is the card tooltip). The cover is the first four thumbs of the search's first results page, remembered when you open it; no extra requests. Empty until the first visit, reset when the query is edited

### 0.16.4 notes

- **Dynamic query fields:** the Query field in New collection and in Edit query autocompletes the tag being typed (same site autocomplete as the search box: after 2 characters, debounced, one request at a time). `( ~ )` and filters like `sort:random` are left alone

### 0.16.3 notes

- **Dynamic bar:** Rename asks for the name only, Edit query for the query only
- **Collections page:** a cover thumb that fails to load shows the empty cell instead of a broken image

### 0.16.2 notes

- **Collection queue:** stepping between posts of a collection replaces the history entry, so browser Back returns to the collection page instead of the previous post

### 0.16.1 notes

- **Collection queue:** on a post opened from a collection, the site's own "< previous / next >" links step through the collection (shuffled order included) instead of the last search. At either end they do nothing
- **Feed bar:** the "N new" bar follows the theme colours instead of staying white

### 0.16.0 notes

- **Collections page:** card grid with All / Custom / Dynamic switch, name filter and **New**. Custom cards show a 2×2 cover and post count; Dynamic cards show the query as chips. The whole card is the link
- **Custom collection page** (`#rdw/collections/<id>`): Shuffle, Original order, Rename, Delete, and bulk remove with Select. Removal is local and shows "Removed N · Undo" instead of a dialog
- **Collection queue:** a post opened from a collection (`#rdw-c=<id>`) shows "name · k / N ‹ ›" in the post panel and follows the current order, shuffled or not
- **Dynamic collections:** the saved search opens the site results with a bar: Shuffle (`sort:random`), Original order, Edit query, Rename, Delete. An empty query is rejected
- **Thumbs:** the thumb URL is stored when a post is added (from the grid, or derived from the media URL on the post page). No thumb: a tile with the post id

### 0.15.1 notes

- **Grid:** Default / Compact / Large only (saved Masonry becomes Default). Thumb gap is 4px on both axes; cell sizes stay 150 / site default / 250
- **Post panel:** Info / Comments always opens on Info (the choice is not saved). Collections list is drawn outside the scrolling column
- **Site theme:** document-start writes the theme cookie only; the desktop stylesheet swaps when its `<link>` appears (no missing-link warning before the document is parsed)
- **Tag groups:** collapsed rows hide again under the site skin

### 0.15.0 notes

- **Post panel tabs:** Info / Comments tabs in the post panel (native `#post-comments` in Comments; reply form stays on the page)
- **Video size:** Fit height (may upscale; fills under the header, not wider than the media column), Fit width, Original (pixel-perfect); default Fit height. Persist volume/mute/rate (no mouse-wheel volume)
- **Video preview on hover:** optional grid webm preview (default off; 200 ms hover delay; each preview loads the video file itself)
- **Skin:** stylesheet URL slash-collapse; thinner scrollbars; post panel tab styles

### 0.14.0 notes

- **Post comments column:** native `#post-comments` moves into the post panel (reply form stays on the page)
- **Video player tweaks:** persist volume/mute/rate; **Video size** Fit height / Fit width / Original (default Fit height)
- **Video preview on hover:** optional grid webm preview (default off; each preview loads the video file itself)
- **Bulk favorites:** confirm remove uses kit Dialog; select bar above the grid
- **Infinite scroll:** prefetch margin ~2 viewport heights ahead of the sentinel

### 0.13.0 notes

- **AI filter:** search-tools control to exclude AI-tagged posts
- **Post panel:** redesigned post-page actions (Favorite, collections, Original, score, stats, More)
- **Bulk favorites:** select and remove multiple favorites on the favorites page

### 0.12.0 notes

- **Faster start:** theme + site-skin CSS inject first (one cheap GM appearance read, no zod); heavy mounts and `#rdw/*` pages load after paint / on demand
- **Feed after Follow/Back:** followed artists are mirrored in `localStorage` so Feed href / recognition stay current across bfcache
- **Site theme palettes:** Site default / Site dark use site-matched token colors on RuleDesk chrome (not Light/Dark stand-ins)
- **Custom background:** image lives in IndexedDB (async); first paint shows base palette only
- **Skin polish:** Search/Go stay accent; Follow is secondary; Reset stays on one line

## Own pages (site navbar)

RuleDesk adds items to the site header navbar (`div#header ul#navbar`):

| Menu | Hash / URL | What it is |
|---|---|---|
| **Collections** | `#rdw/collections` | Custom Collection (manually gathered post sets) and Dynamic Collection (saved searches) |
| **Following** | `#rdw/following` | Followed artists; add/remove; empty state links to Posts |
| **Favorites** | site favorites URL | Shown when a favorites user id is known; native My Favorites entry is hidden |
| **RuleDesk** | `#rdw/settings` | Appearance, Page tweaks, Blacklist, Favorites sync, Data backup |

Own pages mount in `#rdw-page-root` (Shadow DOM) after `div#header` and hide the rest of the site until you leave the hash. There is no floating RD panel.

**Collections**

- **Custom Collection:** named sets of post ids (`kind: "posts"`) — a manually gathered post set; create from Collections or the **+** button on thumbs / post side panel; open as `id:` searches (chunked by **Collection part size**)
- **Dynamic Collection:** save the current `page=post&s=list` search when `tags` is non-empty (saved search); open / rename / delete

## Favorites

- On the post list grid, a star is anchored to `img.preview` via CSS anchor positioning (hover / focus to reveal; marked stars stay visible); the site’s link/image markup is left intact
- Click toggles favorite: same-origin `addfav` (+ vote on new add) or favorites delete
- Local favorite IDs live in a separate GM key (`ruledesk-web.favs`); legacy `marks.*.fav` is migrated on load
- Favorites page: no DOM changes; IDs are read from Remove links into local favs, and Remove clicks clear the local mark
- Settings → **Show favorite buttons in grid** (`settings.gridFavButtons`, default on)
- Settings → **Favorites sync**: **Sync favorites** walks newest-first and stops on the first page whose ids are already local; **Full resync** walks every page (add-only; one page every 1.5 s). Resume / Stop and a stale lock can auto-resume in another tab (mode is stored)

## Artists / Feed

- Follow / unfollow artists from the tag sidebar (`ul#tag-sidebar`) on list and post pages, or add tags on **Following** (tag field uses site autocomplete)
- Navbar **Feed** opens a normal site search `( artist1 ~ artist2 )` (optional `id:>N` / group size; `0` = up to 400 artists per query). With no followed artists, Feed points to `#rdw/following`
- Feed href and “is this a Feed page?” prefer a `localStorage` artists mirror (seeded/updated with GM) so Follow + Back / bfcache stay correct
- On a full Feed result page, a bar above `div.image-list` can **Mark all seen** (page 1 only, and only when the page has posts newer than `seenPostId`)
- Empty Feed pages (no `image-list`) show “No new posts since #N” with a link to the same search without `id:>`

No `api.rule34.xxx`. Network `fetch` runs only in `favorites.ts` (add/remove on click), `favorites-sync.ts` (explicit Sync / Resume / auto-resume), `autocomplete.ts` (tag suggestions on Following / Blacklist), and `next-page.ts` (infinite scroll page loads).

Storage uses `GM_getValue` / `GM_setValue`.

## Themes (Appearance)

Settings → **Appearance** → **Site theme**:

| Theme | What you get |
|---|---|
| **Site default** | Native rule34 look (`html.rdw-skin` off; site `theme` cookie cleared); RuleDesk chrome uses site-green token palette |
| **Site dark** | Native site dark CSS (`theme=dark` cookie + `desktop-dark.css`); RuleDesk chrome uses site-dark tokens |
| **Light** / **Dark** | RuleDesk site skin (`html.rdw-skin`) with the matching token palette |
| **Custom** | RuleDesk skin with a Light or Dark base; optional background image (IndexedDB) + dim (no per-color pickers). Legacy custom accent/bg/surface/text from 0.10 are dropped; base is chosen from the old `bg` brightness |

Own pages (`#rdw/…` Shadow host) use the same palette tokens as the document (`:root` + sync onto `#rdw-page-root`). Custom background applies after first paint.

**Restore the native site look:** open **RuleDesk** (`#rdw/settings`) → Appearance → Theme → **Site default**.

Default for new installs is **Light** (RuleDesk skin on).

## Blacklist (site cookie)

Settings → **Blacklist** edits this browser’s `tag_blacklist` cookie (add/remove chips; add field uses site autocomplete). Changes write immediately; with **Hide blacklisted thumbs** (`blacklist-hide`) enabled, matching thumbs on list pages are hidden without a reload. Account settings on the site are not updated and may overwrite the cookie after login. Export/import and Data backup never include the blacklist cookie.

## Page tweaks (features)

Optional list/post/favorites UI modules. Master switch **Enable page tweaks** in Settings (default on). Each module has its own checkbox or choice control. CSS-only modules apply immediately; other modules and the master tweaks switch reload the page.

| Module id | Label | Default | Pages | What it does |
|---|---|---|---|---|
| `feed` | Feed in site menu | on | all | Adds a Feed menu item; on feed list pages mounts the updates bar and marks new thumbs |
| `menu-cleanup` | Clean header menu | on | all | Hides unused header links |
| `tag-groups` | Collapse tags | on | list, post | Collapse tag sidebar groups (General/Meta by default) |
| `search-tools` | Search tools | on | list, post | Token chips, media/sort/score controls, and save-to-collection under the search form |
| `seen-dim` | Dim seen posts | on | list, post | Marks opened posts; dims them in the grid (also restamps infinite-scroll thumbs) |
| `playlist-menu` | Add to collection button | on | list, post | **+** on thumbs (list) and collection menu under Favorite (post side panel) |
| `playlist-bar` | Collection header | on | list | Name / part links / post count above a collection `id:` search |
| `blacklist-hide` | Hide blacklisted thumbs | on | list | Hides thumbs matching the site blacklist cookie (no reload) |
| `infinite-scroll` | Infinite scroll | on | list | Loads the next page into the grid; respects site blacklist |
| `post-actions` | Post actions | on | post | Favorite / collection / Original / Score bar (and Options proxies) on the post page |
| `grid-density` | Grid size | on | list, favorites | compact / default / large; 4px gap on both axes (cell size unchanged) |
| `video-player` | Video player tweaks | on | post | Persist volume/mute/rate; **Video size**: Fit height (may upscale; under header, ≤ media column), Fit width, Original (pixel-perfect) |
| `video-preview` | Video preview on hover | off | list, favorites | Hover preview on webm thumbs after 200 ms (loads the video file itself) |

**Disable a module:** open **RuleDesk** → Settings → Page → uncheck that module (or change its choice). **Disable all tweaks:** turn off **Enable page tweaks**. Removed in 0.7.0: `search-tokens`, `pager`, `followed-badge`.

## Data backup

Settings → **Data** exports one JSON file `ruledesk-web-backup-<YYYY-MM-DD>.json` with storage, optional favs (**Include favorites**, off by default — restore via Favorites sync), and optional background image (from IndexedDB when included). Import supports **Merge** and **Replace**; a backup without favs leaves the local fav set unchanged. Seen marks are capped to the newest ~20 000 post ids on write. This is separate from the older collections-only export format below.

Example backup shape (no real data):

```json
{
  "format": "ruledesk-web-backup",
  "version": 1,
  "exportedAt": "2026-11-13T03:30:00.000Z",
  "storage": {
    "version": 1,
    "collections": [],
    "artists": [{ "tag": "example_artist" }],
    "marks": {},
    "settings": {
      "gridFavButtons": true,
      "updatesGroupSize": 0,
      "playlistChunkSize": 40,
      "tweaksEnabled": true,
      "appearance": { "theme": "light" }
    },
    "updates": { "seenPostId": 0 }
  },
  "favs": {
    "version": 1,
    "ids": [101, 202]
  }
}
```

(`background` is an optional string when “Include background image” is on.)

## Legacy export format

```json
{
  "version": 1,
  "collections": [
    {
      "id": "uuid",
      "name": "My search",
      "tags": [
        { "tag": "cat", "type": "include" },
        { "tag": "dog", "type": "exclude" }
      ]
    },
    {
      "id": "uuid-2",
      "name": "Watch later",
      "kind": "posts",
      "tags": [],
      "postIds": [12345, 67890]
    }
  ],
  "artists": [{ "tag": "nyx_x" }],
  "marks": {
    "12345": { "seen": true }
  },
  "favIds": [12345, 67890],
  "settings": {
    "gridFavButtons": true,
    "tweaksEnabled": true,
    "updatesGroupSize": 0,
    "playlistChunkSize": 40,
    "features": { "menu-cleanup": true },
    "featureChoice": { "grid-density": "default" },
    "featureState": {}
  },
  "updates": {
    "seenPostId": 0
  }
}
```

- Collections without `kind` (or `kind: "search"`) are saved searches (Dynamic Collection); `kind: "posts"` are Custom Collections with `postIds`
- `settings` / `updates` / `favIds` are optional; defaults are `gridFavButtons: true`, `tweaksEnabled: true`, `updatesGroupSize: 0`, `playlistChunkSize: 40`, `seenPostId: 0`
- Import merges collections by `id`, artists by `tag`, marks by post id (including `seen`); legacy `marks.*.fav` becomes fav ids; `seenPostId` keeps the maximum of current and imported
- Runtime fav ids are stored under `ruledesk-web.favs` (not inside the main storage key)
- Blacklist cookie is never part of export/import or Data backup

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
