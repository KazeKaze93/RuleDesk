# Changelog

What changed for the user in each version, newest first. Versions before 0.12.0 are not listed.

## 0.60.0

- The settings are laid out anew. On the left, held in place, is the list of sections with "RuleDesk", "Settings" and the version of the script over it; beside it a column of settings 720 px wide, so a name and its switch are near each other. The block "Page" and the folding of blocks are gone: Header, Grid and thumbnails, Post page, Video, Feed, AI posts, Search and sidebar and Collections are sections like Appearance, and after a rule come Favorites, Downloads, Blacklist and Data. The section being read is marked in the list
- A search over the list finds settings by their names and descriptions: rows that do not match are hidden, sections with nothing left too, and what matches is painted. When nothing matches there is "Clear"
- A section has an address, "#rdw/settings/video". "Settings" in the line about AI posts hidden everywhere opens the AI posts section
- A section is a name and a card of rows. The lines are between the rows of a card, the room is between the cards. A description is close under its name, and the switch is in the middle of the two
- "Enable page tweaks" is a card of its own over the sections. A row that cannot be changed while it is off is dimmed whole
- "Download manager" is in Downloads, "Bulk remove favorites" in Favorites, "Motion" in Appearance; the groups "Other" and "Favorites page" are gone. The hint of "Artists per search" reads "0 means the default, 400."
- Statistics: "Top tags in favorites" shows at once what was counted the last time and puts it right when the count of now is ready. It used to stand grey for a moment at every opening

## 0.59.0

The rest of the designer's remarks, in one release.

- RuleDesk → Page: the switches are in groups with headings: Header, Grid and thumbnails, Post page, Video, Feed, AI posts, Search and sidebar, Collections, Favorites page, Other. "Enable page tweaks" is the first row and says what it does: "Off: the site looks as without RuleDesk"; while it is off, the switches of the features are disabled. Descriptions are larger
- Settings: a list and a number stand as a switch does, the name on the left and a narrow control on the right. "Artists per search" has its "0 = 400" as a line under the name
- The Custom theme: the label of the background image is in one line above the field, a small preview of the picture is beside it, and "Reset theme" is a button that asks first
- Settings → Favorites: at rest one line, "11,961 favorites · last sync 17 Nov 2026, 11:12", and the two buttons; while it runs, the bar, "Page 1 of 262" and Stop; after a stop, Resume. One explanation in place of three, with how long a full resync takes, counted from the pages
- Settings → Downloads: each file name mask has a name, "Site + ID — rule34-19374686.jpg", and "Custom…" is the first of the list. Save is disabled while the key field is empty. How to get the key is under its field, where the files go is under File name
- Settings → Data: "No backup yet" is a plate with a warning and Export in it. The two switches are at the right. Merge and Replace are asked after a file is picked for Import, and Replace asks once more
- Statistics: the place of "Top tags in favorites" is taken at once by grey rows, so the page does not shift. "Collections by posts" is names and numbers, the largest first, with no bars. The ring of the kinds of collections is gone; the Collections tile says "3 custom · 8 dynamic". The account age reads "Since Aug 2019" with the years under it. "Site profile" is a block with a heading. Dates read "17 Nov 2026, 11:12"
- The downloads panel: the title says what is done, "Downloading “test”" or "Downloading 3 selected posts"; the stage is in plain words, "Looking up files… 1 of 3"; a pause says why, "Paused: started in another tab or session · 2 of 3 files"; the panel can be minimised into a small plate with the percent. A job left paused by another tab is shown at once; it used not to be
- The search panel on Posts: the buttons are always a column
- Collections: the sort reads "Newest first", "Oldest first", "Name", "Most posts"; "Newest first" is new. A filter that found nothing says "No collections match “…”." and has "Clear filter"; the same on Following
- The page of an empty collection has no Shuffle and no Select
- Every icon button of the script has a hint under the pointer

## 0.58.1

- The button of a group's actions is on the tab of the open group, and there it is always seen; the other tabs have none. Shown under the pointer only, it was not found. Its hint is "Group options", and its menu reads "Rename…" and "Delete group…". The right button of the mouse opens the same menu on any group
- A card carried to a tab is carried as in 0.57.1 again: what the browser shows by the pointer, and the card fading in its place

## 0.58.0

