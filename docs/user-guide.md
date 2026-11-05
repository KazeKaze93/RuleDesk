# User Guide

Welcome to RuleDesk! This guide will help you get started and use all the features of the application.

## 📑 Table of Contents

- [Installation](#installation)
- [First Launch](#first-launch)
- [Getting Your API Credentials](#getting-your-api-credentials)
- [Basic Usage](#basic-usage)
  - [Adding Artists to Track](#adding-artists-to-track)
  - [Synchronizing Posts](#synchronizing-posts)
  - [Viewing Posts](#viewing-posts)
- [Features](#features)
  - [Search](#search)
  - [Favorites](#favorites)
  - [Playlists and Smart Collections](#playlists-and-smart-collections)
  - [Downloading Posts](#downloading-posts)
  - [Filters and Sorting](#filters-and-sorting)
  - [Marking Posts as Viewed](#marking-posts-as-viewed)
- [Navigation](#navigation)
- [Settings](#settings)
- [Statistics Dashboard](#statistics-dashboard)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Official release binaries

Tagged [Releases](https://github.com/KazeKaze93/ruledesk/releases) ship **pre-built binaries for Windows and Linux only**. CI builds each platform on its native runner so the native `better-sqlite3` module matches the target OS.

| Platform | Release artifact | Status |
|----------|------------------|--------|
| **Windows** | `RuleDesk-<version>-win.zip` | ✅ Published on every `v*` tag |
| **Linux (x64)** | `RuleDesk-<version>.AppImage` | ✅ Published on every `v*` tag |
| **macOS** | — | ❌ Not distributed (see below) |

### Windows

1. Download `RuleDesk-<version>-win.zip` from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Extract the archive
3. Run `RuleDesk.exe`

**Unsigned builds / SmartScreen:** Windows builds are not code-signed. Microsoft Defender SmartScreen may show “Windows protected your PC”. Click **More info**, then **Run anyway** to continue. This is expected until signing is set up.

Application data is stored in the same location as the dev build (`%LOCALAPPDATA%/RuleDesk-Data` on Windows). Updates: use **Download** in the in-app notification to open the latest release on GitHub, then extract the new zip (or replace files) manually — there is no automatic in-app install.

### Linux

1. Download the `RuleDesk-<version>.AppImage` file from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Make it executable: `chmod +x RuleDesk-*.AppImage`
3. Run it: `./RuleDesk-*.AppImage`

**Notes:**

- AppImage bundles the app; no system-wide install is required.
- Some distributions need FUSE (`libfuse2`) to run AppImages. If launch fails, install your distro's `libfuse2` / `fuse` package and retry.
- Application data: `~/.config/RuleDesk-Data/` (same as a local dev build on Linux).

### macOS — not distributed

macOS **`.dmg` installers are not published**. Reasons:

- Apple **code signing and notarization** are required for a smooth “open from Downloads” experience on modern macOS.
- That needs a paid Apple Developer account, signing certificates, and extra CI secrets/maintenance.

The Electron app can still be built from source on a Mac (`npm install && npm run dev`, or `electron-builder --mac` locally), but **GitHub Releases do not include a macOS binary**. Use Windows or Linux releases, or build from source.

### Build from source (any OS)

Clone the repo, run `npm install`, then `npm run dev`. See [README — Development Setup](https://github.com/KazeKaze93/ruledesk#-development-setup) for the full gate (`validate`, tests, native rebuild notes).

---

## First Launch

If no API key is configured (`hasApiKey` is false), **AccountGate** in `App.tsx` is shown immediately. It shows a content notice («RuleDesk displays sexually explicit content from Rule34. Use only if you are an adult.») and **Settings → Account** fields: enter User ID and API Key (or paste the account page URL into either field) and click **Save API Key**. There is no separate age-gate screen and no Skip — without credentials the main app does not load. You can change credentials later in Settings → Account.

### What are API Credentials?

RuleDesk needs your Rule34.xxx account credentials to fetch posts. These credentials are:

- **User ID** - Your account ID number
- **API Key** - A special key that allows RuleDesk to access the API

**Don't worry** - these credentials are encrypted and stored securely on your computer. They're never sent anywhere except to Rule34.xxx's API.

---

## Getting Your API Credentials

1. **Open your web browser** and go to:

   ```
   https://rule34.xxx/index.php?page=account&s=options
   ```

2. **Log in** to your Rule34.xxx account (if you're not already logged in)

3. **Scroll down** to the "API Access" section

4. **Copy your credentials:**

   - **User ID** - The number next to "User ID"
   - **API Key** - The long string next to "API Key"

5. **Paste them into RuleDesk:**

   - A tip under the User ID and API key fields reminds you: paste the full account page URL into either field and both values are filled in automatically
   - Or manually enter them in the fields

6. **Click "Save API Key"**

That's it! You're now ready to use RuleDesk.

---

## Basic Usage

### Adding Artists to Track

**What is "tracking"?** Tracking an artist lets RuleDesk sync all of their posts into your local library, download everything from that artist (not only posts already loaded in Browse), and show new work in the **Updates** feed.

**How to add an artist:**

1. Click **"Tracked artists"** in the sidebar (left side of the screen)

2. Click the **"+ Add Artist"** button (top right)

3. Fill in the form:

   - **Name** - A friendly name for this artist (e.g., "My Favorite Artist")
   - **Tag** - The artist tag to track (e.g., "artist_name")
   - **Source** - Rule34.xxx (app is Rule34-only)

   Tracking is by **tag** only in the UI (uploader/query types are not offered).

4. Click **"Add"**

The artist will appear in your tracked list. Until the first successful sync finishes, the status badge shows **Not synced yet** (not green **Synced**). While that artist is being synced (Sync All, repair, or **Sync new artist automatically**), the badge switches to **Syncing**; when that artist finishes it becomes **Synced** or **Error** (hover for the reason) without waiting for every other artist. If **Sync new artist automatically** is enabled in Settings → General, RuleDesk queues that sync right after you add the artist. After a successful add, toast **Open gallery** jumps straight to that artist's gallery.

**Tip:** Type a few letters in **Tag to Track** — suggestions are **artist tags only**. Rule34 autocomplete has no category field, so RuleDesk checks the top matches against the tag API (cached) and hides characters/series. Typing further letters cancels the previous lookup so suggestions stay on the latest query. Browse search autocomplete is unchanged (all tag types).

### Synchronizing Posts

**What is synchronization?** This is when RuleDesk downloads new posts from the website and saves them to your local database.

**How to sync:**

1. Click the **"Sync now"** button in the sidebar (bottom of the sidebar, with a refresh icon). The label shows live progress such as **Syncing artist_name...** while a run is active.

2. When the run finishes with no artist failures, a **Sync complete** toast appears. If some artists fail, one summary toast lists up to three `artist: reason` lines (then **and K more**) with an **Open Tracked** action. Credential problems use a separate credentials toast only (no duplicate success/summary toast).

3. The sync runs in the background, so you can continue using the app while it syncs. **Last sync** under the button and the Updates unread badge refresh when the run ends.

**Automatic sync (optional):**

1. Open **Settings** (sidebar) → **Sync**
2. Enable **Sync on startup** if you want a full sync every time the app starts
3. Enable **Sync new artist automatically** if you want each newly added artist to sync immediately after tracking starts (off by default)
4. Set **Sync interval** to run background sync while the app is open (or leave **Disabled** and use **Sync All** in the sidebar when you want)

You can still run **Sync All** manually at any time; automatic runs use the same engine and rate limits.

Cancel and quit stop sync promptly: in-flight API requests and long rate-limit waits are aborted (not left sleeping for a full Retry-After). Quitting the app cancels sync, waits briefly, then closes the database.

### Viewing Posts

**To view posts from a tracked artist:**

1. Go to the **"Tracked artists"** page
2. Click on an artist card
3. You'll see a gallery of all their posts

**In the gallery:**

- **Scroll down** to see more posts (they load automatically)
- **Click on a post** to open it in full-screen viewer
- **Use arrow keys** (← →) to navigate between posts
- **Press Esc** to close the viewer
- In the viewer, the date label is **Updated** (tooltip: Rule34 reports the last change time, not the upload time) — shown on the overlay and in the tags drawer

**Post information:**

Each post card shows:

- Preview image
- Rating badge (Safe/Questionable/Explicit)
- Media type icon (image or video)
- Viewed indicator (if you've already seen it)
- Favorite star (if you've favorited it)

---

## Features

### Search

**Search for artists locally:**

1. Go to the **"Tracked artists"** page
2. Use the search box at the top
3. Type the artist name or tag
4. Results appear as you type

**Search for tags remotely:**

1. When adding an artist, start typing in the "Tag" field
2. RuleDesk will search the website's tag database
3. Select a tag from the suggestions

**Search posts (chip-based):**

1. Go to **"Browse"** page
2. Use the search bar in the top bar
3. Enter a token and commit it with **Enter**, **comma**, or **space**
4. Each committed token becomes a chip and is applied to search

**Syntax help popover:**

- Click the **help icon** (`?` / CircleHelp) next to the search input to open the in-app syntax cheat sheet.

**Supported query syntax in the search bar:**

- `tag1 tag2` via two include chips (default AND behavior)
- `-tag1` (exclude). You can:
  - type it directly as a token (for example `-blonde_hair`), or
  - add a normal chip and right-click it to toggle include/exclude
- `( tag1 ~ tag2 )` as an OR group token (spaces inside parentheses are required)
- wildcard and fuzzy forms are passed through (examples: `ta*1`, `night~`)
- supported metatags include examples like:
  - `user:bob`
  - `md5:foo` / `md5:foo*`
  - `parent:1234`
  - `rating:questionable` / `-rating:questionable`
  - `score:>=10`, `width:>=1000`, `height:>1000`
  - `aspectratio:16:9`, `aspectratiof:1.5`
  - `sourcedomains:example.com`

**Notes:**

- The clear button in the search bar clears tag chips.
- Click a chip to put it back into the input for editing; right-click still toggles include/exclude.
- The search area in the top bar uses the available width before action buttons and can grow to a second chip row when the first row is full.
- **Infinite scroll:** on Browse with **Source: All**, scroll down to load more posts from the booru API (50 per batch; RuleDesk continues past the API offset cap via cursor). The first page (head of the feed) always refreshes from the API. Later **cursor** pages may reuse a local SQLite cache (`search_results_cache`, found TTL 7 days / empty TTL 24 hours) so deep scroll does not re-hit the booru for the same `beforePostId` window.
- **Select all (bulk):** available for the posts currently shown in the Browse gallery whether or not search tags are set (still selects only loaded/`displayPosts` items).
- **API failures vs empty results:** a genuine empty search shows the “no posts” empty state; auth, rate-limit, network, or parse failures show a centered error screen with **Retry** (and **Open Settings**, which opens **Settings → Account** via `/settings?tab=account`, when credentials are invalid).
- Browse source modes **Favorites** / **Since tracked** (internal value still `subscriptions`; SQL `isFavorited` / `sinceTracking`) query your **local cache** and still require a non-empty tag query in the Source switcher by design. Artist galleries (`/artist/:id`) also offer Source **All**, **Favorites**, and **Since tracked** (posts with `publishedAt` on or after you started tracking that artist). Source is hidden on the Tracked list, Favorites, Updates, and Playlists pages. AI and Media filters on those modes run in SQL before pagination. On **Source: All**, Rule34 AI hide/only and Rule34/Gelbooru Videos/Images are sent as booru tags in the live search (so pages stay full). Gelbooru still filters AI client-side after each page. **Since tracked** means posts published after you started tracking the artist, not posts whose tags happen to match a tracked artist name. Tag-combination subscriptions are **Closed — superseded by smart playlists (`is_smart`/`query_json`); no separate entity built (2026-09-12 backlog audit)** — use smart playlists for tag-combo collections.

### Favorites

**What are favorites?** Mark posts you like so you can easily find them later. Favorites are **local only** (`isFavorited` in SQLite). There is no booru account-favorites sync path (`sync:booru-favorites` does not exist).

**How to favorite a post:**

1. Open a post in the viewer (click on it)
2. Click the **star icon** (⭐) in the viewer controls
3. Or press **F** on your keyboard

**View your favorites:**

1. Click **"Favorites"** in the sidebar.
2. You'll see all your favorited posts
3. Use **Download all favorites (N)** in the header to walk the local favorites set (same cursor mass-download as artist galleries; N is the full DB count for the active filters, not only loaded pages)

**Empty states:**

- If you have no favorites and no active filters: **No favorites yet**, with a hint that **F** favorites in the viewer and a **Go to Browse** button.
- If tag chips or AI/Media filters hide every favorite: **No favorites match the current filters**, with **Clear filters** (clears tag chips and resets AI/Media filters). The app does not claim favorites exist when it cannot count them without an extra query.

**Remove from favorites:**

1. Open the post
2. Click the star icon again (or press F)
3. The star will turn gray (unfavorited)

### Playlists and Smart Collections

Use playlists to organize posts outside of tracked artists.

**Manual playlists:**

1. Open **Playlists** in the sidebar
2. Click **New Playlist**
3. Select **Manual Playlist**
4. Open any post and add it via the playlist menu

**Smart collections:**

Smart collections are a **live query** (local cache + booru API) — they are not a synced artist gallery, so Sync All does not “fill” them. Newest/oldest sort follows provider post id (same as the site for that query). The header shows **Smart Collection**, the subtitle **Live search · refreshed every 5 min or on Refresh**, and a **Refresh** button that reloads from page 1. While a newest-first (desc) collection stays open, RuleDesk periodically probes for newer remote posts (one cheap unbound request); if any appear, a polite **New posts available** banner offers the same **Refresh**. Ascending and random sorts do not probe; manual playlists never do. Re-opening the same collection within about five minutes reuses the cached pages; after that (or on Refresh) it fetches again. The first page of a newest-first collection can appear before the remote search finishes; the header shows a brief loading indicator for the total, then **Total: N** when the remote walk exhausted the feed, **N+ posts** when it hit the scan limit (a lower bound), or no number when the total is unknown. Changing the AI filter updates the visible posts and the header count immediately without reloading the collection. The count is not the number of thumbnails currently scrolled into view.

1. Open **Playlists** -> **New Playlist**
2. Select **Smart Collection**
3. Add include/exclude tags
4. Save - posts are resolved automatically from local cache and provider API

**Manual playlist header count:** shows **N entries** (raw entry count). Media / AI filters may hide some of those posts in the gallery.

**Reorder manual playlists:**

- Open a manual playlist gallery
- Drag and drop cards to reorder
- Order is saved automatically

**Transfer playlists (backup/share):**

- Use **Export Playlist** on a playlist card to save JSON file
- Use **Import Playlist** in the Playlists header to restore from JSON
- Smart collection rules are preserved during import/export

### Downloading Posts

**Download a single post:**

1. Open the post in the viewer
2. Click the **"Download Original"** button (download icon)
3. Choose where to save the file
4. Click **"Save"**

The download will start, and you'll see a progress indicator.

**After downloading:**

- Click **"Open in Folder"** to see the downloaded file
- The file will be saved with its original filename

**Mass download (Download All / selected posts):**

- Runs in a background worker (UI stays responsive). Progress shows on the button.
- On **Browse**, download applies only to posts already loaded in the feed (see the button tooltip). To download everything from an artist, track them under **Tracked artists**, then use Download All on that artist's gallery.
- List downloads (Browse loaded posts / Favorites·Updates·playlist **selected** posts): at most **5000** files (`BATCH_DOWNLOAD_LIST_MAX_FILES`). If you select more, the app shows an error and does **not** start the batch (no silent truncate). Artist gallery **Download All** and Favorites **Download all favorites** walk the local DB (cursor by row id) and are not limited by this list cap.
- Partial failures do not discard successful files. The toast shows `Downloaded X, failed Y` with reason codes (network, 403/404/429, disk, timeout). Artist gallery can expand the failed list under the button.
- HTTP **429** pauses the whole download queue (no new files start) for max(backoff, Retry-After), then retries; after retries are exhausted the file is listed as failed.
- Queue progress is written atomically (unique temp file + rename, with retries on Windows file locks). If the queue file cannot be updated after retries, that item is listed as a **disk** failure even if the media file already landed — resume can still skip an existing file when duplicate handling is **skip**.
- Cancel stops in-flight requests (including hung ones). Quitting the app cancels downloads and waits for any in-flight queue write before closing the database.
- Interrupted batches (artist **Download All**, **Download all favorites**, and list downloads) can be resumed from the pending-download banner after a restart; favorites show «Interrupted favorites download — N of M». Resume skips files already completed by id (safe with parallel downloads). Dismiss clears the pending queue.
- Optional Settings proxy applies to mass download the same as single download.

**Note:** Downloads are saved to your chosen location, not in the app's cache.

### Filters and Sorting

**Filter by source:**

1. On **Browse** or an **artist gallery**, open the top bar **Filters** control (Source is hidden on Tracked list, Favorites, Updates, and Playlists)
2. On **Browse**, choose **All** (live booru API), **Favorites** (local cache), or **Since tracked** (local cache: posts published after you started tracking the artist). On an **artist gallery**, choose **All**, **Favorites**, or **Since tracked** for that artist
3. On Browse, Favorites / Since tracked stay disabled until you enter at least one tag (tooltip explains why); the tag gate is intentional
4. Gallery updates automatically

**Filter by media type:**

1. Click **"Filters"** in the top bar
2. Choose **"Images"** or **"Videos"**
3. Gallery updates automatically

On Browse **Source: All**, Videos / Images are applied in the live API search tags (pages stay full). Local Favorites / Since tracked still filter in SQL before pagination. If your search chips already include or exclude `video` in a way that conflicts with the filter, the app skips API injection and filters in the client instead so results are not unexplained empty.

**Filter by AI content:**

1. Open **Filters** and choose **All** / **No AI** / **Only AI**
2. On Browse **Source: All** with Rule34, No AI / Only AI are applied in the live API search tags (pages stay full). Gelbooru still filters after each page loads. If your search chips already include or exclude an AI tag in a way that conflicts with the filter, the app skips API injection and filters in the client instead so results are not unexplained empty.

**Sort posts:**

1. Use the dedicated **sort** button in the top bar (outside Filters)
2. Click to toggle between newest-first and oldest-first where sorting is available (artist gallery, remote Browse, and smart collections follow provider post id; Favorites / Updates follow first-seen publish time with post id as a stable tiebreaker; manual playlists sort by date added)
3. On Browse with no tags, Sort stays disabled; hover the control for the “add a tag first” tooltip

**Filter by tags:**

1. Open a post in the viewer
2. Click the **"Tags"** button (or press **T**) to open the tags drawer
3. **Click** a tag to **include** it in the search query; **right-click** to add an **exclude** (`-tag`); included/excluded tags are highlighted (**green** / **red** rings) in the drawer
4. Artist, Character, and Copyright may show a small resolving spinner until tag types are looked up (this can take a moment on first view). “No artist detected” / “No character detected” means the lookup finished and no tag of that type was found — not that the panel is empty forever while lookup is still running
5. The gallery or browse view updates to match the query in the top bar

**Clear filters:**

- Click the **"Clear Filters"** button in the top bar
- Or manually remove filters from the tags drawer

### Marking Posts as Viewed

**Why mark posts as viewed?** This helps you keep track of what you've already seen, so you can focus on new content.

**Mark a post as viewed:**

1. Open the post in the viewer
2. Press **V** on your keyboard
3. Or click the **"Mark as Viewed"** button

**Visual indicator:**

- Viewed posts show a small badge/indicator on the post card
- This helps you quickly see what's new

**Mark all as viewed (Updates feed):**

1. Open **Updates** in the sidebar
2. In the **Feed** tab, click **Mark all read** to mark unread posts in the feed scope (posts since you started tracking each artist). If tag chips are active, only posts matching that filter are marked.

Tag chips from the top bar still filter the Updates feed. When they do, a **Filtered by:** banner is shown; clear chips to restore the full feed.

**Empty Updates feed:** with no tracked artists, **Track an artist** opens Tracked with the add dialog (`/tracked?add=1`, then clears the query). If artists exist but sync has never completed, **Sync now** starts the same Sync All pipeline as the sidebar.

---

## Navigation

RuleDesk has a **sidebar** on the left side with the main sections:

### Sidebar Sections

- **Updates** - See new posts from your tracked sources. A purple badge shows unread count and auto-refreshes periodically.
- **Browse** - Search the live booru (Source: All) or filter cached posts (Favorites / Since tracked); infinite scroll, filters, and sorting
- **Favorites** - Local favorited posts only (`isFavorited`); no booru account-favorites sync
- **Playlists** - Manual playlists and smart collections
- **Statistics** - Local library aggregates and charts (`/stats`)
- **Tracked artists** - Manage tracked artists and tags (sync all posts, full download, Updates feed)
- **Settings** - App configuration and preferences

**Unread badge behavior (Updates):**

- The badge appears only when unread count is greater than zero.
- The badge counts unread posts in the Updates feed scope (since tracking began), not the full library history and not the current tag filter.
- Opening **Updates** marks only the posts loaded into the feed as seen (pagination marks newly loaded pages). Posts not yet loaded stay unread until you scroll to them or use **Mark all read**.
- Background sync does not auto-mark updates as seen.

### Top Bar

The **top bar** appears on content pages and provides:

- **Search box** - Search for artists, tags, or posts
- **Search box behavior** - Uses available width on the left side of the top bar; chips can wrap to a second row when needed
- **Filters button** - Open filters panel
- **Sort dropdown** - Change sorting order
- **View toggle** - Switch between grid and masonry views
- **Sync status** - See last sync time and progress

### Safe Mode

Safe Mode (blur sensitive ratings on cards and in the viewer) is available only while the panic button is enabled; turning the button off also turns Safe Mode off. The floating control toggles panic/safe blur (`safeModeStore` → `PostCard` / `ViewerMedia`).

### Keyboard Shortcuts

**In the viewer:**

- **Open in browser** - Toolbar button opens the post on the source site (same action as the former menu-only control)
- **Esc** - Close viewer
- **← / →** - Previous/Next post
- **F** - Toggle favorite
- **V** - Mark as viewed
- **T** - Toggle tags drawer
- **Mouse side buttons (Back/Forward)** - Captured by viewer; trigger viewer exit flow instead of navigating background pages

**Global:**

- Global shortcut mappings may vary by platform/build. Use sidebar and top bar controls as the primary interaction model.

---

## Settings

Access Settings by clicking **"Settings"** in the sidebar.

| Was (≤19.1) | Now |
|-------------|-----|
| General | **General** (Setup + General + Sync + Appearance sections) |
| Sync | folded into **General** |
| Appearance | folded into **General** |
| Backup | **Data** (backup/maintenance + Danger zone last) |
| Account / Blacklist / Help | unchanged names |

Deep links: `/settings` opens **General**. Current ids: `general`, `data`, `account`, `blacklist`, `help`. Legacy `?tab=sync|appearance` → General; `?tab=backup` → Data. Unknown/missing `tab` → General. Credential CTAs use `/settings?tab=account`.

### General

- **Setup** - Download folder; Sync on startup; Theme
- **Downloads / tray / proxy** - Duplicate behavior; folder structure; minimize to tray; optional proxy
- **Sync** - Sync new artist automatically; sync interval (Disabled / 15 / 30 / 60 / 120). **Sync now** remains in the sidebar (not in Settings)
- **Appearance** - Card border / grid
- **Show panic button** - Off by default. When enabled, the floating Safe Mode button appears; turning it off also turns Safe Mode off (no stuck blur without an exit control)

### Data

- **Backup / restore / integrity / orphans / auto-backup / retention / VACUUM** (former Backup tab)
- **Danger zone** (last) - **Delete all data…** — same wipe behavior as before (now under Data, not General)

### Blacklist / Help / Account

- Blacklist and Help unchanged
- **Account** - credentials fields as before, plus **Log Out** (confirm dialog; clears API credentials). Log Out is not in the sidebar next to Sync now

**Important:** API key is encrypted with OS-level security and bound to the current user on the current machine. If you move to another computer or another Windows account, the key cannot be decrypted and must be entered again in **Settings -> Account**.

### Status badges behavior

- Success/error badges in Settings are temporary and auto-hide after about **5 seconds**.

**How to create a backup:**

1. Go to **Settings** → **Data**
2. Click **Create Backup**
3. A timestamped backup file is created under `RuleDesk-Backups` (the folder opens in Explorer/Finder)

**How to restore a backup:**

1. Go to **Settings** → **Data**
2. Click **Restore Backup**
3. Select a backup file (dialog defaults to `RuleDesk-Backups`)
4. Confirm restore
5. The app reloads automatically

**Newer-app backups:** If the backup was made by a **newer** RuleDesk version than the one you are running, restore fails with an error and rolls back to your current database. Update the app first, then restore again.

---

## Statistics Dashboard

Open **Statistics** from the sidebar to see a quick health overview of your local library.

### What each metric means

- **Artists** - how many tracked artists/sources you currently have.
- **Posts** - total posts stored in your local cache.
- **Favorites** - posts marked as favorite.
- **Unviewed** - posts you have not viewed yet.
- **Rating Distribution** - split of all posts by rating (`Safe`, `Questionable`, `Explicit`).
- **Media Type Split** - images vs videos in your local cache.
- **Viewed vs Unviewed** - what you've already seen vs still new.
- **Favorites vs Others** - favorited posts vs the rest.
- **Media and Providers**:
  - `Images` / `Videos` are post counts.
  - `rule34 artists` / `other artists` are artist/source counts (not post counts). `other` covers legacy non-Rule34 rows (e.g. Gelbooru) still in the database.
- **Top Artists** - artists with the most posts in your local cache.
  - Technical placeholder artist `Artist 0` is excluded from this list.
- **Top Tags** - most frequent tags across cached posts.
- **Database Size** - current size of your local database file on disk.

### Notes

- Statistics are local to your app database (not a live remote total from providers).
- After sync or bulk actions, values update when the page data is refreshed.

---

## Troubleshooting

### "No API credentials" error

**Problem:** App says you need to enter API credentials.

**Solution:**

1. Go to Settings
2. Click "Logout" to clear old credentials
3. Follow the [Getting Your API Credentials](#getting-your-api-credentials) steps again

### Sync not working

**Problem:** Sync button doesn't do anything, or sync fails.

**Solutions:**

1. Check your internet connection
2. Verify your API credentials are correct (Settings > Logout and re-enter)
3. Check if Rule34.xxx website is accessible
4. Try syncing a single artist first (click on artist, then "Repair" button)

### Posts not showing up

**Problem:** You synced but don't see any posts.

**Solutions:**

1. Make sure the artist has posts on the website
2. Check active top-bar filters (AI/media/source) that may hide posts
3. Try the "Repair" button on the artist card (resyncs from beginning)
4. Check the sync progress messages for errors

### Browse stopped loading more posts

**Problem:** Scrolling Browse (Source: **All**) no longer loads new posts.

**Solutions:**

1. Confirm API credentials in **Settings → Account**
2. Clear restrictive filters (AI, media). On Browse Favorites / Since tracked those filters run in SQL before pagination. On Source: All with Rule34, AI hide/only is applied in the live API tag query (fuller pages); Gelbooru AI still filters client-side after each API page. On Source: All, Videos / Images inject the live-verified `video` / `-video` tag for Rule34 and Gelbooru (worker/client filter only on chip conflict).
3. If using **Favorites** / **Since tracked**, add at least one tag in the search bar (required by design)
4. If Browse shows a centered error screen (not the empty “no posts” state), use **Retry** or **Open Settings** for auth failures (opens **Settings → Account**) — messages distinguish invalid API credentials, rate limits, and network errors

### Video playback glitches / stuck loading

**Problem:** A video fails to play, stalls, or shows a broken frame after a previous interrupt.

**Solutions:**

1. Retry opening the post (proxy may fall back to the direct CDN URL while resolving)
2. If problems persist across many videos, manually delete the `video-cache` folder under `RuleDesk-Data` and restart — or use **Settings → General → Danger zone → Delete all data** as a last resort (wipes all of `RuleDesk-Data`)
3. Known limitation: if playback still fails after an interrupt, clear `video-cache` under `RuleDesk-Data` (or use Danger zone wipe). Cache writes are atomic (tmp + rename with lock retry); incomplete downloads should not become hits.

### Artist sync seems to skip newer posts

**Problem:** After an interrupted or failed sync, later syncs miss posts that should appear.

**Solutions:**

1. Use **Repair** on the artist (resync from the beginning)
2. Incomplete runs set `lastSyncIncomplete` and leave `lastPostId` unchanged so the next sync can refill gaps. If gaps persist after a successful complete sync, use Repair.
3. Quitting while sync is running asks sync to stop and waits briefly before closing the database. Force-closing the process (Task Manager / kill) can still interrupt mid-sync — restart and sync again (or Repair if needed).

### App is slow

**Problem:** App feels sluggish, especially with many posts.

**Solutions:**

1. Check database location and status in **Settings → Data**
2. Reduce the number of tracked artists
3. Use filters to reduce the number of visible posts
4. Run **Check Integrity** in **Settings → Data**
5. Run **Run VACUUM now** in **Settings → Data** (Database Maintenance section)

### Can't download files

**Problem:** Download button doesn't work or files don't save.

**Solutions:**

1. Check if you have write permissions to the download folder
2. Make sure you have enough disk space
3. Try choosing a different download location
4. Check if your antivirus is blocking file writes

### Database errors

**Problem:** App shows database errors or won't start.

**Solutions:**

1. **Create a backup first** (if app still opens)
2. Try restoring from a recent backup
3. If that doesn't work, you may need to delete the database and start fresh:
   - Close the app
   - Delete the database file (location shown in Settings)
   - Restart the app (it will create a new database)
   - Re-enter your credentials and re-add artists

**Database locations:**

The application redirects `userData` to a neutral `RuleDesk-Data` directory. Development and packaged builds use the same paths on a given machine:

- **Windows:**
  - Database: `%LOCALAPPDATA%\RuleDesk-Data\data.bin`
  - Logs (only active file): `%LOCALAPPDATA%\RuleDesk-Data\logs\app.log` — ignore any leftover `%APPDATA%\RuleDesk\logs\` from older builds or tools
  - Backup schedule: `%LOCALAPPDATA%\RuleDesk-Data\backup-settings.json`
  - DB backups: `%LOCALAPPDATA%\RuleDesk-Backups\`
- **macOS:** `~/Library/Application Support/RuleDesk-Data/` (backups: `…/RuleDesk-Backups/`)
- **Linux:** `~/.config/RuleDesk-Data/` (backups: `…/RuleDesk-Backups/`)

**Note:** Data is not stored next to `RuleDesk.exe`. You can move or replace the app folder freely; local database, logs, and settings stay under `RuleDesk-Data` until you delete that directory. Timestamped DB backups live in the sibling `RuleDesk-Backups` folder (survives Danger-zone wipe and typical cache cleaners).

**Delete all data (in-app):** Settings → Data → **Danger zone** → **Delete all data…**. Confirm with the checkbox, then confirm. The app closes the database, stops the video proxy, deletes everything inside `RuleDesk-Data` (database + WAL/SHM, `video-cache/`, logs, `backup-settings.json`, download queue, Electron cache files), and quits. Your separate media download folder and DB backups under `RuleDesk-Backups` are not deleted. After restart you see the account sign-in screen again. Prefer this over uninstalling the `.exe` alone — uninstall does not remove `RuleDesk-Data` or `RuleDesk-Backups`.

**Legacy (pre-relocate builds):** `%APPDATA%\RuleDesk\` or `%LOCALAPPDATA%\.rdcache\` may still contain old `logs/`, `backup-settings.json`, or `data.bin`. New builds copy light files into `RuleDesk-Data` and move `data.bin` on first launch when targets are missing. Leftover backup files under those old locations are moved into `RuleDesk-Backups` on a deferred startup migrate. Do not run a pre-relocate binary after upgrading — it will not see `RuleDesk-Data` and may create an empty DB under `.rdcache`.

---

## Tips & Tricks

### Organizing Your Collection

- **Use favorites** to mark posts you want to keep
- **Mark posts as viewed** to track what you've seen
- **Use filters** to find specific content quickly
- **Create backups regularly** to protect your data

### Performance Tips

- **Limit tracked artists** - More artists = longer sync times
- **Use filters** - Filtering reduces the number of posts to render
- **Create backups periodically** - Keeps recovery path simple
- **Use sync interval carefully** - Lower intervals increase background workload

### Workflow Suggestions

1. **Start small** - Add a few artists first to get familiar
2. **Sync regularly** - Set up automatic sync for convenience
3. **Use favorites** - Mark posts you like as you browse
4. **Filter effectively** - Use AI/media/source filters and tag search to find what you want
5. **Backup often** - Create backups before major changes

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the Troubleshooting section** above
2. **Review the [README](../README.md)** for technical details
3. **Check [GitHub Issues](https://github.com/KazeKaze93/ruledesk/issues)** for known problems
4. **Create a new issue** if you found a bug

---

## What's Next?

Now that you know the basics, explore:

- **Advanced filtering** - Combine multiple filters for precise results
- **Keyboard shortcuts** - Speed up your workflow
- **Backup strategies** - Keep your data safe
- **Rule34 tracking** - Track artists from Rule34.xxx (legacy Gelbooru artists remain in the library but are no longer synced)

**Happy browsing!** 🎨
