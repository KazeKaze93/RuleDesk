# RuleDesk

A userscript for `rule34.xxx`. It adds a feed of the artists you follow, collections, search inside your favorites, a reworked search panel and post page, a download manager, statistics and themes, and it tidies the site's own pages. It runs in your browser on the site's pages, keeps all its data on your computer and has no server.

![The Favorites page with the script's column of filters](docs/img/favorites.jpg)

*Screenshots here are taken on a local test page with grey boxes in place of pictures.*

- [What it adds](#what-it-adds)
- [Install](#install)
- [Settings](#settings)
- [Themes](#themes)
- [Your data](#your-data)
- [What the script does not do](#what-the-script-does-not-do)
- [Every feature in detail](docs/features.md)
- [FAQ](FAQ.md)
- [Changelog](CHANGELOG.md)
- [Developer documentation](docs/)

## What it adds

A short tour. Each item is described in full, with what it asks the site for and how to switch it off, in [docs/features.md](docs/features.md).

### A menu that fits in one row

The site's long menu becomes three zones: **Posts, Feed, Collections, Following, Favorites** on the left, the site's other sections under **More**, and **Statistics**, **My Account** and **RuleDesk** (settings) as icons on the right. The header and the sidebar stay in place while you scroll. A number beside Feed says how many new posts are waiting.

### Feed and Following

**Follow** an artist, a character or a copyright with the button next to its tag. **Feed** is one grid with the posts of everyone you follow, newest first, with NEW marks and "Mark all seen". **Following** lists them as cards with a cover, a post count and a "new" mark; filter, sort, group, unfollow several at once.

![The Following page](docs/img/following.jpg)

### Collections

![The Collections page](docs/img/collections.jpg)

- **Custom**: posts you pick, with the "+" on a thumbnail or a post, or several at once with "Select" in the search panel. Reordered by dragging. A post opened from one gets previous / next arrows through the collection
- **Dynamic**: a saved search. "Save as collection" in the search panel; "Check for new" tells which of them got new posts

### A search panel instead of typing syntax

![The search panel](docs/img/search-panel.jpg)

Under the site's search field: the tags of the query as chips (click to exclude, cross to remove), Images / Videos, sort order, minimum score, AI posts on or off, Reset, "Save as collection", "Select". A dot on a chip has the colour of the tag's kind: artist, character, copyright, metadata.

### Search inside your favorites

The site cannot search favorites. After one **Sync favorites**, the Favorites page gets a column of filters beside the grid, as on Posts: search by tags (`tag`, `-tag`, `ta*g`, `( a ~ b )`) with suggestions from your own favorites as you type, Images / Videos, endless scroll, Shuffle, Random post, and Select to remove several or add them to a collection.

### The post page

Favorite, Collections, Vote, "I came", Original and Download as buttons; details, comments and related posts in three tabs; the site's own actions in one list. Related posts are posts by other artists that share tags with the open one: a mix by its rarest tags, or by one of its characters or copyrights. A deleted post gets a block in the place of the picture that says why it is gone. A click on a picture opens a zoom viewer. GIFs play on the page. The video player keeps volume and speed, toggles on a click and can fit the height or the width.

### The grid

A favorite star and "+" on thumbnails, three sizes, infinite scroll, dimming of posts you opened, hiding of blacklisted posts, optional video preview on hover, a "GIF" label, a play sign on videos, folding tag groups in the sidebar, the wiki text of a tag on its "?".

### Download manager

Saves the original files of a custom collection, a whole search, picked posts or all your favorites into a folder in your browser's downloads, with a name you choose (`rule34-<id>` by default). A corner panel shows progress, Pause, Resume, Cancel. It needs your own API key from the site's account options page; a single post's Download button does not.

### Statistics

![The Statistics page](docs/img/statistics.jpg)

Counts of what you keep, the top tags of your favorites, and the numbers of your site profile, on one screen.

### The site's other pages

Forum: marks for new and updated topics, "New for me", "Mark all as read". Artists and Tags: Follow and "Save as collection" in each row. Upload: a drop zone with a preview, a tag count against the site's minimum, repeated tags dropped, and your own sets of tags as buttons under the Tags field.

![The Upload form](docs/img/upload.jpg)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Open this link and confirm the installation:
   https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
3. In Tampermonkey open Dashboard → Settings → Security → Content Script API and choose **UserScripts API Dynamic**. Without it the site's original look flashes on every page load and pages open slower.

**What it was tried on.** Desktop Chrome (158 on Windows) with Tampermonkey, in the UserScripts API Dynamic mode of step 3: that is the only setup the script is made and checked on. Not tried: Violentmonkey and other script managers, Firefox and other browsers, phones and tablets. It may work there; if it does not, a report with the browser and the manager named is welcome (see "Found a bug?" below).

Updates arrive through the script manager from the same link. After an update reload the site's page: an open page keeps running the old version.

## Settings

![The settings page](docs/img/settings.jpg)

Header menu → the gear (**RuleDesk**). The sections are listed on the left, with a search over them.

| Section | What is there |
|---|---|
| Appearance | Theme, grid size and Motion; for the Custom theme a background picture |
| Header … Collections | A switch for each page feature, by the part of the site it changes. One switch over them, "Enable page tweaks", turns all of them off |
| Favorites | Favorite buttons in the grid; Bulk remove favorites; Sync favorites and Full resync |
| Downloads | The download manager's switch, your API key and the file name of saved files |
| Upload | Your sets of tags for the Upload page |
| Blacklist | The site's tag blacklist for this browser |
| Data | Export and import of everything the script stores; when the last backup was made |

To get the untouched site back: Appearance → Site theme → **Site default**, and turn off **Enable page tweaks** at the top of the settings.

## Themes

| Theme | What it is |
|---|---|
| **Light**, **Dark** | The script's own themes. The whole site is restyled. This is where the script looks the way it was designed |
| **Custom** | Light or Dark with your background picture |
| **Site default**, **Site dark** | The site's own look. The script restyles nothing of the site there; its additions are drawn in the site's colours and can look out of place beside the site's plain controls. Light, Dark or Custom is recommended |

## Your data

- Collections, followed tags, marks and settings live in the script manager's storage, in this browser only. Nothing is sent anywhere
- **Data → Export** saves one JSON file; **Import** restores it (Merge adds to what you have, Replace overwrites). This is the only way to move to another browser
- The blacklist and the site theme are the site's own cookies and are not in the export. Neither is the API key
- Two requests are made without an action of yours, and each has its own switch in the settings (RuleDesk). The counter beside Feed asks for the first page of the feed, at most once in 15 minutes. The kind of a tag the script has not met yet is asked of the site's tag suggestions, once for a tag, to colour its chip
- Otherwise the script reads the pages you open and makes a request only when you do something that needs one: favorite a post, sync favorites, start a download, type in a tag field, scroll for the next page, open a feed that spans several searches, press Refresh or Check for new, open Statistics (it reads your profile page, at most once in 15 minutes), click the "?" of a tag, open the Related posts tab of a post or press "Another mix" there. Requests go one at a time with a pause

## What the script does not do

These come from the site, or from what a userscript is, and are not bugs.

- **No background updates.** Covers, counts and "new" marks change when you open a page or press Refresh / Check for new. The site refuses frequent requests
- **No sync between browsers or devices.** There is no server; use Export and Import
- **It cannot show what the site does not give.** No post dates in the grid, no avatars, no exact count for a search of several tags (shown as "12,516+")
- **It does not touch your account.** Login cookies are not read, account settings are not changed
- **Files can only be saved into the browser's download folder**
- **"Too many requests".** Refresh, Check for new and favorites sync stop at the first such answer from the site; wait a minute and start again
- **A cover or a count** for a followed tag or a collection appears after its page was opened once, or after Refresh
- **When the site changes its pages**, a feature on the changed page can stop working until the script is updated. The site itself keeps working

The full list is in [docs/features.md](docs/features.md#what-the-script-will-not-do); the technical one, with numbers, in [docs/site.md](docs/site.md#limits-that-come-from-the-site).

## Found a bug?

Report it in one place: [Issues on GitHub](https://github.com/KazeKaze93/RuleDesk/issues/new/choose). The form asks for what is needed to find it: the version of the script (RuleDesk, the gear in the header: "Settings · 0.74.3" under the name), your browser, your script manager and the theme, the page, and what you did. Do not paste your API key. Issues are public: crop a screenshot to the part that is wrong.

## Licence

RuleDesk is free software under the [GNU General Public License, version 3 or later](LICENSE). The built file also contains Preact, Zod and SystemJS, each under the MIT licence; their notices are at the end of the built file and in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
