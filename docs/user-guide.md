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
  - [Downloading Posts](#downloading-posts)
  - [Filters and Sorting](#filters-and-sorting)
  - [Marking Posts as Viewed](#marking-posts-as-viewed)
- [Navigation](#navigation)
- [Settings](#settings)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Windows

1. Download the installer from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Run the installer (`.exe` file)
3. Follow the installation wizard
4. RuleDesk will be installed in your Programs folder

**Portable Version (Optional):**

If you prefer a portable version that doesn't require installation:

1. Download the portable `.exe` file
2. Extract it to any folder
3. Run `RuleDesk.exe` directly
4. Your data will be stored in a `data/` folder next to the executable

### macOS

1. Download the `.dmg` file from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Open the `.dmg` file
3. Drag RuleDesk to your Applications folder
4. Open RuleDesk from Applications (you may need to allow it in System Preferences > Security)

### Linux

1. Download the `.AppImage` file from the [Releases page](https://github.com/KazeKaze93/ruledesk/releases)
2. Make it executable: `chmod +x RuleDesk-*.AppImage`
3. Run it: `./RuleDesk-*.AppImage`

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

1. Click the **"Tracked"** button in the sidebar (left side of the screen)

2. Click the **"Add Source"** button (top right, with a + icon)

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

**Automatic Sync:**

You can enable automatic sync in Settings:

- **Auto-sync on startup** - Syncs when you open the app
- **Periodic sync** - Syncs every X minutes while the app is running

**How to enable:**

1. Go to **Settings** (sidebar)
2. Scroll to **Sync Settings**
3. Toggle **"Auto-sync on Startup"** ON
4. Set **"Periodic Sync Interval"** (e.g., 30 minutes)

### Viewing Posts

**To view posts from a tracked artist:**

1. Go to **"Tracked"** page
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

1. Go to **"Tracked"** page
2. Use the search box at the top
3. Type the artist name or tag
4. Results appear as you type

**Search for tags remotely:**

1. When adding an artist, start typing in the "Tag" field
2. RuleDesk will search the website's tag database
3. Select a tag from the suggestions

**Search posts:**

1. Go to **"Browse"** page (when implemented)
2. Use the search bar in the top bar
3. Type tags or keywords
4. Results will filter automatically

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

**Filter posts by rating:**

1. In any gallery view, look at the top bar
2. Click the **"Filters"** button
3. Select a rating: **Safe**, **Questionable**, or **Explicit**
4. The gallery will update to show only posts with that rating

**Filter by media type:**

1. Click **"Filters"** in the top bar
2. Choose **"Images"** or **"Videos"**
3. Gallery updates automatically

**Sort posts:**

1. Click the **"Sort"** dropdown in the top bar
2. Choose:
   - **Date Added (Newest)** - Recently synced posts first
   - **Date Added (Oldest)** - Oldest synced posts first
   - **Posted Date** - When the post was originally posted
   - **Rating** - Group by rating

**Filter by tags:**

1. Open a post in the viewer
2. Click the **"Tags"** button (or press **T**) to open the tags drawer
3. Click on any tag to add it as a filter
4. Right-click (or hold modifier key) to exclude a tag
5. The gallery will update to show only posts matching your filters

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

**Mark all as viewed:**

- This feature is planned for future releases

---

## Navigation

RuleDesk has a **sidebar** on the left side with the main sections:

### Sidebar Sections

- **Updates** - See all new posts from your tracked artists (planned)
- **Browse** - Browse all cached posts with filters (planned)
- **Favorites** - Your favorited posts collection
- **Tracked** - Manage your tracked artists and tags
- **Settings** - App configuration and preferences

### Top Bar

The **top bar** appears on content pages and provides:

- **Search box** - Search for artists, tags, or posts
- **Filters button** - Open filters panel
- **Sort dropdown** - Change sorting order
- **View toggle** - Switch between grid/list views
- **Sync status** - See last sync time and progress

### Keyboard Shortcuts

**In the viewer:**

- **Esc** - Close viewer
- **← / →** - Previous/Next post
- **F** - Toggle favorite
- **V** - Mark as viewed
- **T** - Toggle tags drawer

**Global:**

- **Ctrl/Cmd + S** - Sync all (planned)
- **Ctrl/Cmd + F** - Focus search (planned)

---

## Settings

Access Settings by clicking **"Settings"** in the sidebar.

### Sync Settings

- **Auto-sync on Startup** - Automatically sync when you open the app
- **Periodic Sync Interval** - How often to check for new posts (e.g., every 30 minutes)
- **Rate Limiting** - Adjust delays between API requests (advanced)

### Storage & Cache

- **Cache Limit** - Maximum size for cached preview images
- **Clear Cache** - Remove all cached images (frees up disk space)
- **Storage Usage** - See how much space the app is using

### Security

- **API Key Storage** - Your credentials are encrypted and stored securely
- **Logout** - Clear your credentials and return to onboarding

### Database Management

- **Create Backup** - Save a backup of your database (recommended before major changes)
- **Restore Backup** - Restore from a previous backup
- **Integrity Check** - Verify database is not corrupted
- **Vacuum/Compact** - Optimize database file size

**How to create a backup:**

1. Go to **Settings**
2. Scroll to **Database Management**
3. Click **"Create Backup"**
4. A backup file will be created with a timestamp
5. The file location will open automatically

**How to restore a backup:**

1. Go to **Settings** > **Database Management**
2. Click **"Restore Backup"**
3. Select your backup file
4. Confirm the restore
5. The app will restart automatically

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
2. Check if you're filtering by rating (maybe posts are filtered out)
3. Try the "Repair" button on the artist card (resyncs from beginning)
4. Check the sync progress messages for errors

### App is slow

**Problem:** App feels sluggish, especially with many posts.

**Solutions:**

1. Clear the cache (Settings > Storage & Cache > Clear Cache)
2. Reduce the number of tracked artists
3. Use filters to reduce the number of visible posts
4. Compact the database (Settings > Database Management > Vacuum/Compact)

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

- **Windows:** `%APPDATA%/RuleDesk/metadata.db`
- **macOS:** `~/Library/Application Support/RuleDesk/metadata.db`
- **Linux:** `~/.config/RuleDesk/metadata.db`
- **Portable:** `data/metadata.db` (next to executable)

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
- **Clear cache periodically** - Frees up disk space
- **Compact database** - Keeps database file size optimized

### Workflow Suggestions

1. **Start small** - Add a few artists first to get familiar
2. **Sync regularly** - Set up automatic sync for convenience
3. **Use favorites** - Mark posts you like as you browse
4. **Filter effectively** - Use rating and tag filters to find what you want
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
