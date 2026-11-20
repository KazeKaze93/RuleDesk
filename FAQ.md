# RuleDesk FAQ

Short answers to what comes up most often. What the script does is in the [README](README.md); what changed in each version is in the [changelog](CHANGELOG.md).

## Installing and updating

**Does it work in my browser, or with my script manager?**
It is made and checked on one setup: desktop Chrome with Tampermonkey. Violentmonkey and other managers, Firefox and other browsers, phones and tablets were not tried. It may work; nobody has looked.

**The site's old look flashes before the script's on every page.**
In Tampermonkey open Dashboard → Settings → Security → Content Script API and choose **UserScripts API Dynamic**. With the plain "UserScripts API" the flash was there on every load, and pages opened slower.

**How do I get a new version?**
Tampermonkey checks for updates on its own schedule, once a day by default. To check now: Tampermonkey icon → Utilities → "Check for userscript updates". The interval is in Tampermonkey's settings, under "Userscript Update".

**I updated, but nothing changed.**
Reload the site's page: an open page keeps running the old version. Right after a release GitHub may serve the previous file for a few minutes; check again a little later.

**Which version do I have?**
RuleDesk (the gear in the header): the line under the name at the top left reads "Settings · " and the version. The Tampermonkey dashboard shows it too, next to the script name.

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
"Video preview on hover" is off by default: switch it on in RuleDesk → Video. A preview loads the video file itself.

**It plays on most posts but not on one.**
If a preview fails to load, the script tries that post again half a minute later, when you point at it again.

**On Favorites and Comments some videos have no play sign.**
On those pages the site does not mark videos, so the script goes by the `video` tag of the post. A video without that tag gets no play sign (or frame, when the play sign is switched off) and no preview there.

## Favorites

**I type a word in the favorites search and the page does not change.**
While the list of suggestions is open, the page keeps the last result: the word is not finished yet. Pick a suggestion, press Enter or a space, or click elsewhere, and the search is applied.

**The suggestions do not show a tag I know my favorite has.**
The list is built from the local index. A favorite added on another device is in it after "Sync favorites"; a tag changed on the site after "Full resync".

**There is no search on my Favorites page.**
The search needs a local list of your favorites with their tags. RuleDesk → Favorites → "Full resync" builds it: it walks your favorites pages once, 1.5 seconds per page.

**`rating:safe` does nothing in the favorites search.**
The local list holds tags and post ids only: the favorites page of the site gives nothing else, and the site API hands out a post's rating only one post a request. Other metatags work in the search on Posts; the "?" in the field lists what works here.

**A favorite I added on another device is missing.**
The local list changes when you add or remove a favorite in this browser, or when you run "Sync favorites".

## Post page

**A GIF does not move.**
"Play GIFs on the post page" in RuleDesk → Post page puts the moving file in place of the still picture the site shows. A large GIF takes a while to load.

"Load full-size image" in the same place does it for a still picture: the site shows a scaled-down copy, and with this on the original is loaded in its place. It is off by default, because an original is often several megabytes.

**A click on the picture opens a viewer and I do not want it.**
Switch off "Zoom the picture on click" in RuleDesk → Post page.

## Downloads

**There are no download buttons.**
The download manager works only with your own API key. Generate it on the site's account options page and paste the whole line it shows into RuleDesk → Downloads.

**Can the site or its ads read my API key?**

Not since 0.73.0. The requests that carry the key are made by the script manager, outside the page, and only to `api.rule34.xxx`. Before 0.73.0 they were made by the page, and a script of the page could read the key from the address of the request while a download was running. If you downloaded with an earlier version and want to be sure, make a new key on the site's account options page and paste it into RuleDesk → Downloads.

**The browser asked for a permission when I started a download.**
Tampermonkey asks once for access to browser downloads. Without it files cannot be saved.

**Where do the files go, and can I choose another place?**
Into your browser's download folder, each job into a folder named after the collection or the search. A userscript cannot save anywhere else; to change the place, change the download folder in the browser's settings.

**How do I change the names of the files?**
RuleDesk → Downloads → File name. Pick one of the ready names, or "Custom…" and switch the parts on and off: id, md5, rating, score, width, height, owner, date.

**The browser's download icon blinks for every file.**
That is the browser reporting each saved file. The script cannot switch it off.

## Statistics

**Where do the numbers come from?**
From the script's own data in this browser. The exception is the "Site profile" block, which is read from your profile page on the site when Statistics is opened, at most once in 15 minutes.

**What does "Refresh profile" do?**
It reads your profile page on the site, two requests per press, and stores the numbers of its table. Your user id is not stored. You have to be logged in.

## Settings and data

**My blacklist changed back.**
The script keeps the blacklist in the site's cookie in this browser. The list in your account settings on the site is separate and may replace it after you log in again.

**How do I move everything to another browser?**
RuleDesk → Data → Export saves one file with collections, followed artists, marks and settings, and the local list of favorites too when "Include favorites" is on (favorites are normally brought back with Sync favorites); Import reads it on the other side. The file does not hold your account id. The API key is not in the file and has to be pasted again.

**The page looks like the plain site.**
With Site default or Site dark the script does not restyle the site's own pages. Pick Light, Dark or Custom in RuleDesk → Appearance.

**In Site default or Site dark some things look out of place.**
Those two themes keep the site's own look: its white fields, plain buttons and tables stay as the site draws them, and the script's additions stand beside them. That is by design. The script's own themes are Light, Dark and Custom.

**I switched a feature and the page reloaded.**
A feature that only changes styles applies at once; one that adds controls needs the page loaded again.

**Does the script send my data anywhere?**
No. Everything is kept in the script manager's storage on your computer. Requests go only to the site and its API address, and only when you do something that needs one. Two exceptions have a switch each in the settings: the counter beside Feed, and the kind of a tag the script has not met yet.

## Bugs

**Where do I report a bug?**
In [Issues on GitHub](https://github.com/KazeKaze93/RuleDesk/issues/new/choose), and only there: a report left in a chat or on a forum gets lost. The form asks for the version of the script, the browser, the script manager, the theme, the page and what you did.

**What should I check first?**
Turn off "Enable page tweaks" at the top of the RuleDesk settings and look again. If the trouble is still there, it comes from the site or from another script or extension, not from RuleDesk. "What the script does not do" in the README lists what the site itself does.

**What must not go into a report?**
Your API key and your account id. Issues are public, and the site is for adults: crop a screenshot to the part of the page that is wrong.
