# The site: rules, markup, limits

The script works on the site's own HTML. This file holds what is known about it. Every fact here was read from a live page by the maintainer; nothing is guessed. A selector that is not in `src/site/selectors.ts`, in a test, or in this file must not be invented: ask for the markup first.

## Rules the script follows

- **No site API, with one exception: the download manager.** It asks `api.rule34.xxx` for the file addresses of posts, with the user's own key typed into settings (`src/site/api.ts`). Nothing else may use the API, and the manager does not exist without a key. (0.42.0 also read the rating, score and size of favorites through it; taken out in 0.43.1, because the API gives posts named by id only one a request.)
- **The API limit is 60 requests in 60 seconds per key** (the account page says so; from Kaze, 17.11.2026). `requestText` in `api.ts` is the one place a request is made, and it keeps the pace for all of them: one at a time, no sooner than 1.1 s after the last one of any tab (a time in `localStorage`, `ruledesk-web.api-last`), and a 429 is waited out for 15 s and asked again up to three times.
- **Requests only for a user action, one at a time, with a pause.** The site rate-limits quickly (HTTP 429). A new kind of request needs the maintainer's consent. All `fetch`, `GM_download` and `GM_xmlhttpRequest` calls are in `src/site/`, but for one `fetch` in `src/features/tag-wiki.ts` (the wiki text of a tag, on a click on its "?"):

  | File | When it asks | Pause |
  |---|---|---|
  | `favorites.ts` | Click on a favorite star (add, vote, remove) | none, one per click |
  | `favorites-sync.ts` | "Sync favorites" / "Full resync" in settings; a run that was cut short (the page was left, a request failed) goes on by itself on the next page load, `favorites-sync-runner.ts` | 1.5 s per page |
  | `autocomplete.ts` | Typing in a tag field of the script | debounced, one at a time |
  | `next-page.ts` | Infinite scroll; other artist groups of a merged feed | 1 s |
  | `artist-snapshot.ts` | "Refresh" on Following, after a confirmation | 1.5 s per artist |
  | `profile.ts` | Opening Statistics, when the stored numbers are older than 15 minutes (Kaze, 17.11.2026), and "Refresh profile" there: the My Account page, then the user's profile page | two requests, 1.5 s apart |
  | `related.ts` | Opening the Related posts tab of a post, picking a source there, "Another mix" | one request; one more after 1.1 s when the page of a mix came empty |
  | `tag-type-lookup.ts` (through `autocomplete.ts`) | No action: the kind of a tag the script has not met yet, with its own switch | one tag a request, 1.1 s apart, 30 a page at most |
  | `api.ts` | A download job: the list of files (`GM_xmlhttpRequest` to `api.rule34.xxx`, with no cookies. Not `fetch`: the key is in the address, and the address of a request the page makes is read by any script of the page through `performance.getEntriesByType("resource")`; Kaze checked during a download, 19.11.2026, and the key was there. There is no falling back to `fetch`; up to 1000 posts per request for a search, one post per request for posts named by id) | 1.1 s, shared |
  | `download.ts` | A download job: the files, one at a time (`GM_download` from the CDN) | 0.4 s; one retry after 5 s |

- **Cookies:** only `tag_blacklist`, `theme` and `filter_ai` are read or written (`filter_ai` allowed by Kaze on 17.11.2026, for AI posts shown or hidden by the part of the site; written with `path=/` like the other two — the attributes the site itself gives it have not been read). `user_id` and `pass_hash` are never read. One exception outside cookies, allowed by Kaze: "Refresh profile" takes the address of the "My Profile" link from the My Account page, which holds the user's id, uses it for one request and stores nothing of it. The account settings form is never submitted.
- **Outside addresses are checked.** A file address from an API answer, the address the one-post download button takes from the page, and a picture address from an imported file (covers, thumbs, the page background) are used only when they are `https` on the site's domain (`src/site/urls.ts`); the background may also be the picture itself, as `data:image/...`. The Source of a post is repeated as a link only when it is `http` or `https`.
- **The grid link is left alone.** Nothing inside `a#p{ID}` is changed; thumbnail size is set only by `grid-density`.