- Following and Collections: when there are more groups than fit the row, the rest are behind "More (N)" at the end of it. "All" is always the first, "No group" and "New group" the last, and between them as many groups as fit. The row is counted again when the window gets another width and when a group is added. It used to wrap into a second row
- The open group always has a tab: picked from "More", it takes the last place in the row, and the group that was there goes to the menu
- The groups stand in the order they were made, in the row and in the menus. They used to stand by name. A renamed group keeps its place
- With more than ten groups the "More" menu and the "Move to group" menu have a field to find a group by name, and the field has the focus at once. Enter picks the first found; the up and down arrows go through the items; Esc closes the menu. "New group…" is always the last item
- A long name is cut on its tab after 20 characters; whole, it is in the hint of the tab and in the menus. The name of a group may be 40 characters long, and the window of a new name says how many there are

## 0.57.3

- The tabs of the groups on Following and Collections look as the tabs in the header of the site do: words with no frames, a thin line under the row and a blue one under the open tab, whose name is bold. The count is smaller and grey, so "11 2" reads as a name and a number. "No group" is the last and quieter; "New group" is at the right end of the row
- The button of a group's actions comes under the pointer and for the keyboard, in the gap after the tab, so nothing moves when it comes; the right button of the mouse opens the same menu
- The left and right arrows go from tab to tab

## 0.57.2

- Following and Collections: a card carried to a tab goes with the pointer whole, cover, name and caption. It was one picture of the cover, the one the drag began on. The card left in its place is fainter

## 0.57.1

- The tabs of the groups on Following and Collections are framed, each one a button of its own, and the open one is in the accent colour. The button of a group's actions is a part of its tab and is always there; it used to be hidden until the pointer came, with an empty gap in its place
- Following: the buttons in the corner of a card, "Move to group" and the cross, are there under the pointer, as on Collections. On every card at once they crowded the covers
- Collections: a card has a cross that deletes the collection, after a confirmation. It used to be done only from the page of the collection or from a selection
- Dragging a card onto a tab is animated: the card fades in its place, the tabs that take it are outlined and pulse, the one under the card grows, and the one that took it nods. With reduced motion set in the system, nothing moves

## 0.57.0

- Following and Collections: groups are tabs over the list. "All", each group with how many are in it, "No group" for the rest, and "New group". A card is in one group or in none, so it is under exactly one tab. The list of groups in the toolbar of Following is gone
- A card is moved from one menu, "Move to group": the small button in the corner of a card, the same in the bar of a selection for several at once, and a card can be dragged onto a tab. The menu lists the groups, "No group" and "New group…". A name is typed only for a new group, so a slip of the keys no longer makes a second group; a name that is taken is refused
- A group is renamed and deleted from the button on its tab, or with the right button of the mouse. Deleting a group deletes nothing else: what was in it goes to "No group", after a confirmation that says how many
- A group stays when the last card leaves it, until it is deleted. It used to vanish
- Collections have groups too, their own, apart from those of Following. The group of a collection is on its card, after the kind and the count
- A card does not name its group under the tab of that group. The count in the toolbar is of what is shown: "11 of 22 artists", "3 of 11 collections"
- The post page: a new setting in RuleDesk → Page, "Load full-size image", off unless turned on. With it the file behind "Original image" is loaded and shown in place of the scaled-down copy the site puts on the page: sharper, and as wide as the room between the columns, never wider than it is. The copy stays until the original has come whole. An original is often several megabytes, so the page takes longer. It is not used for a GIF, which has its own setting, or for a video

## 0.56.1

- The bar of a selection: the hint of "Select all" and "Select page" names the key that does the same, Ctrl+A

## 0.56.0

- Selecting is the same everywhere: one bar with the same parts in the same order on Posts, Favorites, Following, Collections and the page of a collection. First how many are selected, then "Select all" (or "Select page") and "Clear", then what can be done with them, the dangerous action after a rule, and "Cancel". The number is said once, in "N selected", and not inside the names of the buttons. A name that ends in dots asks before it acts
- Following, Collections and the page of a collection: the bar stands in the place of the toolbar. The filters are away while posts or cards are being selected, so what is selected cannot change under the hand. The list under the bar does not move when the selection starts
- Posts: the bar is a card at the top of the column, over the search panel, which stays in view, dimmed and locked. "Select page" and "Clear" are new there
- Favorites: the bar is the same card. "Download selected" is new there, where downloads are set up
- Collections and the page of a collection: "Clear" is new on the first; on the second "Remove from collection" is the name of what was "Remove selected (N)"
- Ctrl+A selects all while something is being selected. In a field it selects the text, as before
- The post page: the key F does not work only while the keyboard is in the video itself. 0.55.0 said "not in the video player": the player of the site has no key of its own on F

