import { blacklistHideFeature } from "./blacklist-hide";
import { cdnFallbackFeature } from "./cdn-fallback";
import { downloadsFeature } from "./downloads/panel";
import { favoritesBulkFeature } from "./favorites-bulk";
import { feedFeature } from "./feed";
import { gridDensityFeature } from "./grid-density";
import { seenDimFeature } from "./grid-marks";
import { infiniteScrollFeature } from "./infinite-scroll";
import { menuCleanupFeature } from "./menu-cleanup";
import { playlistBarFeature } from "./playlist-bar";
import { playlistMenuFeature } from "./playlist-menu";
import { postActionsFeature } from "./post-actions";
import { searchToolsFeature } from "./search-tools";
import { tagGroupsFeature } from "./tag-groups";
import { thumbTooltipFeature } from "./thumb-tooltip";
import type { Feature } from "./types";
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
];
