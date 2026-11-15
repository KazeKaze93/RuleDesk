# RuleDesk FAQ

Short answers to what comes up most often. What the script does is in the [README](README.md); what changed in each version is in the [changelog](CHANGELOG.md).

## Installing and updating

**How do I get a new version?**
Tampermonkey checks for updates on its own schedule, once a day by default. To check now: Tampermonkey icon → Utilities → "Check for userscript updates". The interval is in Tampermonkey's settings, under "Userscript Update".

**I updated, but nothing changed.**
Reload the site's page: an open page keeps running the old version. Right after a release GitHub may serve the previous file for a few minutes; check again a little later.

**Which version do I have?**
The Tampermonkey dashboard shows it next to the script name.

## Feed and Following

**An artist's card is empty and says "not opened yet".**
The script fills a card from pages you open yourself. Open the artist's page once, or press Refresh on Following: it reads the first page of every artist, one request every 1.5 seconds.

**Refresh stopped with an error.**
The site limits how often it can be asked and answers with an error when that is exceeded. Refresh stops at the first error; wait a minute and press it again.

**How do I filter by several artists?**
Type several names into the filter, separated by spaces or commas. A card is shown when any of them matches. A name with a space in it is typed with an underscore: `nyx_x`.

**What does "Seen up to post #…" mean?**
The newest post that was in your feed when you last pressed "Mark all seen". Posts above it carry the NEW mark.

## Collections

**The bar with Shuffle and Edit query is missing above my saved search.**
It shows only when a dynamic collection is opened from the Collections page. The same search typed by hand is an ordinary search.

**How do I filter by several collections?**
Separate the names with commas. A space is part of a name here.

## Video

**The preview does not play when I point at a video.**
"Video preview on hover" is off by default: switch it on in RuleDesk → Page. A preview loads the video file itself.

**It plays on most posts but not on one.**
If a preview fails to load, the script tries that post again half a minute later, when you point at it again.

**On Favorites and Comments some videos have no outline.**
On those pages the site does not mark videos, so the script goes by the `video` tag of the post. A video without that tag gets no outline and no preview there.

## Downloads

**There are no download buttons.**
The download manager works only with your own API key. Generate it on the site's account options page and paste the whole line it shows into RuleDesk → Downloads.

**The browser asked for a permission when I started a download.**
Tampermonkey asks once for access to browser downloads. Without it files cannot be saved.

**Where do the files go, and can I choose another place?**
Into your browser's download folder, each job into a folder named after the collection or the search. A userscript cannot save anywhere else; to change the place, change the download folder in the browser's settings.

**The browser's download icon blinks for every file.**
That is the browser reporting each saved file. The script cannot switch it off.

## Statistics

**Where do the numbers come from?**
From the script's own data in this browser: nothing is asked from the site. The exception is the "Site profile" block.

**What does "Refresh profile" do?**
It reads your profile page on the site, two requests per press, and stores the numbers of its table. Your user id is not stored. You have to be logged in.

## Settings and data

**My blacklist changed back.**
The script keeps the blacklist in the site's cookie in this browser. The list in your account settings on the site is separate and may replace it after you log in again.

**How do I move everything to another browser?**
RuleDesk → Data → Export saves one file with collections, followed artists, favorites, marks and settings; Import reads it on the other side. The API key is not in the file and has to be pasted again.

**The page looks like the plain site.**
With the "Site" theme the script does not restyle the site's own pages. Pick another theme in RuleDesk → Appearance.

**Does the script send my data anywhere?**
No. Everything is kept in the script manager's storage on your computer. Requests go only to the site itself, and only when you do something that needs one.
