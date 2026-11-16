# Changelog

What changed for the user in each version, newest first. Versions before 0.12.0 are not listed.

## 0.37.2

- The download button of a post could still save a web page instead of a picture: the picture host was asked without being told the request comes from the site. Downloads now say so

## 0.37.1

Removed:

- "Hide seen posts" and "Recent searches" are gone from the search panel

Fixed:

- The download button of a post saved a web page instead of the file on some posts. The file is now taken from the player for a video, from the "Original image" link for a picture, and an address that is not a picture or a video is never downloaded
- A click anywhere on the picture of the player plays and pauses, every time. It used to work only through the play mark, which is gone once playback has started
- An animated GIF, which the site shows through the video player, starts by itself, muted and looped
- The tag list in the sidebar was cut off on a page whose content is shorter than the window
- "Check for new" now also refreshes the cover and the post count of every saved search, so a new saved search gets its cover without being opened. The run is about twice as fast. A search checked for the first time becomes the point later checks are measured from
- Artists: the Follow button now appears in every row
- Tags: Follow and "Save as collection" now appear in every row
- A setting written from one tab could undo what another tab had saved in the meantime, such as which tag groups are collapsed

New:

- RuleDesk → Downloads → "File name": the name saved files get, for the download manager and for the button of a post alike. In square brackets it takes [id], [md5], [rating], [score], [width], [height], [owner] and [date]; a line under the field shows what the mask gives
- The search field of Posts and Feed has a magnifier, a button that clears it and a "?" with the site's search syntax. The filters of Collections and Following look the same and say in their "?" how to filter by several names
- The RuleDesk item in the header is a gear

## 0.37.0

Posts and a post page:

- A post page has a download button beside "Original": it saves the original file of the post. No API key is needed
- A click on the picture of a post opens it over the page: scroll to zoom, drag to move, double click for actual size, Esc to close. Pictures and GIFs; a video keeps its player. Switch: RuleDesk → Page → "Zoom the picture on click"
- "Sidebar on the right" in RuleDesk → Page puts the tag sidebar of Posts and of a post page on the right. Off by default
- "Motion" in RuleDesk → Page: thumbnails lift a little under the pointer, buttons change smoothly, menus and dialogs fade in. On by default

Following and the feed:

- Follow now works on characters and copyrights too: their rows in the tag sidebar get the same button. The Following page shows what each entry is and gets a "Type" filter once something other than an artist is followed
- Groups on the Following page: "Select", pick entries, "Group…", name a group or pick one. A "Group" filter appears in the toolbar; a group exists while something is in it
- A number beside "Feed" in the menu says how many posts of the feed's first page are new. For this the script asks the site for that page when a page loads, at most once in 15 minutes; switch: RuleDesk → Page → "New posts counter beside Feed"

Collections and Statistics:

- "Check for new" on the Collections page reads the first page of every saved search, one at a time with a pause, and marks the cards with posts newer than the ones you saw last: "Dynamic · new". Opening the search clears the mark
- Statistics has a "History" block: a line for favorites, followed tags and collections, from a point kept for every day you open the site
- A reminder to make a backup: a dot on the RuleDesk icon and a line in RuleDesk → Data when the last export is more than 30 days old, or when there has been none after two weeks of use

The site's other sections:

- Forum: a topic that is new, or whose row has changed since you opened it, is marked "new" or "updated", with "Mark all as read" above the list. Nothing is requested for it
- Artists: a Follow button in every row
- Tags: Follow (artists, characters, copyrights) and "Save as collection" in every row

## 0.36.0

- Several posts go into a custom collection at once. On Posts: "Select posts" under the search panel, pick posts on the page, "Add to collection (N)". On Favorites: "Select", pick posts, "Add to collection". A dialog lists your custom collections and has a field for a new one; afterwards a line says how many posts were added and how many were already there
- "Select posts" on Posts no longer needs the download manager: it is there without an API key. "Download selected" and "Download results" still need the key
- A post picked on Posts gets a tick in its corner as well as the outline