## 0.55.0

- The post page: the key F adds the post to favorites and takes it out, as the Favorite button does. The hint of the button names the key. It is the place of the key that counts, so it works in the Russian layout too. Not while typing in a field, not with Ctrl, Alt or Shift, not while a dialog is open and not in the video player, which has its own keys

## 0.54.1

- The post page on a wide window: the picture and the side panel stand together, 24 px apart, in the middle of the page. In 0.54.0 the panel stood at the right edge, away from the picture, and Favorite was a long way to reach

## 0.54.0

- The post page on a wide window: the side panel stands at the right edge of the page and the picture is in the middle of the space that is left. They used to stand together at the left, with an empty strip at the right of the panel. The picture is the size the site gives it: it is not stretched, and no larger file is loaded
- Favorites: the card of followed tags under the filters is named "Followed tags". It was "Followed in favorites"

## 0.53.5

- The site's message to the user goes after two and a half seconds, not six

## 0.53.4

- The site's message to the user, the plate at the bottom of the window, goes by itself after six seconds, or at once on a click. It used to stay until the page was loaded again

## 0.53.3

- The site's message to the user, such as "You can only cum once a day" after a second "I came", is a small plate at the bottom of the window. It used to stand as a bar over the whole page and push the panel and the picture down

## 0.53.2

- The site's "New Account Safety Check", shown before the first comment of an account, is in the colours of the theme and not light green with a dark blue button. What it asks, its checkbox and its buttons are the site's and are not touched

## 0.53.1

- The post page: the side panel no longer rides over the header. At the bottom of a page a tall panel, as it is with the comment form open, is pushed up by the end of its block; it now goes under the header there

## 0.53.0

- The post page: "Write a comment" opens the site's form for a comment in the Comments tab, under the comments, where it is written beside what it answers. It used to open under the picture, at the other end of the page. The button is there on a post with comments too, not only on one without. The form is the site's own, with its fields and its address; only its place changes. The site's "Respond" link under the picture works as before

## 0.52.1

- Upload Video: the note about the rule change is inside the card, in the row of the button. 0.52.0 said so and did not do it: the note was looked for one level too high
- Comments of a post: "Change" of the order reloads the page, which is the site's doing; the panel now opens on Comments again after it, not on Info
- The post page: "Edit | Respond" under the picture is the size of ordinary links, not the largest text on the page

## 0.52.0

- Upload Video is laid out as Image Upload is: "My Tags" stands in the right column with the other fields and not under the file zone, the empty row of the site's form is gone, the progress of the upload is under the button, and the note about the rule change is inside the card, in the row of the button. The site's timing line under both upload forms is hidden
- Comments of a post: a post with none says "No comments yet" and offers "Write a comment", which opens the site's form. The line about the order is a small grey line and not a card; the line of score, "Up" and "Report comment" is small and grey; the rule after each comment is gone; "(0 hidden)" is not shown

## 0.51.1

- The viewer of the post page: a picture taller than the window is read as a page is. The wheel moves it up and down, and so do the arrows, Page Up, Page Down, Space, Home and End; it stops at its top and its bottom. Zoom is Ctrl with the wheel, the "+" and "−" keys and the buttons. A picture that fits the window is zoomed by the wheel as before
- "More" in the header: the names of the groups are small, faint captions with a rule under them, and the sections under them are in the colour of text; the two read alike before

## 0.51.0

From the design audit, layout:

- Collections: a cover is laid out for as many pictures as it has. One fills it, two stand side by side, three are one tall and two small; four are the grid as before. Empty cells of the grid looked like pictures that failed to load
- "More" in the header: two named groups, "Browse" (Tags, Artists, Pools, Aliases, Wiki) and "Community" (Comments, Forum, Help), each a column, in place of eight sections in the site's own order
- The viewer of the post page: a tall picture, a comic of several screens, opens at the width of the window from its top. Fitted whole it was a strip too narrow to read. "Fit" and zooming out still show it whole
- Artists: the Follow buttons stand in one line at the right edge of the name's cell, not a staircase after names of different length
- Tags: Follow and "Save as collection" show for the row under the pointer or the keyboard; "Following" and "Saved" stay in view

## 0.50.1

- Upload: "0 of 5 tags" is grey on a form nothing was done with, as 0.50.0 said it would be. The red was still in the stylesheet for the line as such; it is now only for a field that was left, or a form that was sent, with too few tags

