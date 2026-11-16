# RuleDesk

A userscript for `rule34.xxx` that adds a feed of followed artists, collections, a reworked search panel and post page, themes, and a set of optional page tweaks. It runs in the browser on the site's own pages. It keeps all its data on your computer. The site API is used for one thing only, the download manager, and only with your own key.

- [What it adds](#what-it-adds)
- [Install](#install)
- [Settings](#settings)
- [Your data](#your-data)
- [Limits](#limits)
- [FAQ](FAQ.md)
- [Changelog](CHANGELOG.md)
- [Developer documentation](docs/)

## What it adds

New items appear in the site's header menu: **Feed**, **Collections**, **Following**, **Favorites**, **Statistics** and **RuleDesk** (settings). The menu is laid out in three zones: the sections used most on the left, the site's other sections under **More**, and Statistics, My Account and RuleDesk as icons on the right. The site's title stands in the same row, and the current section is underlined.

### Feed

Posts of the artists you follow, newest first. New posts carry a NEW mark; "Mark all seen" clears them. When you follow more artists than one site search can hold, the feed is assembled from several searches automatically.

### Following

Every followed artist as a card with a cover, post count and a "new" mark.

- Follow an artist with the Follow button next to the name in the tag list, or press "Add artists" and type one or several tags
- Filter by name, show only artists with new posts, sort by name, post count or follow date
- Select several cards to unfollow them at once
- Refresh re-reads each artist's first page for a fresh cover and count

### Collections

- **Custom collection**: posts you pick by hand with the "+" button on a thumbnail or on the post page
- **Dynamic collection**: a saved search. Type tags in the search panel and press "Save as collection"

Both kinds show a cover and a post count. A collection can be shuffled, renamed and deleted; Select on the Collections page deletes several at once. A saved search can be checked for new posts with "Check for new" on the Collections page. Several posts can be added at once: "Select posts" under the search panel on Posts, or "Select" on Favorites, then "Add to collection". In a custom collection posts are reordered by dragging. A post opened from a custom collection gets previous / next arrows that walk the collection.

### Search panel

Under the site's search field: tags as chips (click to exclude, cross to remove), media type, sort order, minimum score, AI posts on or off, Reset, and "Save as collection".

### Post page

Favorite, Collections, Vote, "I came" and Original as buttons; post details and comments in tabs; the site's own actions (Edit, Report, Add note) in one list. Video keeps its volume and speed and can fit the height, the width, or stay at original size.

### Grid

Favorite star and "+" on thumbnails, three grid sizes, infinite scroll, dimming of posts you already opened, hiding of blacklisted posts, optional video preview on hover, a "GIF" label on animated GIFs, no tag tooltip over thumbnails. On the site's Comments page long tag lists are folded. Collections and Following can be shown as tiles or as a list.

### Favorites

The local favorite list is kept in sync with the site by "Sync favorites" in settings. The Favorites page gets one row at the top (the count, "Random post", "Select" for bulk removal, a "⋯" menu with "Download all…" and "Sync favorites…") and the "+" button for collections. Once "Full resync" has built a local index, that row, which stays at the top while you scroll, also has search by tags (`tag`, `-tag`, `ta*g`, `( a ~ b )`, `sort:id:asc`; the "?" in the field lists them), an Images / Videos switch, endless scrolling and Shuffle. The search runs over the local list, which holds the tags and the id of a favorite: the site's other metatags, such as `rating:` or `score:`, work only in the search on Posts.

### Download manager

Saves the original files of a custom collection (all or selected posts), of a whole search, of posts picked on a results page, or of all your favorites. Files go to a folder named after the collection or the search, inside your browser's download folder, as `rule34-<post id>.<ext>`. A panel in the corner shows progress and has Pause, Resume and Cancel; the job survives a page change.

The manager needs your own API key: generate it on the site's account options page and paste the whole line it shows into RuleDesk → Downloads. Without a key there are no download buttons.

### Statistics

Counts of what the script stores (followed artists, collections, favorites, seen posts) and the top followed artists by post count. The menu item can be hidden in settings.

### Themes

Light, Dark, the site's own two themes, and Custom (light or dark base with your background image).

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (recommended) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open this link and confirm the installation:
   https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
3. In Tampermonkey open Dashboard → Settings → Security → Content Script API and choose **UserScripts API Dynamic**. Without it the site's original look flashes on every page load and pages open slower.

Updates arrive through the script manager from the same link.

## Settings

Header menu → **RuleDesk**. Every block folds with a click on its title.

| Block | What is there |
|---|---|
| Appearance | Theme and grid size |
| Page | A switch for each page tweak, and one switch that turns all tweaks off |
| Blacklist | The site's tag blacklist for this browser |
| Favorites | Favorite buttons in the grid, favorites sync |
| Downloads | Your API key for the download manager |
| Data | Export and import of everything the script stores |

To get the untouched site back: Appearance → Site theme → **Site default**, and Page → turn off **Enable page tweaks**.

## Your data

- Collections, followed artists and settings live in the script manager's storage, in this browser only. Nothing is sent anywhere
- **Data → Export** saves one JSON file; **Import** restores it (Merge adds to what you have, Replace overwrites)
- The blacklist and the site theme are the site's own cookies and are not part of the export. Neither is the API key
- The one request made without an action of yours is the counter beside Feed: the first page of the feed, at most once in 15 minutes, and it can be switched off in RuleDesk → Page
- Otherwise the script reads the pages you open and makes a request only for an action of yours: favorite a post, sync favorites, start a download, type in a tag field, scroll for the next page, open a feed that spans several searches, press Refresh on Following. Requests go one at a time with a pause

## Limits

These come from the site and cannot be fixed in the script.

- The post count of a dynamic collection with several tags is a lower bound, shown with "+". The exact number is known only for a single tag
- "No new posts since" on an artist card is the day the script first saw the artist's newest post, not the date of the post
- The site answers "too many requests" when asked too often. Refresh and favorites sync stop at the first such answer; wait and start again
- A cover or a count for an artist or a collection appears after its page was opened once, or after Refresh

The full list is in [docs/site.md](docs/site.md).
