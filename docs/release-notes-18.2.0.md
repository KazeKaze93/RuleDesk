# RuleDesk 18.2.0

## What's new

- **Track & download all** from Browse — when your search is a single artist tag, you can track that artist and download their full library in one step.
- Clearer **Tracked artists** section — labels and help text make it easier to tell Browse downloads apart from tracked-artist sync and download.

## Fixed

- Favorites and viewed state stay correct when the same post id exists on both Rule34 and Gelbooru.
- The same artist name can be tracked separately on Rule34 and Gelbooru without overwriting each other.
- More reliable database behavior: maintenance and repair no longer leave the library in a bad state; playlist import is safer; failures surface as real errors instead of empty results.
- Faster artist galleries and Stats after sync, including smoother Sync All and blacklist filtering.
- Download progress is saved reliably on Windows during large downloads (no more failed queue saves).

## Important

On first launch after this update, RuleDesk upgrades your database automatically. A snapshot is taken before the upgrade so you can recover if something goes wrong. Let the app finish starting before you quit.

## Pull requests

- https://github.com/KazeKaze93/RuleDesk/pull/196
- https://github.com/KazeKaze93/RuleDesk/pull/197
- https://github.com/KazeKaze93/RuleDesk/pull/198
- https://github.com/KazeKaze93/RuleDesk/pull/199
- https://github.com/KazeKaze93/RuleDesk/pull/200
- https://github.com/KazeKaze93/RuleDesk/pull/201
- https://github.com/KazeKaze93/RuleDesk/pull/202
- https://github.com/KazeKaze93/RuleDesk/pull/203
- https://github.com/KazeKaze93/RuleDesk/pull/204
- https://github.com/KazeKaze93/RuleDesk/pull/205
- https://github.com/KazeKaze93/RuleDesk/pull/206
- https://github.com/KazeKaze93/RuleDesk/pull/207
- https://github.com/KazeKaze93/RuleDesk/pull/208
- https://github.com/KazeKaze93/RuleDesk/pull/209
- https://github.com/KazeKaze93/RuleDesk/pull/210
- https://github.com/KazeKaze93/RuleDesk/pull/211
- https://github.com/KazeKaze93/RuleDesk/pull/212
- https://github.com/KazeKaze93/RuleDesk/pull/213
- https://github.com/KazeKaze93/RuleDesk/pull/214
- https://github.com/KazeKaze93/RuleDesk/pull/216
- https://github.com/KazeKaze93/RuleDesk/pull/217