## Markup

### Results list (`page=post&s=list`)

- `div#content > div#post-list > [div.sidebar | div.content > div.image-list > span.thumb#s{ID} > a#p{ID} > img.preview]`
- `img.preview`: `alt` is the tag list, `title` is the tag list plus ` score:N rating:X`. Video posts: `img.preview.webm-thumb`
- Thumbnails fit 250×250: portrait ones are 143–219 px wide, landscape ones 250
- Pager: `div.pagination > [b (current) | a[href*="pid=N"] | a[alt="next"] | a[alt="last page"]]`, then `form#manualpage.manual-page-chooser`. Page step is 42 posts. A one-page result has no links
- Search form: `div.tag-search > form[action="index.php?page=search"][method=post] > div.awesomplete > input[name="tags"]`
- Tag sidebar: `ul#tag-sidebar`, headings `li > h6`, rows `li.tag-type-{artist|character|copyright|general|metadata}` with the post count in `span.tag-count`. On a post page a row has no `+` and `-` links
- AI filter: `li > label "Filter AI posts" > span.switch > input.toggleSwitch#chkFilterAI + span.slider`, no form. A click on it reloads the page; the choice is the cookie `filter_ai` (`0` shown, `1` hidden), readable from the page, and the server leaves AI posts out of the list itself (from Kaze, 17.11.2026: an artist whose every post is AI gives the empty "Nobody here but us chickens!" page with the filter on)

### Post page (`page=post&s=view`)

- `div#post-view > [div.sidebar | div#right-col > div#fit-to-screen > div.flexi > div > img#image]`. The site's CSS (`docs/design/site-desktop.css`): `div#post-view` and `div.flexi` are flex rows, `nowrap`, `justify-content: flex-start`; `div#right-col` has no size of its own (its `flex-basis: 100%` is commented out), so it is as wide as its content
- `div.link-list > ul`: Edit, Resize image, Original image, Report, Add Note, Add to favorites
- `div#stats > ul > li`: Id; Posted and author; Size; Source; Rating; Score in `span#psc{ID}`
- "I came": `li > a[onclick="iCame('ID'); return false;"] > img[alt="I came!"]`. There is no counter in the markup
- Comments: `div#post-comments > div#comment-list > div#c{CID}`
- A deleted post (from Kaze, 19.11.2026): the page has `div.status-notice`, in a parent whose id or class is `status-notices` (which of the two is not known), with the text "This post was deleted. Reason: tos / MD5: <32 hex>". There is no `img#image`; `div.flexi` still holds the "previous / next" strip and "Edit | Respond", and the link list still has its links. A deleted post is gone from every list of the site, the favorites among them; its page is reached only by a link that was on a page loaded before the deletion (from Kaze, 19.11.2026). The site takes the removal of such a post from favorites (Kaze checked in 0.71.1). Whether the site takes a favorite, a vote or "I came" for such a post is not known
- The tag list of the site, `index.php?page=tags&s=list&tags=*&sort=desc&order_by=index_count` (from Kaze, 19.11.2026: the address works and sorts by count): a table of 20 rows a page, columns Posts, Name, Type, the next page behind `a[alt="next"]`. Type reads "General", "Metadata", "Copyright", with ", ambiguous" after it on some. The first 120 by count are general but for `ai_generated`, `hi_res`, `tagme`, `highres`, `3d`, `uncensored`, `censored`, `absurd_res`, `animated` (Metadata) and `nintendo`, `pokemon` (Copyright)
- Previous / next in the last search: `a#prev_search_link[href="#"]`, `a#next_search_link[href="#"]`; the site's script navigates on click
- Keys of the site on a post page (from Kaze, 18.11.2026): one handler, `document.onkeydown`. It does nothing when the target is `INPUT`, `TEXTAREA`, `VIDEO` or `BUTTON`, or with Alt, Ctrl or Meta. `ArrowLeft` clicks `#prev_search_link`, `ArrowRight` clicks `#next_search_link`; `a` and `d` are commented out in it. No other key is taken by the site; a third-party script also listens for `keydown` and `keyup` on `document` without acting on a key
- Player: Fluid Player, `video#gelcomVideoPlayer[loop][preload=auto]` inside `div#fluid_video_wrapper_gelcomVideoPlayer.fluid_video_wrapper`

