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

Application data is stored in the same location as the dev build (`%LOCALAPPDATA%/.rdcache` on Windows). Updates: use **Download** in the in-app notification to open the latest release on GitHub.

### Linux

1. Download the `RuleDesk-<version>.AppImage` file from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Make it executable: `chmod +x RuleDesk-*.AppImage`
3. Run it: `./RuleDesk-*.AppImage`

**Notes:**

- AppImage bundles the app; no system-wide install is required.
- Some distributions need FUSE (`libfuse2`) to run AppImages. If launch fails, install your distro's `libfuse2` / `fuse` package and retry.
- Application data: `~/.config/.rdcache/` (same as a local dev build on Linux).

### macOS — not distributed

macOS **`.dmg` installers are not published**. Reasons:

- Apple **code signing and notarization** are required for a smooth “open from Downloads” experience on modern macOS.
- That needs a paid Apple Developer account, signing certificates, and extra CI secrets/maintenance.

The Electron app can still be built from source on a Mac (`npm install && npm run dev`, or `electron-builder --mac` locally), but **GitHub Releases do not include a macOS binary**. Use Windows or Linux releases, or build from source.

### Build from source (any OS)

Clone the repo, run `npm install`, then `npm run dev`. See [README — Development Setup](https://github.com/KazeKaze93/ruledesk#-development-setup) for the full gate (`validate`, tests, native rebuild notes).

---

## First Launch

When you first open RuleDesk, you'll see the **Onboarding** screen. This is where you'll enter your API credentials.

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

   - You can paste the entire URL from the account page, and RuleDesk will automatically extract the credentials
   - Or manually enter them in the fields

6. **Click "Save and Login"**

That's it! You're now ready to use RuleDesk.

---

## Basic Usage

### Adding Artists to Track

**What is "tracking"?** Tracking means RuleDesk will automatically check for new posts from specific artists or tags.

**How to add an artist:**

1. Click the **"Artists"** button in the sidebar (left side of the screen)

2. Click the **"+ Add Artist"** button (top right)

3. Fill in the form:

   - **Name** - A friendly name for this artist (e.g., "My Favorite Artist")
   - **Tag** - The tag or username to track (e.g., "artist_name" or "tag_name")
   - **Type** - Choose:
     - **Tag** - Track posts with this tag
     - **Uploader** - Track posts uploaded by this user
     - **Query** - Track posts matching a custom query
   - **Source** - Choose which site to use (Rule34.xxx or Gelbooru)

4. Click **"Add"**

The artist will appear in your tracked list!

**Tip:** You can use the search box to find tags. Type a few letters and RuleDesk will suggest matching tags.

### Synchronizing Posts

**What is synchronization?** This is when RuleDesk downloads new posts from the website and saves them to your local database.

**How to sync:**

1. Click the **"Sync All"** button in the sidebar (top of the sidebar, with a refresh icon)

2. Wait for the sync to complete. You'll see progress messages like:

   - "Syncing artist_name..."
   - "Found 15 new posts"
   - "Sync complete!"

3. The sync runs in the background, so you can continue using the app while it syncs

**Automatic sync (optional):**

1. Open **Settings** (sidebar) → **Sync**
2. Enable **Sync on startup** if you want a full sync every time the app starts
3. Set **Sync interval** to run background sync while the app is open (or leave **Disabled** and use **Sync All** in the sidebar when you want)

You can still run **Sync All** manually at any time; automatic runs use the same engine and rate limits.

### Viewing Posts

**To view posts from a tracked artist:**

1. Go to **"Artists"** page
2. Click on an artist card
3. You'll see a gallery of all their posts

**In the gallery:**

- **Scroll down** to see more posts (they load automatically)
- **Click on a post** to open it in full-screen viewer
- **Use arrow keys** (← →) to navigate between posts
- **Press Esc** to close the viewer

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

1. Go to **"Artists"** page
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
- **Infinite scroll:** on Browse with **Source: All**, scroll down to load more posts from the booru API (50 per batch; RuleDesk continues past the API offset cap automatically).
- **API failures vs empty results:** a genuine empty search shows the “no posts” empty state; auth, rate-limit, network, or parse failures show a centered error screen with **Retry** (and **Open Settings** when credentials are invalid).
- Browse source modes **Favorites** / **Subscriptions** query your **local cache** and require a non-empty tag query by design.

### Favorites

**What are favorites?** Mark posts you like so you can easily find them later.

**How to favorite a post:**

1. Open a post in the viewer (click on it)
2. Click the **star icon** (⭐) in the viewer controls
3. Or press **F** on your keyboard

**View your favorites:**

1. Click **"Favorites"** in the sidebar
2. You'll see all your favorited posts

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

1. Open **Playlists** -> **New Playlist**
2. Select **Smart Collection**
3. Add include/exclude tags
4. Save - posts are resolved automatically from local cache and provider API

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

**Note:** Downloads are saved to your chosen location, not in the app's cache.

### Filters and Sorting

**Filter by source:**

1. In views that show the filter panel, open the top bar **Filters** control
2. Choose **All** (live booru API), **Favorites** (local cache), or **Subscriptions** (local cache, tracked artists/tags)
3. Gallery updates automatically

**Filter by media type:**

1. Click **"Filters"** in the top bar
2. Choose **"Images"** or **"Videos"**
3. Gallery updates automatically

**Sort posts:**

1. Use the dedicated **date sort** button in the top bar (outside Filters)
2. Click to toggle between newest-first and oldest-first where sorting is available

**Filter by tags:**

1. Open a post in the viewer
2. Click the **"Tags"** button (or press **T**) to open the tags drawer
3. **Click** a tag to **include** it in the search query; **right-click** to add an **exclude** (`-tag`); included/excluded tags are highlighted (**green** / **red** rings) in the drawer
4. The gallery or browse view updates to match the query in the top bar

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
2. In the **Feed** tab, click **Mark all read** in the top bar to mark every post currently shown in the feed as viewed

---

## Navigation

RuleDesk has a **sidebar** on the left side with the main sections:

### Sidebar Sections

- **Updates** - See new posts from your tracked sources. A purple badge shows unread count and auto-refreshes periodically.
- **Browse** - Search the live booru (Source: All) or filter cached posts (Favorites / Subscriptions); infinite scroll, filters, and sorting
- **Favorites** - Your favorited posts collection
- **Playlists** - Manual playlists and smart collections
- **Artists** - Manage your tracked artists and tags
- **Settings** - App configuration and preferences

**Unread badge behavior (Updates):**

- The badge appears only when unread count is greater than zero.
- Opening the **Updates** page marks all cached updates as seen and clears the badge after refresh.
- Background sync does not auto-mark updates as seen; this happens only on explicit navigation to **Updates**.

### Top Bar

The **top bar** appears on content pages and provides:

- **Search box** - Search for artists, tags, or posts
- **Search box behavior** - Uses available width on the left side of the top bar; chips can wrap to a second row when needed
- **Filters button** - Open filters panel
- **Sort dropdown** - Change sorting order
- **View toggle** - Switch between grid and masonry views
- **Sync status** - See last sync time and progress

### Safe Mode

Use the **Safe Mode** control in the app shell (`PanicButton`) to blur sensitive ratings on gallery cards and in the full-screen viewer. Blur amount and panic state live in `safeModeStore` and apply in `PostCard` / `ViewerDialog`.

### Keyboard Shortcuts

**In the viewer:**

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

Settings are split into tabs:

### General

- **Default download folder** - Choose a folder or reset to default
- **When file already exists** - Choose `Skip` or `Overwrite`
- **Folder structure** - `Flat` or `By artist`
- **Proxy URL** - Optional HTTP/HTTPS proxy for requests/downloads
- **Danger zone** - **Delete all data…** (checkbox + confirm). Closes the DB, stops the video proxy, deletes the contents of `.rdcache`, and quits. Media downloads outside `.rdcache` are not removed.

### Sync

- **Sync on startup** - Run sync automatically when app starts
- **Sync interval** - Disabled, 15 / 30 / 60 / 120 minutes
- **Sync now** - Manual sync trigger in the sidebar
- **Last sync status** - Relative timestamp under the sidebar sync button (`never`, `X min ago`, etc.)

### Appearance

- **Theme** - `System`, `Light`, `Dark`

### Blacklist

- **Tag blacklist** - Hide posts that contain specific tags from Browse and local galleries
- Tags are stored locally; pagination still uses the raw API batch size before filtering

### Backup

- **Create Backup** - Save a timestamped backup of your database
- **Restore Backup** - Restore from a backup file (app reloads after success)
- **Check Integrity** - Verify database is not corrupted
- **Auto-backup** - Choose `Never`, `Daily`, or `Weekly` (checked on app startup)
- **Retention** - Older files are rotated automatically according to `Retention` value (`backupRetention`, range `1..20`)
- **Database Maintenance (VACUUM)** - See last VACUUM run status/time, run VACUUM manually, and choose maintenance schedule (`Manual`, `Weekly`, `Monthly`)

### Account

- **API key field** - Password-style input with show/hide button
- **API key status** - `Configured` / `Not configured` badge
- **Save API key** - Update credentials from Settings

**Important:** API key is encrypted with OS-level security and bound to the current user on the current machine. If you move to another computer or another Windows account, the key cannot be decrypted and must be entered again in **Settings -> Account**.

### Status badges behavior

- Success/error badges in Settings are temporary and auto-hide after about **5 seconds**.

**How to create a backup:**

1. Go to **Settings** → **Backup**
2. Click **Create Backup**
3. A timestamped backup file is created

**How to restore a backup:**

1. Go to **Settings** → **Backup**
2. Click **Restore Backup**
3. Select a backup file
4. Confirm restore
5. The app reloads automatically

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
  - `rule34 artists` / `gelbooru artists` are artist/source counts (not post counts).
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
2. Clear restrictive filters (AI, media, rating, date) — client-side filters only apply to already loaded pages
3. If using **Favorites** / **Subscriptions**, add at least one tag in the search bar (required by design)
4. If Browse shows a centered error screen (not the empty “no posts” state), use **Retry** or **Open Settings** for auth failures — messages distinguish invalid API credentials, rate limits, and network errors

### Video playback glitches / stuck loading

**Problem:** A video fails to play, stalls, or shows a broken frame after a previous interrupt.

**Solutions:**

1. Retry opening the post (proxy may fall back to the direct CDN URL while resolving)
2. If problems persist across many videos, manually delete the `video-cache` folder under `.rdcache` and restart — or use **Settings → General → Danger zone → Delete all data** as a last resort (wipes all of `.rdcache`)
3. Known limitation: if playback still fails after an interrupt, clear `video-cache` under `.rdcache` (or use Danger zone wipe). Cache writes are atomic (tmp + rename); incomplete downloads should not become hits.

### Artist sync seems to skip newer posts

**Problem:** After an interrupted or failed sync, later syncs miss posts that should appear.

**Solutions:**

1. Use **Repair** on the artist (resync from the beginning)
2. Incomplete runs set `lastSyncIncomplete` and leave `lastPostId` unchanged so the next sync can refill gaps. If gaps persist after a successful complete sync, use Repair.

### App is slow

**Problem:** App feels sluggish, especially with many posts.

**Solutions:**

1. Check database location and status in **Settings → Backup**
2. Reduce the number of tracked artists
3. Use filters to reduce the number of visible posts
4. Run **Check Integrity** in **Settings → Backup**
5. Run **Run VACUUM now** in **Settings → Backup** (Database Maintenance section)

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

The application redirects `userData` to a neutral `.rdcache` directory. Development and packaged builds use the same paths on a given machine:

- **Windows:**
  - Database: `%LOCALAPPDATA%\.rdcache\data.bin`
  - Logs: `%LOCALAPPDATA%\.rdcache\logs\app.log`
  - Backup schedule: `%LOCALAPPDATA%\.rdcache\backup-settings.json`
- **macOS:** `~/Library/Application Support/.rdcache/`
- **Linux:** `~/.config/.rdcache/`

**Note:** Data is not stored next to `RuleDesk.exe`. You can move or replace the app folder freely; local database, logs, and settings stay under `.rdcache` until you delete that directory.

**Delete all data (in-app):** Settings → General → **Danger zone** → **Delete all data…**. Confirm with the checkbox, then confirm. The app closes the database, stops the video proxy, deletes everything inside `.rdcache` (database + WAL/SHM, `video-cache/`, logs, `backup-settings.json`, in-app `.ruledesk-backup-*.db` files, download queue, Electron cache files), and quits. Your separate media download folder is not deleted. After restart you go through the age gate / onboarding again. Prefer this over uninstalling the `.exe` alone — uninstall does not remove `.rdcache`.

**Legacy (pre-fix builds):** `%APPDATA%\RuleDesk\` may still contain old `logs/` and `backup-settings.json`. New builds copy them into `.rdcache` on first launch when targets are missing.

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
- **Multiple sources** - Track artists from different sites (Rule34.xxx, Gelbooru)

**Happy browsing!** 🎨