## 0.35.2

- The row at the top of Favorites and the toolbars of Collections and Following have the same space above them as below them. The space under the header used to add to the one above
- Favorites search no longer takes `sort:random`: a random order is the Shuffle button, which shows whether it is on. With Shuffle on, an order typed into the search is not applied, and a line under the row says so
- The commands in the search help are in a fixed-width font, so the spaces in `( cat ~ dog )` can be seen; the note under them is shorter
- The example of leaving a tag out in the search help is `-sketch` instead of `-video`, which read like the Videos switch beside it

## 0.35.1

- Favorites: the top of the page is one row. The count, "Random post", "Select" and the "⋯" menu moved to the right end of the row of filters, and the row with the "Favorites" title is gone: the menu already shows where you are. While the list is narrowed the count is the number of posts found
- Collections and Following: the title above the toolbar is gone for the same reason. On all three pages it is still there for screen readers
- Favorites search understands more of the site's syntax: `( cat ~ dog )` for either tag, `sort:id:asc` and `sort:id:desc`. The "?" in the field lists all of it
- The site's other metatags (`rating:`, `score:`, `user:`, sizes and the rest) and the fuzzy `tag~` cannot be answered from the local list, which knows only the tags and the id of a favorite. They are no longer searched as tags, which found nothing: a line under the row names the terms that were set aside

## 0.35.0

The header and the Favorites page, after a design review:

- The site's title stands in the row of the menu instead of in a row of its own: the header is one row shorter
- The menu shows where you are on the Favorites page too. The current section is marked by the text colour and a line under it, not by a tinted background
- Favorites, the top of the page in two rows. The title row has the count, "Random post", "Select" and a "⋯" menu; it scrolls away with the page. Only the row of search and filters stays at the top of the window
- The search field is wider, has a magnifier and a button that clears it. What `-tag` and `tag*` mean is under the "?" in the field instead of in the placeholder
- The two switches are named, "Type" and "View". "Shuffle" keeps its name and shows that it is on
- "Download all" moved into the "⋯" menu and asks first: the dialog gives the number of files, says when the favorites were last synced, and offers "Sync first" when that was more than a week ago. "Sync favorites…" in the same menu opens RuleDesk settings, where the sync is
- While posts are being selected, the selection bar takes the row that stays at the top, so "Remove selected" is at hand after scrolling. In a list without pages its button is "Select loaded"
- In a narrow window the row gives up the names of the switches first, then the width of the search field, and wraps only after that
- The chosen option of every switch of options (Favorites, Collections, Following, settings) now stands out from its track in all four themes
- Secondary text is darker in Light and in Site default and lighter in Site dark: it was under the 4.5:1 contrast there

## 0.34.0

- Favorites: a post you make a favorite with the star is in the search on the Favorites page at once, without waiting for "Sync favorites"
- Favorites: "Shuffle" shows the list in a random order, "Random" opens a random favorite
- Statistics: "Top tags in favorites", the twenty most frequent tags among your favorites
- Collections: a sort list, "As created", "By name" or "By size"; the choice is remembered

## 0.33.3

- Animated GIFs carry a small "GIF" label in the corner of the thumbnail, on Posts, Feed, Favorites and Comments. The site marks them only with the `animated_gif` tag
- The held sidebar is full height again and gets shorter only at the very end of a page. While it has more below what is shown, its bottom edge fades out instead of being cut off

## 0.33.2

- The held sidebar no longer slides up under the header at the end of a page
- Its scrollbar takes the colours of the theme instead of being white

## 0.33.1

- The header now stays at the top by default. The setting is renamed to "Keep the header and the sidebar in place while scrolling" and still switches it off
- With it, the sidebar of Posts and of a post page stays beside the content while you scroll. It is taller than the window, so it scrolls inside itself

## 0.33.0

The header, redrawn:

- Three zones. On the left what is used all the time: Posts, Feed, Collections, Following, Favorites. Then a "More" menu with the site's rarely used sections: Comments, Wiki, Aliases, Artists, Tags, Pools, Forum, Help. On the right Statistics, My Account and RuleDesk as icons; point at one for its name
- The second row on Posts: Video, Random and Help get icons, and Upload and Upload Video become buttons on the right
- New setting in RuleDesk → Page: "Keep the header at the top while scrolling". Off by default

## 0.32.7

- Fixed: on a pool page every thumbnail shrank into a small bin button and they piled up in one place. The styles of the Favorites bin also matched the links of pool thumbnails; they are now limited to the Favorites page

## 0.32.6

- The page no longer jumps up right after it appears. The site's menu items that "Clean header menu" hides were hidden a frame too late: for that frame the menu was two rows tall, then shrank to one and pulled the whole page up
- The filter panel no longer grows a moment after it appears: its "AI posts" row is drawn together with the rest of the panel

## 0.32.5

- The filter panel no longer moves up a moment after the page loads. The site's own "Filter AI" row, which the panel replaces, used to show for an instant and then disappear; it is now hidden before the page is first shown

## 0.32.4

- Favorites: the grid looks as on Posts again: a square cell with the picture in its middle. The bin and "+" sit in the top right corner of the picture itself
- Favorites: the bin removes a post in place on the ordinary page too, without reloading it and jumping to the top
- Favorites: the pager keeps its "last page" button, and it now leads to the real last page

## 0.32.3

- Infinite scroll: after two pages in a row that add nothing to the screen (all their posts hidden, or repeats), loading pauses and shows "Load more" instead of walking the whole search by itself. Each press loads one more page

## 0.32.2

- Fixed: since 0.32.0 the Posts page showed no thumbnails, and with infinite scroll on it kept loading page after page. A style rule meant for emptied Favorites cells also matched every thumbnail of a search page

## 0.32.1

- Video preview on hover now works on posts uploaded a few minutes ago. Their thumbnail is still on the site itself rather than on the thumbnail server, and the script did not build a video address from it

## 0.32.0

Favorites: search, filter and endless scrolling, all without leaving the page.

- "Sync favorites" now also remembers the tags and the preview of every favorite. Run "Full resync" once to build this index for the whole list; it is kept in this browser and is not part of the Data export
- A search field in the header: tags separated by spaces, `-tag` to exclude, `tag*` for any ending. It searches all indexed favorites at once
- An "All / Images / Videos" switch
- A "Pages / Scroll" switch: Scroll shows the whole list as one page that grows as you scroll, without requests
- While a search, the media switch or Scroll is on, the bin removes a favorite in place, without reloading the page
- A favorite removed from the grid no longer leaves an empty place in its column

## 0.31.1

- The page no longer "unfolds" while it loads. The script's menu items (Feed, Collections, Following, Favorites, Statistics, RuleDesk) are in the menu before the page is first shown, instead of pushing in between the site's items a moment later
- The place of the search panel is reserved at the height the panel really has, so the sidebar under it does not jump when the panel appears. This shows after one page load, when the height has been remembered

## 0.31.0

- Favorites: "Download all" in the header saves the original file of every favorite, into a "Favorites" folder. It needs your API key, like the other downloads, and goes by the local list: run "Sync favorites" first if that list is out of date
- Favorites: the pager no longer offers the empty pages past the last real one (an old site bug). This works once "Sync favorites" has finished at least once

## 0.30.1

- Favorites: pictures keep their shape instead of being cropped to squares; the rows still sit close, each as tall as its tallest picture
- Favorites: the buttons on a thumbnail look and sit as on Posts. "Remove" is a bin button in the top right corner, "+" is under it
- Search panel: the "Source" block (All / Feed / Favorites) is removed. It did not filter anything, it only opened the Feed or the Favorites page, and the header menu already does that

## 0.30.0

