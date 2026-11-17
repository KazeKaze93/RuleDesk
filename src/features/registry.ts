import { blacklistHideFeature } from "./blacklist-hide";
import { cdnFallbackFeature } from "./cdn-fallback";
import { downloadsFeature } from "./downloads/panel";
import { favoritesBulkFeature } from "./favorites-bulk";
import { feedFeature } from "./feed";
import { feedCounterFeature } from "./feed-counter";
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
  sidebarRightFeature,
  motionFeature,
  feedCounterFeature,
  tagWikiFeature,
  videoMarkFeature,
];
