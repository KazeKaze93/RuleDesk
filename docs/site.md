# The site: rules, markup, limits

The script works on the site's own HTML. This file holds what is known about it. Every fact here was read from a live page by the maintainer; nothing is guessed. A selector that is not in `src/site/selectors.ts`, in a test, or in this file must not be invented: ask for the markup first.

## Rules the script follows

- **No site API, with one exception: the download manager.** It asks `api.rule34.xxx` for the file addresses of posts, with the user's own key typed into settings (`src/site/api.ts`). Nothing else may use the API, and the manager does not exist without a key.
- **Requests only for a user action, one at a time, with a pause.** The site rate-limits quickly (HTTP 429). A new kind of request needs the maintainer's consent. All `fetch` and `GM_download` calls are in `src/site/`:

  | File | When it asks | Pause |
  |---|---|---|
  | `favorites.ts` | Click on a favorite star (add, vote, remove) | none, one per click |
  | `favorites-sync.ts` | "Sync favorites" / "Full resync" in settings | 1.5 s per page |
  | `autocomplete.ts` | Typing in a tag field of the script | debounced, one at a time |
  | `next-page.ts` | Infinite scroll; other artist groups of a merged feed | 1 s |
  | `artist-snapshot.ts` | "Refresh" on Following, after a confirmation | 1.5 s per artist |
  | `profile.ts` | "Refresh profile" on Statistics: the My Account page, then the user's profile page | two requests, 1.5 s apart |
| `api.ts` | A download job: the list of files (`fetch` to `api.rule34.xxx`, which allows any origin; up to 1000 posts per request) | 1 s |
| `download.ts` | A download job: the files, one at a time (`GM_download` from the CDN) | 0.4 s; one retry after 5 s |

- **Cookies:** only `tag_blacklist` and `theme` are read or written. `user_id` and `pass_hash` are never read. One exception outside cookies, allowed by Kaze: "Refresh profile" takes the address of the "My Profile" link from the My Account page, which holds the user's id, uses it for one request and stores nothing of it. The account settings form is never submitted.
- **Outside addresses are checked.** A file address from an API answer and a picture address from an imported file are used only when they are `https` on the site's domain (`src/site/urls.ts`).
- **The grid link is left alone.** Nothing inside `a#p{ID}` is changed; thumbnail size is set only by `grid-density`.

## Markup

### Results list (`page=post&s=list`)

- `div#content > div#post-list > [div.sidebar | div.content > div.image-list > span.thumb#s{ID} > a#p{ID} > img.preview]`
- `img.preview`: `alt` is the tag list, `title` is the tag list plus ` score:N rating:X`. Video posts: `img.preview.webm-thumb`
- Thumbnails fit 250×250: portrait ones are 143–219 px wide, landscape ones 250
- Pager: `div.pagination > [b (current) | a[href*="pid=N"] | a[alt="next"] | a[alt="last page"]]`, then `form#manualpage.manual-page-chooser`. Page step is 42 posts. A one-page result has no links
- Search form: `div.tag-search > form[action="index.php?page=search"][method=post] > div.awesomplete > input[name="tags"]`
- Tag sidebar: `ul#tag-sidebar`, headings `li > h6`, rows `li.tag-type-{artist|character|copyright|general|metadata}` with the post count in `span.tag-count`. On a post page a row has no `+` and `-` links
- AI filter: `li > label "Filter AI posts" > span.switch > input.toggleSwitch#chkFilterAI + span.slider`, no form

### Post page (`page=post&s=view`)

- `div#post-view > [div.sidebar | div#right-col > div#fit-to-screen > div.flexi > div > img#image]`
- `div.link-list > ul`: Edit, Resize image, Original image, Report, Add Note, Add to favorites
- `div#stats > ul > li`: Id; Posted and author; Size; Source; Rating; Score in `span#psc{ID}`
- "I came": `li > a[onclick="iCame('ID'); return false;"] > img[alt="I came!"]`. There is no counter in the markup
- Comments: `div#post-comments > div#comment-list > div#c{CID}`
- Previous / next in the last search: `a#prev_search_link[href="#"]`, `a#next_search_link[href="#"]`; the site's script navigates on click
- Player: Fluid Player, `video#gelcomVideoPlayer[loop][preload=auto]` inside `div#fluid_video_wrapper_gelcomVideoPlayer.fluid_video_wrapper`

### Account page (`page=account&s=home`)

- The list is headings with links, except Logout, which is a form button: `<h4><button type="submit" style="background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer;">» Logout</button></h4>`

### Other pages

- Upload: `div#content > div#upload-form > form > [h2, table > tbody > tr > td]`
- Lists (artists, forum, and by the site's stylesheet the other lists): `table.highlightable > tbody > tr.tableheader > th`, rows `tr.odd` / `tr.even` (artists: `tr#artist-{ID}`); pager `div#paginator > div.pagination`. Search form above: artists `div#search-form > form`, forum `div#forum > div#search > form`
- Artists list row (from Kaze, 16.11.2026): `tr#artist-{ID}.odd|even > [td > ["P", a[href*="page=artist&s=update"], a[onclick]], td > a[href="index.php?page=artist&s=show&id={ID}"] (the artist's name), td (updated by)]`
- Forum list: `div#forum > [div#search, table.highlightable, form#new_topic > table, div#paginator]`; a topic cell holds `span.forum-topic` and, when locked, `span.locked-topic`
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