Favorites, first part of the rework:

- A header with the title, the number of favorites and the buttons; it stays at the top of the window while the page scrolls
- Every thumbnail is a square tile with rounded corners; the picture fills it and is cropped around its centre. The gaps between rows are gone
- The "+" button on a thumbnail adds the post to a collection, as on Posts. It sits in the top left corner; "Remove" keeps the top right one

## 0.29.5

- Collections, Following, Statistics and Settings: buttons, fields and switches are a step larger (32 px tall, 13 px text). Tiles and the panels on the site's own pages are unchanged

## 0.29.4

- Fixed: on Favorites the hover video preview could appear shifted and as wide as the whole cell, so the post looked doubled. The preview is now placed over the picture by measuring it

## 0.29.3

- Following: the row of buttons sits as close to the title as on Collections. The "Sort" caption over the list is gone; its options now read "By name", "By posts", "Recently followed"

## 0.29.2

- The switches with several options (All / New, Tiles / List and the like) are the same height as the buttons and fields next to them; before they were taller

## 0.29.1

- Following: the "Artist tags" row is replaced by an "Add artists" button that opens a window, like "New" on Collections. The window closes when every tag was added and stays open with a note when some were skipped
- Video preview: a post whose preview failed to load is tried again half a minute later. Before, one error switched the preview of that post off until the page was reloaded
- New [FAQ](FAQ.md) with answers to common questions

## 0.29.0

- Statistics: a "Site profile" block with a "Refresh profile" button. It reads your profile page on the site (two requests per press) and shows the account age, level, uploaded and deleted posts, comments, tag edits, note edits and forum posts
- Collections and Following: the tiles now span the whole window, while the title, the fields and the list view stay in the centred column. The "Full-width Collections and Following" setting is removed
- Collections and Following: tiles are the same size on both pages
- Following: the "Refreshed N of N" line closes by itself after two seconds; an error stays until closed
- Settings → Blacklist: the tags are listed under the field and its note, so a long list does not push the field away
- Feed: the bar with the count of new posts is as wide as what it holds
- Statistics: "Collections by type" instead of "by kind"

## 0.28.0

- Collections and Following: a "Tiles / List" switch. The list shows one item per row with a small cover; the choice is remembered for each page
- New setting in RuleDesk → Page: "Full-width Collections and Following". Off by default. When on, these pages and a collection's page fill the window from the left edge, and Settings and Statistics move to the left as a narrow column
- Statistics: a ring for the kinds of collections (Custom / Dynamic) and bars comparing collections by number of posts. The bars for artists and the "Artists with new posts" tile are gone

## 0.27.1

- Fixed: following an artist with the Follow button in the tag sidebar erased the cover, the post count and the newest post of every artist already followed. They are kept now. Covers lost before come back with Refresh on the Following page
- Following: the "Artist tags" row stays at the top of the window together with the filter row
- Following and Collections: the filter takes several names at once (artists: separated by spaces or commas; collections: by commas) and shows whatever matches any of them. The filter field grows as you type

## 0.27.0

The site's Comments page:

- A long tag list of a post is folded to three lines, with a "Show all N tags" button under it
- Video posts get the outline, and "Video preview on hover" works on them
- "Hide tag tooltip on thumbnails" works there too

Collections and Following:

- The row with the filter and the buttons stays at the top of the window while the list scrolls
- The filter fields are short instead of stretching across the page; the "Artist tags" field on Following starts short and grows as you type

## 0.26.0

Second design pass over the site's own pages:

- Wiki → Create: the intro text and the field labels are readable; before they were dark grey on a dark page
- Aliases: the example line is no longer pure red
- Artists: the links under the pager are a normal size
- My Account: the list sits in a card, the captions are quiet, "To main post page" is an ordinary link instead of a huge heading
- Help: each group of links is a card

## 0.25.4

- Favorites: the hover video preview lies exactly on the thumbnail. Before it appeared shifted and wider than the picture, so the post looked doubled

