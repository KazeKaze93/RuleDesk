# Changelog

What changed for the user in each version, newest first. Versions before 0.12.0 are not listed.

## 0.23.0

- **Download original** on the post page: a button next to "Original" saves the full file as `rule34-<post id>.<ext>` through the script manager. The script asks for one more permission, `GM_download`; the manager shows it when the update installs
- **Download a custom collection.** "Download all" on a collection page, or "Download selected" in Select mode. For each post its page is read and the file saved, one post every 1.5 seconds, after a confirmation that states the number of requests. It can be cancelled and stops at the first error
- **Reorder a custom collection** by dragging a post onto another
- **Export and import collections.** Collections → Select → Export saves the chosen collections to a file; Import adds collections from such a file as new ones
- **A failed post image is retried on the site's other image servers** (RuleDesk → Page, on by default)
- **Statistics** block in RuleDesk settings: followed artists, artists with new posts, collections, posts in custom collections, favorites, seen posts, size of the stored data, and the top followed artists by post count. Counted from local data, no requests

## 0.22.1

- No change in behaviour. Unused code removed; documentation rebuilt: `README.md` for users, `docs/` for developers, this file for release notes

## 0.22.0

- **Hide tag tooltip on thumbnails** (RuleDesk → Page, on by default): the browser tooltip with the full tag list no longer shows over a thumbnail. Turn the switch off to get it back
- **Settings blocks fold.** A click on a block title (Appearance, Page, Blacklist, Favorites, Data) folds the block; the choice is remembered

## 0.21.2

- **RuleDesk → Data:** the separate "Export artists" / "Import artists" block is removed. Followed artists travel in the one Export / Import file, with their covers, post counts and follow dates
- Importing in Merge mode no longer wipes an artist's known cover and count when the file has only the tag

## 0.21.1

- **Following:** the cross on a card asks "Unfollow …?" and removes the artist at once; there is no Undo row
- **Add** takes several artist tags separated by spaces; the suggestion list works on the tag being typed
- Notes on artist cards are removed: no pencil button, no note line
- The "Import / export" button is gone from Following. **RuleDesk → Data** has "Export artists" and "Import artists": a text file with one tag per line

## 0.21.0

- **Following as cards.** Each followed artist is a card with a 2x2 cover, post count, a "new" mark, a "no new posts since" line and your own note
- Cover and exact post count are remembered when you open the artist's search; the newest post is also picked up from any results page that shows the artist (feed included). No request is made for this
- **Show All / New**, filter by name or note, sort by name, post count or follow date
- **Select** turns cards into checkboxes for unfollowing several artists after one confirmation
- **Refresh** reads each visible artist's first page again, one request every 1.5 seconds, after a confirmation that states the number of requests. It can be cancelled and stops at the first error
- **Import / export**: the followed tags as one line of text to copy, or paste tags to follow them
- Undo after a single unfollow restores the artist with cover, count and note

## 0.20.0

- **Feed for more artists than one search holds.** Followed artists are split into groups (400 per search by default). The Feed page is the first group's search; the other groups are read one request at a time with a pause and merged into the same grid, newest post first. Further pages load as you scroll. The site pager and "Only new" are hidden on a merged feed; "Mark all seen" and NEW marks work as before. With one group nothing changes and no extra request is made

## 0.19.1

- A collection saved from the search panel has its cover and post count at once: they are taken from the results page when it already shows that search. When the tags were typed but not searched yet, saving opens that search (as the Search button would), and the cover is taken there

## 0.19.0

- **Dynamic collection header** (name, Shuffle, Edit query, Rename, Delete) shows only when the collection is opened from Collections. An ordinary search that equals a saved one stays a plain search. Result pages, Shuffle and Edit query keep the header
- **Save as collection** no longer opens anything or draws a header: the button is replaced by a "Saved to Collections" note
- The Save button of that dialog is no longer stretched by the site's Search button style
- **Collections:** a "Select" button turns the cards into checkboxes. "Select all" marks every card on screen, "Delete" removes the marked collections after one confirmation, "Cancel" leaves selection mode

## 0.18.2

- A dynamic collection saved from a one-tag search shows the exact post count, taken from the tag's row in the sidebar. A search of several tags still shows a lower bound with "+"

## 0.18.1

- **Search panel footer:** the hint text is gone; "Reset" and "Save as collection" are regular buttons
- **Save as collection** saves the search in the tags field (what the panel shows as chips), not the page address. Its dialog shows the name and the query that will be stored. When the page shows another search, the saved one is opened
- The site's `all` search is not a query: it cannot be saved, and no collection bar shows on the plain post list. A collection already saved that way says "no query" on its card; opening it from the card shows its bar so the query can be edited or the collection deleted
- No console warning about a missing video player on image posts

## 0.18.0

- **Save search:** a quiet "Save search" link under "Reset search" in the search panel, shown only when the page's search has tags and is not saved yet. It asks for a name, stores a dynamic collection, and shows its bar above the results without reloading
- **Collapse tags:** flipping the setting off or on forgets which groups were collapsed, so the defaults (General and Meta collapsed) apply again
- The "I came counter" warning no longer appears in the console

## 0.17.2

- **Add to collection:** Create refuses any name that already exists, custom or dynamic (it used to add the post to the custom collection of that name). To add a post to an existing collection, tick its row

## 0.17.1