## 0.50.0

From the design audit, forms and texts:

- Collections, "New": an error stands under the field it is about, and a name already taken is said while it is typed, with Create off until it is changed. Under the Custom / Dynamic switch a line says what the chosen kind is. The query field shows a real example, with "Same syntax as the site search." under it
- "Save as collection" on Posts: the name starts as the query, to be kept with Enter or typed over
- Upload: the reminder reads "0 of 5 tags" and turns red only after the field was left or the form was sent, not on a form nothing was done with
- Favorites: the button that confirms a removal reads "Remove 2"; the card under the filters is "Followed in favorites"; the download dialog says "28 original files: favorites matching jcm2, from all pages."; an empty Collection filter says how to see everything again
- Posts: "Min score" shows "Any" while empty; the note in "?" names the controls as they are labelled

## 0.49.1

- The keyboard's focus is the same blue ring on thumbnails, on the covers of posts in a collection and on every link and button of the site, not only in the header: on a thumbnail it was still the browser's white rectangle
- Tab goes through the header left to right, as it is drawn: Posts, Feed, Collections, Following, Favorites, More, then the icons. It used to go logo, My Account, Posts, because the site has My Account first in its markup; the uploads of the second row are last there too

## 0.49.0

From the design audit, one way of doing a thing in place of several:

- A dangerous action in a row of others (Delete on Collections and on a collection, Unfollow, "Remove selected" on Favorites, Delete of a saved search) is red words in a red frame. The filled red button is kept for the one that confirms it in the dialog: it used to be the loudest thing on the page
- The keyboard's focus in the header is the same ring as on every button and field of the script, in place of the browser's white rectangle
- A saved search opened from Collections has the head of a collection: "← Collections", the name, "Saved search"
- Forum: "All" and "New for me" are one joined switch, the chosen one lighter and heavier, as the other switches are

## 0.48.1

- Following, selecting: a card clicked and then unselected kept the blue frame of a selected one until something else was clicked. The frame is now for a selected card and for the card the keyboard is on

## 0.48.0

From the design audit, state that could not be seen:

- The post page: "Favorite" is the blue main button only until the post is a favorite; then it is a pressed button "In favorites", and its tooltip says a click removes it. "Vote" and "I came" stay pressed after they are used on the page. "Collections" reads "In 2 collections", with a tick, when custom collections hold the post
- Collections: "NEW" is a mark of its own beside the name, the same pill as on Following. The kind of a collection moved to the grey line under the name: "Dynamic · 2,715 posts", "Custom · 3 posts". The accent colour on a card is kept for news
- Collections and Following: a card under the pointer is only lighter. The accent frame is for the card the keyboard is on and for a selected one, which also gets a soft accent fill; hover used to look like selection
- Lists (Sort, kinds, groups, themes, Collection in Favorites): the chosen option has a tick and a heavier text; the fill is for the option under the pointer

## 0.47.2

- Following: the line "6 artists · Seen up to post #…" stands in the toolbar itself, after the filters, not under it
- Collections: the toolbar shows how many collections the filters leave, in the same place

## 0.47.1

- Following and Collections: the toolbar spans the width of the tiles, with the filters at the left and the actions at the right. Kept to a centred column, it broke into two rows with half the window free beside it
- Custom theme: the toolbar of Following and Collections was a slab of the page's colour from edge to edge of the picture. It is a card there now, rounded and slightly see-through, like the tiles; the line under it and the "Tags" heading on Posts have a backing only as wide as their words
- Favorites opened with "AI posts: Hide" or with Scroll remembered: for about a second the site's own grid was shown, small and with its frames, and then swapped for the script's. The site's grid is kept out of sight from the first paint
- Escape leaves the selection of posts, artists and collections, as Cancel does. A dialog, an open list or a field under the caret still take the key first

## 0.47.0

From the design audit, the things that broke work or misled:

- Favorites that were never synced: the card showed search and filters that changed nothing. Now it says "Favorites aren’t synced yet" and offers "Sync favorites…"; "Select" stays, because it works on the thumbnails of the page. The card becomes the usual one after the first sync
- Favorites with an incomplete index: the line "The index holds N of M favorites…" ends with "Sync now"
- "AI posts" while "Hide AI posts everywhere" is on: the switch is shown as it is, not to be changed, with "Hidden everywhere. Change in Settings" under it, the last words opening the settings at Page
- "AI posts" elsewhere: the label reads "AI posts in Feed", "in Following", "in Collections"; in the toolbars of Following and Collections it is the same two-option switch as everywhere, "AI: Show | Hide", in place of a list; in Favorites the filters stand together (Type, AI posts, Collection) before Sort and View; the setting has a short name and a line of explanation
- Deleting collections: the question names what is deleted, up to three names and "and N more"; on the page of a collection it names the collection and says the posts stay on the site
- Data → Import with "Replace": asks before erasing what is in this browser. Export stands first, and "Merge / Replace" stands with the Import it belongs to
- "Check for new" that stopped on an error: a plate that says why in words ("the site is asked too often", "no answer from the site") and a "Retry" button, in place of a grey line with "Failed to fetch"
- A download found waiting in a tab other than the one that ran it says so: "Paused · started in another tab; press Resume to go on here"
- Custom theme: the headings of the sidebar and the line under the toolbar of Following have a backing, so that they can be read on any picture
- Comments: the preview of a very tall post was a strip a few pixels wide; it is drawn at least 96 px wide
- "Select posts" is "Select", as on Favorites and Following

## 0.46.1

Three faults found in the design audit:

- A saved search opened from its card had no bar over the grid (name, Shuffle, Edit query, Rename, Delete) when the page under Collections already showed that very search, as it does right after "Save as collection". The link then changes only the end of the address and nothing is loaded; the bar is now drawn whenever that mark changes
- Feed, "Only new": after "Mark all seen" the posts just marked stayed on the page as if still new. The search is asked again with the new mark and shows what is new past it, or that nothing is
- "AI posts" in the sidebar: a query typed into the field and not searched yet was lost when the switch reloaded the list. It is searched for instead, as a change of Media or Sort does

## 0.46.0

AI posts are shown or hidden by the part of the site, not for the whole site at once:

- Posts, Feed, Following, Collections and Favorites each keep their own choice. Hiding AI posts on Posts no longer empties the page of a followed artist whose every post is AI
- The "AI posts" switch in the sidebar of a list belongs to the part the list is of, and says so: "AI posts · Feed", "AI posts · Following" (one followed tag, as a card of Following opens it), "AI posts · Collections" (a saved search). Any other search is Posts
- Following and Collections have the choice in their toolbar: it is what a card opens with, and what "Refresh" and "Check for new" read from the site
- Favorites has "AI posts: Show / Hide" in the card of filters. The site does not filter favorites, so the script leaves the posts tagged `ai_generated` out itself; the count, Select and "Download results…" follow it. It needs a synced index
- "Hide AI posts everywhere" in RuleDesk → Settings → Page overrides all of them; the controls then show "Hide" and cannot be changed. Turned off, every part goes back to its own choice
- What the site's switch was set to before this version is kept as the choice of Posts

How it works: the site keeps its switch in the cookie `filter_ai` and filters on the server. The script now writes that cookie, the third it touches after `tag_blacklist` and `theme`: when a link to a list is pressed, when Following or Collections is opened, and before its own requests for a list. A list reached some other way with the switch the wrong way round (an address typed by hand, another tab that moved the switch) is loaded once more.

## 0.45.3

- Favorites: with a search, a Type or a Collection set, the download is of what the list shows, not of every favorite. The button reads "Download results…", and the dialog names what narrows the list and the number of files, over all pages of the result and in the order shown. With nothing set it is "Download all…" as before

## 0.45.2

- Selecting posts on Posts and on Favorites: a post is marked the moment the mouse button goes down. It used to be marked on a full click, and a pointer that moved a little while the button was down started dragging the picture instead, so posts clicked quickly, in passing, were left unmarked

## 0.45.1

- Selecting posts on Posts and on Favorites: a thumbnail no longer lifts under the pointer while posts are being selected. With "Motion" on, the lifted picture stood out of the frame of a selected post

## 0.45.0

Favorites, two ways to narrow the list by what you have already sorted out yourself:

- "Collection" in the card of filters: "Not in any collection" shows the favorites you have not put anywhere yet, and each of your collections of posts shows the favorites that are in it. It works together with the search, Type and Sort; "Reset search" clears it too
- "Following", a card under the filters: the artists, characters and copyrights from your Following page that are among your favorites, each with the number of favorites, the most favorited first. A click adds the tag to the search, a second click takes it out. A dot shows the kind, in the colours of the tag chips. Twelve are listed, "Show all" opens the rest. The card is there only when you follow someone and the favorites are synced