## 0.25.3

- Favorites: "Remove" is now a small button in the top right corner of the preview, shown while the pointer is over the post. The separate line under each thumbnail is gone, so the rows sit closer. The button is hidden while posts are being selected

## 0.25.2

- Favorites: video posts get the same outline as on the Posts page, and "Video preview on hover" works there. The site does not mark videos on that page, so the script reads the `video` tag from the thumbnail
- Favorites: thumbnails have rounded corners, and "Hide tag tooltip on thumbnails" now works there too

## 0.25.1

- Post page: a gap between the picture and the side panel; they were touching

## 0.25.0

Design pass over the site's own pages:

- Text fields and selects of the site's forms have a normal height and padding; before they were thin slits next to full-size buttons
- The "Choose File" button on the upload pages follows the theme
- Forms (upload, add alias, artist, tag, pool) no longer have stripes across their rows
- Lists (aliases, artists, tags, pools) get the same frame the forum list has
- Comments and forum posts use the free width of the window instead of a narrow fixed column
- Favorites: "Remove" under a thumbnail is small and quiet, red under the cursor

## 0.24.8

- My Account: the Logout heading has the same colour as the other headings

## 0.24.7

- Links have one colour: a visited link is no longer grey while an unvisited one is blue (seen on the account page, where the headings were three different colours)

## 0.24.6

- The "Download folder" setting is removed: where files go is the browser's own download folder, and a script cannot change that. Each download still gets a folder named after the collection or the search, with no fixed root
- The NEW mark on feed thumbnails and keyboard focus outlines now take their colour from the theme

## 0.24.5

- Downloads no longer go into a fixed `RuleDesk` folder: each download gets a folder named after the collection or the search, directly in the browser's download folder
- **Download folder** in RuleDesk → Downloads: a folder inside the browser's download folder (for example `art/rule34`) under which downloads are put. The choice is remembered

## 0.24.4

- **Faster on a large library.** The modules of a page now share one read of the stored data instead of each reading it again, and a write no longer validates the data twice. Measured on 20,000 seen posts and 300 artists: a results page went from 310 ms of storage work to 50 ms
- The download manager takes files only from the site's own servers, whatever the API answers
- Importing a file drops picture addresses that are not on the site

## 0.24.3

- Fixed: a download stopped with "API answer has no readable body". The API is now asked with a plain request from the page, which it allows, instead of through the script manager
- The extra permission for `api.rule34.xxx` is no longer needed and is removed
- If the API does not answer a group of post ids, the posts are asked for one by one

## 0.24.2

- Fixed: a download stopped with "Cannot read properties of undefined (reading 'trim')". The script now reads the API answer in every form the script manager gives it
- A download for which the API returns no files says so instead of finishing with nothing

## 0.24.1

- **Downloads settings: one field.** Paste the whole line the site shows (`&api_key=…&user_id=…`); the script splits it into the key and the user ID itself

## 0.24.0

- **Download manager.** With your own API key in RuleDesk → Downloads, download buttons appear: "Download all" and "Download selected" on a custom collection, "Download results" and "Select posts" under the search panel on a results page. The files are found through the site API (one request per up to 1000 posts) and saved one by one into `RuleDesk/<name>`
- A panel in the corner of every page shows the job with Pause, Resume and Cancel. The job survives a page change; a file that fails is retried once, counted and skipped
- The single "Download original" button on the post page is removed, and so is reading post pages for a collection download
- The script asks for one more permission: requests to `api.rule34.xxx`. It is used only by the download manager and only when a key is stored
- The repository is now `KazeKaze93/RuleDesk`; the install and update address changed with it. The old address still answers

## 0.23.1

- **Statistics is its own page** in the site menu, after Favorites. RuleDesk → Page → "Statistics in site menu" hides it (on by default). The block in settings is gone
- Export and Import are removed from the Collections page. Collections travel in the one file of RuleDesk → Data

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