- **Add to collection:** a new name that a dynamic collection already has is refused with a message, the same rule as on the Collections page

## 0.17.0

- **Add to collection:** one compact list in both places, the Collections button on the post page and the "+" on a grid thumb: a checkbox row per custom collection with its post count, and a "New collection name + Create" row at the bottom. The grid menu now follows the theme and stays open after Create
- A new name that matches an existing custom collection adds the post to it instead of making a duplicate. The name filter appears once there are more than 8 collections

## 0.16.7

- **Dialogs on site pages:** a focused text field keeps the theme colours (the site painted it light yellow, hiding the text on dark themes)
- **Dynamic cards:** the caption shows the post count once the results page has been opened: exact for a single page, "N+" otherwise (read from the pager, no extra requests)

## 0.16.6

- **Dynamic bar:** drawn like the custom collection header: no boxed panel, larger name, plain buttons, red Delete
- **Dynamic cards:** the cover shows up right after coming back from the results page (no refresh); the query tooltip is gone

## 0.16.5

- **Collection bar:** the bar above search results (Custom parts and Dynamic controls) follows the theme colours instead of staying light
- **Dynamic cards:** a 2×2 cover like Custom cards, no tag chips (the query is the card tooltip). The cover is the first four thumbs of the search's first results page, remembered when you open it; no extra requests. Empty until the first visit, reset when the query is edited

## 0.16.4

- **Dynamic query fields:** the Query field in New collection and in Edit query autocompletes the tag being typed (same site autocomplete as the search box: after 2 characters, debounced, one request at a time). `( ~ )` and filters like `sort:random` are left alone

## 0.16.3

- **Dynamic bar:** Rename asks for the name only, Edit query for the query only
- **Collections page:** a cover thumb that fails to load shows the empty cell instead of a broken image

## 0.16.2

- **Collection queue:** stepping between posts of a collection replaces the history entry, so browser Back returns to the collection page instead of the previous post

## 0.16.1

- **Collection queue:** on a post opened from a collection, the site's own "< previous / next >" links step through the collection (shuffled order included) instead of the last search. At either end they do nothing
- **Feed bar:** the "N new" bar follows the theme colours instead of staying white

## 0.16.0

- **Collections page:** card grid with All / Custom / Dynamic switch, name filter and **New**. Custom cards show a 2×2 cover and post count; Dynamic cards show the query as chips. The whole card is the link
- **Custom collection page** (`#rdw/collections/<id>`): Shuffle, Original order, Rename, Delete, and bulk remove with Select. Removal is local and shows "Removed N · Undo" instead of a dialog
- **Collection queue:** a post opened from a collection (`#rdw-c=<id>`) shows "name · k / N ‹ ›" in the post panel and follows the current order, shuffled or not
- **Dynamic collections:** the saved search opens the site results with a bar: Shuffle (`sort:random`), Original order, Edit query, Rename, Delete. An empty query is rejected
- **Thumbs:** the thumb URL is stored when a post is added (from the grid, or derived from the media URL on the post page). No thumb: a tile with the post id

## 0.15.1

- **Grid:** Default / Compact / Large only (saved Masonry becomes Default). Thumb gap is 4px on both axes; cell sizes stay 150 / site default / 250
- **Post panel:** Info / Comments always opens on Info (the choice is not saved). Collections list is drawn outside the scrolling column
- **Site theme:** document-start writes the theme cookie only; the desktop stylesheet swaps when its `<link>` appears (no missing-link warning before the document is parsed)
- **Tag groups:** collapsed rows hide again under the site skin

## 0.15.0

- **Post panel tabs:** Info / Comments tabs in the post panel (native `#post-comments` in Comments; reply form stays on the page)
- **Video size:** Fit height (may upscale; fills under the header, not wider than the media column), Fit width, Original (pixel-perfect); default Fit height. Persist volume/mute/rate (no mouse-wheel volume)
- **Video preview on hover:** optional grid webm preview (default off; 200 ms hover delay; each preview loads the video file itself)
- **Skin:** stylesheet URL slash-collapse; thinner scrollbars; post panel tab styles

## 0.14.0

- **Post comments column:** native `#post-comments` moves into the post panel (reply form stays on the page)
- **Video player tweaks:** persist volume/mute/rate; **Video size** Fit height / Fit width / Original (default Fit height)
- **Video preview on hover:** optional grid webm preview (default off; each preview loads the video file itself)
- **Bulk favorites:** confirm remove uses kit Dialog; select bar above the grid
- **Infinite scroll:** prefetch margin ~2 viewport heights ahead of the sentinel

## 0.13.0

- **AI filter:** search-tools control to exclude AI-tagged posts
- **Post panel:** redesigned post-page actions (Favorite, collections, Original, score, stats, More)
- **Bulk favorites:** select and remove multiple favorites on the favorites page

## 0.12.0

- **Faster start:** theme + site-skin CSS inject first (one cheap GM appearance read, no zod); heavy mounts and `#rdw/*` pages load after paint / on demand
- **Feed after Follow/Back:** followed artists are mirrored in `localStorage` so Feed href / recognition stay current across bfcache
- **Site theme palettes:** Site default / Site dark use site-matched token colors on RuleDesk chrome (not Light/Dark stand-ins)
- **Custom background:** image lives in IndexedDB (async); first paint shows base palette only
- **Skin polish:** Search/Go stay accent; Follow is secondary; Reset stays on one line
