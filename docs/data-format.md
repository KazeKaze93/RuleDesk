# Backup file

RuleDesk → Data → **Export** writes one JSON file, `ruledesk-web-backup-<YYYY-MM-DD>.json`. **Import** reads it back. The code is in `src/storage/backup.ts`; the shape of `storage` is defined in `src/storage/schema.ts`.

## What is in it

- `storage`: collections, followed artists, seen marks, settings, the feed's seen mark
- `favs`: the local favorite ids, only when "Include favorites" is on. Favorites are normally restored with Favorites sync, not from the file
- `background`: the custom theme's background image as a string, only when "Include background image" is on

The blacklist and the site theme are site cookies and are never in the file.

## Import modes

- **Merge**: collections are joined by `id`, artists by `tag`, marks by post id; favorites are united. For an artist present on both sides the file's fields are laid over the current ones, so a file that has only the tag does not wipe a known cover or count. Settings come from the file
- **Replace**: the stored data becomes what the file holds. A file without `favs` leaves the local favorite list as it is

Not taken from a file in either mode: `favs.sync` (the state of a run of "Sync favorites" is of the browser it ran in), and picture addresses that are not on the site (covers, thumbs, `settings.appearance.custom.backgroundImage`). `background` must be a picture as `data:image/...;base64,` no larger than the limit for a background: a file where it is anything else is refused whole, before anything is written.

Before an import the current data is copied to `ruledesk-web.storage.backup` in the script manager's storage.

## Shape

Example backup shape (no real data):

```json
{
  "format": "ruledesk-web-backup",
  "version": 1,
  "exportedAt": "2026-11-13T03:30:00.000Z",
  "storage": {
    "version": 1,
    "collections": [],
    "artists": [{ "tag": "example_artist" }],
    "marks": {},
    "settings": {
      "gridFavButtons": true,
      "updatesGroupSize": 0,
      "playlistChunkSize": 40,
      "tweaksEnabled": true,
      "appearance": { "theme": "light" }
    },
    "updates": { "seenPostId": 0 }
  },
  "favs": {
    "version": 1,
    "ids": [101, 202]
  }
}
```

(`background` is an optional string when “Include background image” is on.)

A followed artist can carry more than the tag:

```json
{
  "tag": "example_artist",
  "addedAt": 1794700000000,
  "cover": ["https://wimg.rule34.xxx/thumbnails/1/thumbnail_x.jpg?1"],
  "postCount": { "value": 2711, "exact": true },
  "lastPostId": 19349998,
  "lastPostSince": 1794600000000
}
```

`exact: false` in `postCount` means "at least this many". A followed entry may also carry `kind` (`"character"` or `"copyright"`; absent for an artist) and `group` (the name of its group on the Following page). A collection may carry `group` too, the name of its group on the Collections page. The names of the groups, kept so that an empty group is not lost, are in `settings.featureState` under `follow-groups` and `collection-groups`, each a list of names in the order the groups were made, which is the order of the tabs. Also there: `upload-tag-sets`, the sets of tags of the Upload page, a list of `{ name, tags }`; and `tag-types`, the kinds of tags the script saw on the site, a list of strings `a:tag`, `c:tag`, `p:tag`, `m:tag` (artist, character, copyright, metadata), at most 3000, the oldest dropped first. A dynamic collection carries `query`, and optionally `cover` and `postCount` of the same kind, `openedPostId` (the newest post when it was last opened) and `newestPostId` (the newest found by "Check for new"); a custom collection carries `kind: "posts"`, `postIds` and `thumbs`.

Seen marks are capped to the newest 20,000 or so post ids on write.