Both use what is already stored in the browser: no requests to the site.

## 0.44.1

- Favorites: the "Tags in results" card is taken out. A list of the most frequent tags named what nearly every post has and did not help to narrow a search. The column is the one card again, and the index of favorites is read when you start typing or pick a filter, not on opening the page

## 0.44.0

Favorites, the rest of the column:

- "Tags in results": a card under the filters with the thirty most frequent tags of what is shown, each with its count. A click on a tag, or on its "+", adds it to the search; "−" excludes it. With nothing typed it lists the tags of all your favorites
- A condition that does not work here (`rating:`, `score:`, `user:` and the like) is said in a yellow plate under the field, for as long as it stands there: "rating: doesn’t work in Favorites. Favorites search uses tags only." It used to be a grey line
- "Reset search" under the filters clears the search and the Type; the order and Pages / Scroll stay as they are. It is there only when there is something to reset
- "Download all…" and "Sync favorites…" are quieter than "Random post" and "Select", which are used all the time
- The "?" of the field: `cat*` is listed before `ca*t`, and the metatags that work only on Posts are named in one line
- Suggestions: on the chosen line the whole tag is in the text colour; what was typed is still set off by its weight

Fixed, on every page of the site:

- A dialog opened from a block that stays in view while the page scrolls was drawn under the thumbnails: "Save as collection" and "Add to collection" on Posts, the download dialog, the playlist's dialogs. Every dialog is now drawn over the whole page, wherever it was opened from
- The list of "Sort" in the sidebar of Posts was cut at the sidebar's edge when the sidebar was short; it is drawn over the page too

## 0.43.5

- Favorites: the dialogs opened from the column ("Download all…", "Add to collection", the confirmation of a removal) are drawn over the page again. Since the buttons moved into the column the thumbnails lay over them

## 0.43.4

- Favorites: "Download all…" and "Sync favorites…" are buttons in the column, under "Random post" and "Select"; the "⋯" menu is gone. Each button has a row of its own
- Favorites: the grid no longer starts right under the header; it has the same space above it as the column

## 0.43.3

- Favorites: the strip over the grid is gone. The number of posts, Pages / Scroll, "Random post", "Select" and the "⋯" menu stand in the column with the filters, and the grid starts right under the header
- "Select" shows the selection bar at the top of the column, over the filters, which stay in view but locked until the selection is finished or cancelled

## 0.43.2

- Favorites: the column of filters is a card with a "Search" heading, as the search panel of Posts is, instead of controls lying on the page; a rule under the strip sets it off from the grid

## 0.43.1

- The favorites search by rating, score and size, added in 0.42.0, is taken out, with "Read ratings and sizes" in settings. It never returned anything: the site API does not answer a list of posts, only one post a request, which for a large list of favorites is hours of requests. `rating:`, `score:`, `width:` and `height:` are again listed as working only in the search on Posts
- Downloads of a custom collection, of picked posts and of all favorites no longer spend one request in every hundred on a question the API answers with nothing
- The pace of API requests and the waiting out of "too many requests" from 0.42.0 stay

## 0.43.0

Favorites, a column of filters instead of the row:

- The filters stand in a column at the left, as on Posts: the search with its suggestions, the terms of the search as chips, Type, Sort. The column stays in place while the page scrolls
- The terms of the search are chips under the field: a click on a chip excludes the tag, a second click includes it again, the cross takes it out. A group `( a ~ b )` is one chip
- Shuffle is the third option of Sort, beside Newest and Oldest, and no longer a button of its own: the switch always says what the order is. A click on Shuffle while it is chosen shuffles again
- Over the grid there is a short strip that stays at the top: the number of posts, Pages / Scroll, "Random post", "Select" and the "⋯" menu
- "Select" turns that strip into the selection bar, filled so that it is seen at once; the column is shown but cannot be changed until the selection is finished or cancelled
- The grid of the site is not wrapped or moved: the column is put beside it

Video thumbnails:

- A video is marked with a play sign in a small plate at the corner of the thumbnail, the same plate "GIF" has, in place of the frame around it. On Posts, in the Feed and on Favorites, in the Light, Dark and Custom themes
- RuleDesk → Page → "Play icon on video thumbnails": switched off, the frame is back. In Site default and Site dark the site's own frame stays either way

## 0.42.0

Favorites search by rating, score and size:

- `rating:safe`, `-rating:explicit`, `score:>=50`, `width:>=1920`, `height:<1000` work in the favorites search. The favorites page does not give these, so they are read from the site API with your own key: RuleDesk → Favorites → "Read ratings and sizes", a hundred posts a request. "Full resync" does the same when it finishes. Without a key nothing changes
- A search by rating, score or size says how many favorites it cannot see yet because they were not read
- The "?" of the field lists the new conditions

The site API:

- The API allows a key 60 requests in 60 seconds. Every request of the script now keeps one pace, about 54 a minute, whatever asks: a download in one tab and the reading of ratings in another no longer add up past the limit
- An answer of "too many requests" is waited out and asked again up to three times before a download or a reading stops with an error

## 0.41.2

- Favorites: Sort has two options, Newest and Oldest, both by when the post became a favorite. Newest is the page as the site gives it; Oldest turns the list over. "Added" is gone: beside Newest it read as the same thing

## 0.41.1

- Favorites: the order is a switch in the row, Sort: Added (when the post became a favorite, the site's order), Newest and Oldest (by the post itself). It replaces typing `sort:id:asc` into the search, which is no longer suggested or listed under "?"; typed, it still works
- Sort and Shuffle are one or the other: choosing an order ends Shuffle, and Shuffle puts Sort back to Added
- Statistics uses the width of the window: the numbers and the site profile on the left, the top tags on the right. On a wide screen the whole page is seen without scrolling
- Statistics: the History block is removed

## 0.41.0

Favorites search, suggestions:

- The search field suggests tags as you type, from the first letter: only tags your favorites have, each with the number of favorites that have it. Tags that begin with what you typed come first, then tags that hold it inside. No request is made: the list comes from the local index
- Up and Down move through the list, Enter or Tab puts the tag in, Esc closes the list. An exact tag always stands first, so Enter on `cat` takes `cat`, not `catgirl`
- While the list is open the page keeps showing the last result. The search is applied when a suggestion is picked, on Enter, after a space, and when the field is left
- A word after `-` gets the same list under the heading "Exclude"; `sort:` offers `sort:id:desc` (newest first) and `sort:id:asc` (oldest first)
- When nothing is found the page says why instead of staying blank. For a word that is no tag it offers the nearest one: "No favorites tagged “zootop”", "Show zootopia (5)"

Statistics:

- The numbers of "Site profile" are read when the page is opened, unless they were read in the last 15 minutes. "Refresh profile" still reads them at once

## 0.40.13

- Favorites search: the site does not cut every tag list on the favorites page, some come whole. Such a list was taken for a cut one, and a search for its first or last tag missed the post (`zootopia` found 4 posts of 5). An end that is a tag in its own right is now left as it is

## 0.40.12

- Favorites → "⋯" → "Sync favorites…" opens the settings at the Favorites block, where the sync buttons are, and unfolds it. It used to open the settings at their top

## 0.40.11

Favorites search, the tags the site cuts:

- The first and the last tag of a favorite, which the favorites page gives without one character, are restored from the whole spellings the script already knows. `zootopi` no longer finds anything, `zootopia` finds every post with the tag
- Statistics → Top tags counts a restored tag with its whole spelling; a tag that could not be restored is left out instead of standing in the list as a second, shorter tag
- RuleDesk → Favorites says what Full resync is for: it re-reads every page, so it is what refreshes tags changed on the site
- Run "Full resync" once after this update: it marks every entry, and the restoring is exact from then on

## 0.40.10

- Favorites search finds a tag that stands first or last in a post's tag list. The site cuts one character off each end of that list on the favorites page, so `zootopia` at the end was kept as `zootopi`: a search for the full tag missed those posts and found them only by the cut spelling

## 0.40.9

- RuleDesk settings: the line is also there under the first setting of Page, "Enable page tweaks", and over the settings after the list of features

## 0.40.8

RuleDesk settings:

- A line between settings, so that each switch and list reads with its own name
- Site theme says what the themes are; with Site default or Site dark chosen, a note says that the site is not restyled there and that Light, Dark or Custom is recommended

## 0.40.7

Site dark:

- No strip over the site's title in the header
- The number beside Feed can be read: dark on the light pill

## 0.40.6

- Site default and Site dark leave the site's own controls the way the site draws them: no magnifier, clear button or "?" in the site's search field, the forum's search and rows and the Upload form are not dressed. What the script adds of its own (the search panel, the menu, the marks of new topics, the tag count on Upload) is there in every theme
- A number field (Min score) no longer shows the browser's white arrows
- The focus ring of a text field lies on its border instead of standing off it

## 0.40.5

The themes Site default and Site dark:

- The header held at the top has a background: the page no longer shows through it while scrolling
- The script's own pages (Collections, Following, Statistics, RuleDesk) are set in the script's font, as in the other themes, and not in the site's wider one. The toolbar of Collections fits in one row again: "New" no longer drops to a second line
- The search panel in the sidebar looks as it does in Dark: the sidebar has the same width, Sort has its arrow, "Reset" and "Select posts" stand side by side

## 0.40.4

- Downloads → File name → Custom: a token is a switch. A click puts it into the name, a second click takes it out, so a name cannot hold the same token twice. The tokens that are in the name are lit

## 0.40.3

- Upload: the Upload button, with the note above it, stands in the right column under "My Tags" instead of under the picture

## 0.40.2

- Upload: the picture of the chosen file is shown as large as the column allows instead of a small thumbnail, and the file is taken out by a cross in its top right corner
- Upload: a tag entered twice is taken out of the tags field when you leave it, pick a suggestion or press Upload. The first of each stays, in the order typed

## 0.40.1

- Upload, tidied: the file zone takes the whole left column and the fields on the right stand close together, without the gaps between them
- Upload: "Remove file" in the zone takes the chosen file out again
- Upload: the line about tags shows only while there are fewer than five, and comes back when there are too few again
- Fixed: a text field turned pale when its value was picked from the browser's list of earlier entries, as in the forum search. Fields keep the colours of the theme

## 0.40.0

The Upload page, redrawn:

- One card in two columns: the file and its source on the left; tags, rating and title on the right; the guidelines above and the button below
- The file field is a zone: drop a file on it or click anywhere in it. It shows the name and size of the chosen file and, for a picture, the picture itself
- Under the tags a line counts them and says how many are missing to the five the site asks for
- Rating is a switch of two options instead of two radio buttons
- The guidelines can be folded with "Hide the guidelines"; the choice is remembered
- The form itself is the site's: its fields, their names and the upload are untouched

The forum:

- The search field has a magnifier and a button that clears it

## 0.39.0

The forum, redrawn:

- The list of topics is cards instead of a table: the title, "Started by", the number of replies, and when and by whom it was last answered. A sticky topic has a pin instead of the word, a locked one a "Locked" label. A click anywhere on a card opens the topic
- "All" and "New for me" above the list: the second leaves only the topics marked "new" or "updated". "Mark all as read" stands beside them
- A topic: every post is a card with the author and the date in one line above the text, a quote set off by a line at its left, and "quote" and "link" as quiet buttons under it. The reply form is a card as wide as the posts

## 0.38.0

- A click on the "?" of a tag in the sidebar shows what the site's wiki says about the tag, in a small panel beside it: the name, the tag type and the text, with a link to the entry. A click with Ctrl or the middle button opens the wiki as before. The site keeps the text two pages away, so one click is two requests; an answer is kept until the page is left. Switch: RuleDesk → Page → "Tag description on the ? in the sidebar"

## 0.37.4

- A post that is an animated GIF now moves on its page. The site shows a still copy there and keeps the GIF behind "Original image"; the picture of the page is pointed at the original at once. Switch: RuleDesk → Page → "Play GIFs on the post page"
- Taken back: the change of 0.37.1 and 0.37.3 that started a video tagged `animated_gif` muted and looped. A GIF post has no video player, so it did nothing for GIFs

## 0.37.3

- Fixed: "Save as collection" and the other dialogs opened from the search panel showed only a dimmed sidebar, and a click closed them. The fade at the bottom of the held sidebar hid everything drawn from inside it
- The file name is picked from a list of ready names in RuleDesk → Downloads. "Custom…" opens the field, where a click on a token adds it
- "Check for new" pauses 1.5 seconds between searches again (the shorter pause got the site's "too many requests") and, after a refusal, waits and asks once more before it stops
- The filters of Collections and Following have no "?" any more

## 0.37.2

- Downloads tell the picture host that the request comes from the site. Added on a guess about a file that had saved as a web page; the guess was not confirmed

## 0.37.1

Removed:

- "Hide seen posts" and "Recent searches" are gone from the search panel

Fixed:

- The download button of a post saved a web page instead of the file on some posts. The file is now taken from the player for a video, from the "Original image" link for a picture, and an address that is not a picture or a video is never downloaded
- A click anywhere on the picture of the player plays and pauses, every time. It used to work only through the play mark, which is gone once playback has started
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