### Account page (`page=account&s=home`)

- The list is headings with links, except Logout, which is a form button: `<h4><button type="submit" style="background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer;">» Logout</button></h4>`

### Other pages

- Site dark theme, computed (from Kaze, 17.11.2026): `#header` and `body` background `rgb(48, 58, 48)`, text `rgb(192, 192, 192)`; `#site-title` and `ul#navbar` background `rgb(41, 49, 41)`, links `rgb(147, 179, 147)`; a `span` inside a menu link gets the link colour over a class rule of the script
- Upload (from Kaze, 17.11.2026): `div#upload-form > [form[method=post][action="index.php?page=post&s=add"][enctype=multipart/form-data] > [h2 "Image Upload", br, table > tbody > tr ×9 > td], script]`. The rows, each one `td`: 1 guidelines `div[style="margin-bottom: 2em;"] > [h3, p, h4, br, ul]`; 2 `label[for=fileUpload]`, br, `input#fileUpload[type=file][name=upload][required]`; 3 `input#txtSource[name=source]` + `div#sourceNotice.notice`; 4 `input#txtTitle[name=title]` + `div#titleNotice.notice`; 5 `label[for=txtTags]`, br, `div.awesomplete > [textarea#tags[name=tags], ul, span.visually-hidden]`, the text "Separate tags with spaces…", `div#tagsNotice.notice`; 6 the text "Rating:", br, `input#rating_e[type=radio][name=rating][value=e][checked]`, `label[for=rating_e]`, `input#rating_q[value=q]`, `label[for=rating_q]` (no Safe); 7 "My Tags:" + `div#my-tags > a` (Edit); 8 an empty `td[style="width: 300px;"]`; 9 `b` (the approval note), br, `input[type=submit][name=submit][value=Upload]`, `b` + text (a rule change). There is no field for a link to a file. The site's script checks the three text fields on `keypress` and `change`
- Upload Video, `index.php?page=post&s=addVideo` (from Kaze, 18.11.2026): the same `div#upload-form > form#upload-form-element > [h2 "Video Upload", br, table > tbody > tr > td, b "18 august rule change:", br, text, script]`, and `#fileUpload`, `#txtSource`, `textarea#tags` in `div.awesomplete`, `#rating_e` / `#rating_q`, `input#submitBtn.searchList[type=submit]` as on the image upload. Different: no Title row; the "My Tags" row is `td > [br, a "Edit"]` with no `#my-tags`; one row is an empty `td`; a last row `td#progress > [div, span#progress-text]`; the rule-change note stands after the table, not in the row of the button; the page ends with `div#content > center` holding only line breaks and the site's timing text
- Comments on a post page (from Kaze, 18.11.2026): `div#post-comments > [div#comment-list, div#paginator]`. With comments: `div#comment-list > [script, a#ci "(N hidden)", br, br, div > a "Change" (the sort order), div#c{CID} > [div.col1 > [a (the user), span ">> #{CID}", br, b > [a#sc{CID} (score), a "Up", a#rc{CID}, a#rcl{CID} "Report comment"]], div.col2 (the text), script, hr.light] …]`. With none: `div#comment-list > [script, div > a "Change"]`, no `a#ci`. The "Respond" link is not inside `#post-comments`: it is under the picture, in the block that holds `img#image`
- The form for a comment on a post page (from Kaze, 18.11.2026): `div#content > div#post-view > div#right-col.content > form#comment_form[name=comment_form][method=post][action="index.php?page=comment&id={ID}&s=save"] > table > tbody > tr ×5 > td`: row 1 `textarea#comment[name=comment]`, rows 2 and 3 empty, row 4 `input[name=submit][type=submit]`, row 5 `input#conf[name=conf][type=hidden]` and `input#new_user_agree_input[name=new_user_agree][type=hidden]`. Hidden until the site's "Respond" link is pressed
- "New Account Safety Check" (from Kaze, 18.11.2026): pressing "Respond" on an account that has not commented yet shows `div#right-col > div#new_user_modal[style="display: block;"] > [h2, p[style="color:#c00; font-weight:bold;"], p, ul > li > strong, label > input#new_user_agree_checkbox[type=checkbox], div > [button#confirm_agree_btn "Agree & Continue", button.cancel-modal-btn "Cancel"]]`. It is the site's consent to its commenting rules: the script recolours it and does nothing else with it
- "I came" pressed twice in a day (from Kaze, 18.11.2026): a bar at the top of the content reads "You can only cum once a day. You can cum again in N hours and M minutes". The bar is `body > div#notice.notice` with an empty `style` attribute, the message its only text (from Kaze, 18.11.2026). Whether the element is in the page, hidden, when there is no message is not known
- Lists (artists, forum, and by the site's stylesheet the other lists): `table.highlightable > tbody > tr.tableheader > th`, rows `tr.odd` / `tr.even` (artists: `tr#artist-{ID}`); pager `div#paginator > div.pagination`. Search form above: artists `div#search-form > form`, forum `div#forum > div#search > form`
- Tag wiki (from Kaze, 16.11.2026). The "?" of a sidebar row is `a[href="index.php?page=wiki&s=list&search=<tag>"]`, followed in the row by `a[href*="tags=<tag>"]` and `span.tag-count`. That address is a search of the wiki: `div#content > div#post-list > [div.sidebar (Recent Changes), div.content > [h3, div#search > form[method=POST] > input[name=search], table.highlightable > tbody > tr > [td > a[href*="page=wiki&s=view&id="] > img, td > [a[href*="page=wiki&s=view&id="] (the entry's name), br, span (last updated)], td > h3 (version)]]]`; the rows carry no class. An entry, `page=wiki&s=view&id=<N>`: `div#content > div.flexi > [div > [h2 "Now Viewing: <name>", br, span > b "Tag type: <Type>", br, br, the text as bare text nodes and br, b "Other Wiki Information", div.lighter-background …], div (six thumbs and "View more »")]`
- A GIF post (from Kaze, 16.11.2026): no video player. The page holds `img#image[onclick="Note.toggle();"][width][height]` whose `src` is a still sample, `…//samples/<dir>/sample_<hash>.jpg?<id>`; the GIF is the "Original image" link, `…//images/<dir>/<hash>.gif?<id>`
- Artists list row (from Kaze, 16.11.2026): `tr#artist-{ID}.odd|even > [td > ["P", a[href*="page=artist&s=update"], a[onclick]], td > a[href="index.php?page=artist&s=show&id={ID}"] (the artist's name), td (updated by)]`
- Forum list (from Kaze, 17.11.2026): `div#forum > [div#search > form[method=post][action="?page=forum&s=search"] > [input[name=search], input[type=submit]], table.highlightable > [thead > tr.tableheader > th ×5 (Title, Created by, Updated, Updated By, Replies), tbody > tr.odd|even > td ×5], form#new_topic > table, div#paginator]`. Title cell: `span.forum-topic[.unread-topic] > [text "Sticky: " for a sticky one, a[href="?page=forum&s=view&id={ID}"]]`, then for a locked one `span.locked-topic` with the text `(locked)`. Updated cell: `span[title=<full date>]`. Updated By is `N/A` for a topic without replies. The site itself adds `unread-topic` to the span of a topic it considers unread
- Forum topic (from Kaze, 17.11.2026): `div#content > div#forum.response-list > [div.post ×N > [div.author > [h6.author > [a[name={PID}], a[href*="page=account&s=profile"]], span.date], div.content > [h6.response-title (empty on a reply without a title), div.body (text, br, b, a[rel=nofollow], div.quote), div.footer > [a[onclick^="javascript:quote("] "quote", text " | ", a[href*="#{PID}"] "link", br]]], div.content > div#reply[style="display: none;"] > form[method=post][action*="s=add&t=post&pid={TOPIC}"] > table > tbody > tr > td > [input[name=title], textarea#reply_box[name=post], hidden inputs, input[type=submit][value=Post]]]`. There are no avatars
- Favorites page, the block of the grid (from Kaze, 17.11.2026, with the script on): `body#body > div#content > [div.image-list, div#paginator, br, br]`. There is no `div#post-list` and no sidebar on this page; the script's own children of `div#content` stand before the grid
- The API and a list of ids (from Kaze, 17.11.2026): a search of the form `( id:1 ~ id:2 … )` with a hundred ids got an empty answer for every one of 120 groups of his favorites ("Ratings and sizes read for 0 of 11961"). The API has no "or" for ids at all (probed by Kaze the same day with three of his posts): `( a ~ b ~ c )`, `a ~ b ~ c`, `~a ~b ~c`, `a or b or c` and `{a~b~c}` answer empty; `{id:a ~ id:b ~ id:c}` answers the middle post only (the two terms glued to a brace are not ids, the rest is "and"); `id:a,b,c` is ignored and the newest 1000 posts of the site come back. What works: one post by `tags=id:N` or by the `id=N` parameter, and a range `id:>=A id:<=B`, which returns every post of the site in it. So through the API a list of posts costs one request a post
- Favorites grid, the cut of `title` (from Kaze, 17.11.2026, a dump of the stored lists of one sync): not every list is cut. Of five posts, four had lost the first and the last character (`girls … zootopi`, `9_position …`), one came whole (`1girls … zootopia`, post 3659151). Why is not known. The images there carry no class of the site: `rdw-thumb` and `rdw-video-thumb` on `span.thumb` are the script's own
- Favorites grid: `div.image-list > span > [span.thumb > a#p{ID} > img, br, a[onclick] > b]`; the last link is Remove; the outer `span` carries `style="align-self: flex-start; display: grid; grid-template-rows: auto 10px;"`. The thumb has no `s{ID}` id and the image has no class (no `preview`, no `webm-thumb`); `alt` is `image_thumb`, `title` is the tag list with its first and last character cut off (`i_generated … vide`). The image address has a double slash: `/thumbnails//<dir>/thumbnail_<hash>.jpg?<id>`. A video is known only by the `video` tag in the title (`src/site/video-thumbs.ts`)
- Comments: `div#comments > div#comment-list > div#p{ID}.post > [div.col1.thumb > a > img.preview, div.col2 > [div.header > [div, div.tags], div.response-list > div#c{CID}.post]]`; the "(N hidden)" link is `div#comment-list > div.content > a#ci`. The preview is a plain `img.preview` with the full tag list in `title` and no `webm-thumb` on a video; `div.tags` holds one `span` per tag. The site's stylesheet fixes `div.col2` at 50em and `div.response-list > div.post > div.content` at 30em

- Wiki → Create: `div#content > div#post-list > div#post-list > [div.sidebar, div.content > div[style="width: 100%;"] > div[style="color: #464646; … font-size: 11px;"] > [h3, center > div[style="color: #464646; … font-size: 11px; text-align: left;"] > form]]`
- Aliases: `div#content > [text, div[style="color: #ff0000;"], div > form > input#query, div#aliases > table.highlightable, div#add-box[style="display: none;"] > form]`
- Artists: `div#content > [div#search-form, table.highlightable, div#paginator, div#footer > a]`; `div#footer` holds Create, Order by Date, Order by Name
- My Account: `div#content > div#user-index > [form > h4 > button, p, (h4 > a, p)…, br, h1 > a]`
- Profile (`?page=account&s=profile&id={ID}`): `div > table.highlightable > tr > [td label, td value]`; rows Contact, Join Date (`YYYY-MM-DD`), Level, Favorite Tags, Posts, Deleted Posts, Favorites, Comments, Tag Edits, Note Edits, Forum Posts, Record. My Account links: `div#user-index h4 > a`, the profile one is `index.php?page=account&s=profile&id={ID}`
- Pool page (`?page=pool&s=show&id={ID}`): its thumbs sit in `div.image-list` and the link of each carries an `onclick` (Delete Mode). Anything styled by `a[onclick]` inside `div.image-list` must be limited to the page it is meant for (`html.rdw-page-favorites`)
- Help: `div#content > div#static-more > div > ul > [li > h4, li > a]`

### Addresses

- A post a few minutes old has its preview on the main host, `https://rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<id>`, while its video is already at `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.mp4?<id>` (measured on post 19364972). Later the preview moves to `wimg.rule34.xxx`.

- Thumbnail: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<id>`
- Sample on the post page: `https://wimg.rule34.xxx//samples/<dir>/sample_<hash>.jpg?<id>`
- Video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.mp4?<id>`
- Stylesheet: the only `link[rel=stylesheet]`, `https://rule34.xxx//css/desktop.css?46`; the dark theme is `desktop-dark.css`. A copy of the light file is in `docs/design/site-desktop.css`

### Requests the script makes

- Autocomplete: `GET /public/autocomplete.php?q=<text>`, answers 302 to `ac.rule34.xxx`
- Add favorite: `GET /public/addfav.php?id=`; the body is `3` added, `1` already there, `2` not logged in
- Vote up: `GET /index.php?page=post&s=vote&id=&type=up`
- Remove favorite: `GET /index.php?page=favorites&s=delete&id={ID}&return_pid=0`
- Favorites page: 50 per page, `div#paginator`, links with `href="#"` and `pid` in `onclick`

### Search syntax

`( a ~ b )` with the spaces, `-tag`, `sort:id:asc|desc`, `sort:score:desc`, `sort:updated:desc`, `sort:random`, `score:>=N`, `id:>N`, `id:N`. `tags=all` is the plain post list. One OR-group took 639 alternatives in a test; at 1000 the site answered 520. The script puts at most 400 artists in one group.

## Limits that come from the site

| Limit | Effect in the script |
|---|---|
| A page that adds nothing to the screen | Infinite scroll pauses after two such pages in a row and waits for "Load more" (`MAX_STALLED_LOADS` in `infinite-scroll.ts`); otherwise it would ask for page after page |
| Rate limiting (429) | Requests are spaced; Refresh and favorites sync stop at the first error. Even the site's own "I came" got 429 on a third quick click |
| No total in the pager | A dynamic collection of several tags shows a lower bound ("12,516+ posts"): the offset of the last page, up to 41 posts short. A single tag takes the exact number from `span.tag-count` |
| No post date in the grid | Following shows when the script first saw an artist's newest post, not when it was posted |
| One OR-group per search | More followed artists than one group are merged from several searches (`feed-merge.ts`). "Only new" is not offered on a merged feed. The merge needs a results grid on the first group's page |
| The pager is the only way to keep a URL mark | A dynamic collection's bar depends on `#rdw-dc=<id>` in the address. Paging by the manual page-number form drops it |
| The original file's address is only on the post page or in the API | The download manager takes addresses from the API; that is why it needs the user's key |
| The API stops answering deep pages | Reliable only for the first few `pid` values. A search is walked by asking for the first page with `id:<N`, N being the lowest id seen |
| Image servers | `wimg`, `img`, `us`, `api-cdn` (`.rule34.xxx`) are tried in turn when a post image fails to load (`cdn-fallback.ts`). The list comes from the desktop app; that the mirrors serve the site's sample paths is not confirmed |
| Thumbnail quality | Thumbnails are small JPEGs; the Masonry grid was removed for that reason |
| `title` tooltip on thumbnails | The attribute cannot be removed (the site's scripts read it); the tooltip is suppressed by taking the pointer off the image. A right click on a thumbnail gives the link menu, not the image menu |
| Empty last pages of the favorites pager | An old site bug: the pager lists more pages than there are favorites |
| The site's autocomplete list | When closed it is hidden by `opacity:0; transform:scale(0); display:block`. Setting `transform:none` on it makes an invisible list catch clicks and duplicate the tag |
| Site styles on inputs | `input[type=text]:focus` gets `background: #FFC`; the script's own inputs on site pages override it |
| A site error in the console | `Cannot read properties of null (reading 'style')` at `index.php:258` is the site's own inline script (`$("displayOptsLink")`), present without the userscript |
| Script manager storage on a restored page | After Back, the manager can return stale data. Followed artists, covers and counts have `localStorage` mirrors and are re-read on `pageshow` |
