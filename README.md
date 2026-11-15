# RuleDesk Web

A userscript for `rule34.xxx` that adds a feed of followed artists, collections, a reworked search panel and post page, themes, and a set of optional page tweaks. It runs in the browser on the site's own pages. It does not use the site API and keeps all its data on your computer.

- [What it adds](#what-it-adds)
- [Install](#install)
- [Settings](#settings)
- [Your data](#your-data)
- [Limits](#limits)
- [Changelog](CHANGELOG.md)
- [Developer documentation](docs/)

## What it adds

New items appear in the site's header menu: **Feed**, **Collections**, **Following**, **Favorites** and **RuleDesk** (settings).

### Feed

Posts of the artists you follow, newest first. New posts carry a NEW mark; "Mark all seen" clears them. When you follow more artists than one site search can hold, the feed is assembled from several searches automatically.

### Following

Every followed artist as a card with a cover, post count and a "new" mark.

- Follow an artist with the Follow button next to the name in the tag list, or type one or several tags into the Add field
- Filter by name, show only artists with new posts, sort by name, post count or follow date
- Select several cards to unfollow them at once
- Refresh re-reads each artist's first page for a fresh cover and count

### Collections

- **Custom collection**: posts you pick by hand with the "+" button on a thumbnail or on the post page
- **Dynamic collection**: a saved search. Type tags in the search panel and press "Save as collection"

Both kinds show a cover and a post count. A collection can be shuffled, renamed and deleted; Select on the Collections page deletes several at once. A post opened from a custom collection gets previous / next arrows that walk the collection.

### Search panel

Under the site's search field: tags as chips (click to exclude, cross to remove), media type, sort order, minimum score, source (All, Feed, Favorites), AI posts on or off, Reset, and "Save as collection".

### Post page

Favorite, Collections, Vote, "I came" and Original as buttons; post details and comments in tabs; the site's own actions (Edit, Report, Add note) in one list. Video keeps its volume and speed and can fit the height, the width, or stay at original size.

### Grid

Favorite star and "+" on thumbnails, three grid sizes, infinite scroll, dimming of posts you already opened, hiding of blacklisted posts, optional video preview on hover, no tag tooltip over thumbnails.

### Favorites

The local favorite list is kept in sync with the site by "Sync favorites" in settings. The Favorites page gets bulk removal.

### Themes

Light, Dark, the site's own two themes, and Custom (light or dark base with your background image).

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (recommended) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open this link and confirm the installation:
   https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
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
| Data | Export and import of everything the script stores |

To get the untouched site back: Appearance → Site theme → **Site default**, and Page → turn off **Enable page tweaks**.

## Your data

- Collections, followed artists and settings live in the script manager's storage, in this browser only. Nothing is sent anywhere
- **Data → Export** saves one JSON file; **Import** restores it (Merge adds to what you have, Replace overwrites)
- The blacklist and the site theme are the site's own cookies and are not part of the export
- The script does not use the site API. It reads the pages you open and makes a request only for an action of yours: favorite a post, sync favorites, type in a tag field, scroll for the next page, open a feed that spans several searches, press Refresh on Following. Requests go one at a time with a pause

## Limits

These come from the site and cannot be fixed in the script.

- The post count of a dynamic collection with several tags is a lower bound, shown with "+". The exact number is known only for a single tag
- "No new posts since" on an artist card is the day the script first saw the artist's newest post, not the date of the post
- The site answers "too many requests" when asked too often. Refresh and favorites sync stop at the first such answer; wait and start again
- A cover or a count for an artist or a collection appears after its page was opened once, or after Refresh

The full list is in [docs/site.md](docs/site.md).
