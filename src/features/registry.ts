import { blacklistHideFeature } from "./blacklist-hide";
import { cdnFallbackFeature } from "./cdn-fallback";
import { downloadsFeature } from "./downloads/panel";
import { favoritesBulkFeature } from "./favorites-bulk";
import { feedFeature } from "./feed";
import { feedCounterFeature } from "./feed-counter";
import { fullImageFeature } from "./full-image";
import { gifPostFeature } from "./gif-post";
import { gridDensityFeature } from "./grid-density";
import { seenDimFeature } from "./grid-marks";
import { imageZoomFeature } from "./image-zoom";
import { infiniteScrollFeature } from "./infinite-scroll";
import { motionFeature, sidebarRightFeature } from "./layout-options";
import { menuCleanupFeature } from "./menu-cleanup";
import { playlistBarFeature } from "./playlist-bar";
import { playlistMenuFeature } from "./playlist-menu";
import { postActionsFeature } from "./post-actions";
import { searchToolsFeature } from "./search-tools";
import { tagGroupsFeature } from "./tag-groups";
import { tagWikiFeature } from "./tag-wiki";
import { thumbTooltipFeature } from "./thumb-tooltip";
import type { Feature } from "./types";
import { videoMarkFeature } from "./video-mark";
import { videoPlayerFeature } from "./video-player";
import { videoPreviewFeature } from "./video-preview";

export const FEATURES: Feature[] = [
  feedFeature,
  menuCleanupFeature,
  tagGroupsFeature,
  searchToolsFeature,
  seenDimFeature,
  playlistMenuFeature,
  playlistBarFeature,
  blacklistHideFeature,
  infiniteScrollFeature,
  postActionsFeature,
  gridDensityFeature,
  thumbTooltipFeature,
  favoritesBulkFeature,
  videoPlayerFeature,
  videoPreviewFeature,
  cdnFallbackFeature,
  downloadsFeature,
  imageZoomFeature,
  gifPostFeature,
  fullImageFeature,
  sidebarRightFeature,
  motionFeature,
  feedCounterFeature,
  tagWikiFeature,
  videoMarkFeature,
];

/**
 * The groups the settings page shows the page tweaks in, by the part of the
 * site a tweak changes. Kept here, beside the list of the features, so that a
 * new feature is given its group where it is added to the list.
 */
export const SETTINGS_GROUP = {
  header: "header",
  grid: "grid",
  post: "post",
  video: "video",
  feed: "feed",
  ai: "ai",
  search: "search",
  collections: "collections",
  // Shown in other blocks of the settings, not in Page (the designer,
  // 19.11.2026): Favorites, Downloads and Appearance have blocks of their own.
  favorites: "favorites",
  downloads: "downloads",
  appearance: "appearance",
  other: "other",
} as const;

export type SettingsGroupId = (typeof SETTINGS_GROUP)[keyof typeof SETTINGS_GROUP];

/** The groups in the order they are shown; "Other" is last. */
export const SETTINGS_GROUPS: readonly {
  readonly id: SettingsGroupId;
  readonly title: string;
}[] = [
  { id: SETTINGS_GROUP.header, title: "Header" },
  { id: SETTINGS_GROUP.grid, title: "Grid and thumbnails" },
  { id: SETTINGS_GROUP.post, title: "Post page" },
  { id: SETTINGS_GROUP.video, title: "Video" },
  { id: SETTINGS_GROUP.feed, title: "Feed" },
  { id: SETTINGS_GROUP.ai, title: "AI posts" },
  { id: SETTINGS_GROUP.search, title: "Search and sidebar" },
  { id: SETTINGS_GROUP.collections, title: "Collections" },
  // Only for a feature that was given no group: none is left there now.
  { id: SETTINGS_GROUP.other, title: "Other" },
];

/**
 * Made when first asked for, not when this module is loaded: some features
 * import the runtime, which imports this list, so at load time a feature
 * named here may not be there yet.
 */
function buildFeatureSettingsGroups(): ReadonlyMap<string, SettingsGroupId> {
  return new Map<string, SettingsGroupId>([
    [menuCleanupFeature.id, SETTINGS_GROUP.header],
    [seenDimFeature.id, SETTINGS_GROUP.grid],
    [blacklistHideFeature.id, SETTINGS_GROUP.grid],
    [infiniteScrollFeature.id, SETTINGS_GROUP.grid],
    [thumbTooltipFeature.id, SETTINGS_GROUP.grid],
    // Set in the Appearance block; named here so that it is not counted as "Other".
    [gridDensityFeature.id, SETTINGS_GROUP.grid],
    [postActionsFeature.id, SETTINGS_GROUP.post],
    [imageZoomFeature.id, SETTINGS_GROUP.post],
    [fullImageFeature.id, SETTINGS_GROUP.post],
    [gifPostFeature.id, SETTINGS_GROUP.post],
    [cdnFallbackFeature.id, SETTINGS_GROUP.post],
    [videoPlayerFeature.id, SETTINGS_GROUP.video],
    [videoPreviewFeature.id, SETTINGS_GROUP.video],
    [videoMarkFeature.id, SETTINGS_GROUP.video],
    [feedFeature.id, SETTINGS_GROUP.feed],
    [feedCounterFeature.id, SETTINGS_GROUP.feed],
    [searchToolsFeature.id, SETTINGS_GROUP.search],
    [tagGroupsFeature.id, SETTINGS_GROUP.search],
    [tagWikiFeature.id, SETTINGS_GROUP.search],
    [sidebarRightFeature.id, SETTINGS_GROUP.search],
    [playlistMenuFeature.id, SETTINGS_GROUP.collections],
    [playlistBarFeature.id, SETTINGS_GROUP.collections],
    [favoritesBulkFeature.id, SETTINGS_GROUP.favorites],
    [downloadsFeature.id, SETTINGS_GROUP.downloads],
    [motionFeature.id, SETTINGS_GROUP.appearance],
  ]);
}

let featureSettingsGroups: ReadonlyMap<string, SettingsGroupId> | null = null;

/** The group of a feature; one that was given none is shown under "Other". */
export function featureSettingsGroup(featureId: string): SettingsGroupId {
  featureSettingsGroups ??= buildFeatureSettingsGroups();
  return featureSettingsGroups.get(featureId) ?? SETTINGS_GROUP.other;
}
