/** Hash routes and DOM ids for RuleDesk own pages (replaces floating panel). */

export const RDW_HASH_PREFIX = "#rdw/" as const;

export const RDW_ROUTE_COLLECTIONS = "collections" as const;
export const RDW_ROUTE_FOLLOWING = "following" as const;
export const RDW_ROUTE_SETTINGS = "settings" as const;

export const RDW_ROUTES = [
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
] as const;

export type RdwRoute = (typeof RDW_ROUTES)[number];

/** Custom-collection detail under `#rdw/collections/<id>`. */
export const RDW_COLLECTION_DETAIL_KIND = "collection" as const;

export type RdwCollectionDetailPage = {
  readonly kind: typeof RDW_COLLECTION_DETAIL_KIND;
  readonly collectionId: string;
};

/** Static script page, or one custom collection. */
export type RdwPage = RdwRoute | RdwCollectionDetailPage;

/**
 * Post-queue hash on site post URLs (`/index.php?...#rdw-c=<collectionId>`).
 * Not a script page — must not match `#rdw/`.
 */
export const RDW_COLLECTION_QUEUE_HASH_MARK = "#rdw-c" as const;
export const RDW_COLLECTION_QUEUE_HASH_PREFIX = "#rdw-c=" as const;

export const RDW_HASH_COLLECTIONS = `${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}`;
export const RDW_HASH_FOLLOWING = `${RDW_HASH_PREFIX}${RDW_ROUTE_FOLLOWING}`;
export const RDW_HASH_SETTINGS = `${RDW_HASH_PREFIX}${RDW_ROUTE_SETTINGS}`;

export const RDW_OWN_PAGE_CLASS = "rdw-own-page";
export const RDW_PAGE_ROOT_ID = "rdw-page-root";
export const RDW_OWN_PAGE_STYLE_ID = "rdw-own-page-style";

export const HEADER_SELECTOR = "div#header";
export const NAVBAR_SELECTOR = "div#header ul#navbar";
export const CURRENT_PAGE_CLASS = "current-page";

export const MENU_ITEM_ID = {
  collections: "rdw-nav-collections",
  following: "rdw-nav-following",
  favorites: "rdw-nav-favorites",
  settings: "rdw-nav-settings",
} as const;

export const MENU_LABEL = {
  collections: "Collections",
  following: "Following",
  favorites: "Favorites",
  settings: "RuleDesk",
} as const;

/** Site native favorites entry (submenu); hidden when our Favorites item is shown. */
export const MY_FAVORITES_CONTAINER_ID = "my-favorites-container";
export const MY_FAVORITES_LINK_SELECTOR =
  'li#my-favorites-container a[href*="page=favorites"]';

export const POSTS_LINK_TEXT = "Posts";
export const FEED_MENU_ITEM_ID = "rdw-feed-menu";

export const PAGE_CONTENT_MAX_WIDTH_PX = 960;

/** Shared class names for own-page section layouts (relocated from ui/panel). */
export const PANEL_UI_CLASS = {
  artistMeta: "rdw-artist-meta",
  artistFilter: "rdw-artist-filter",
  artistList: "rdw-artist-list",
  artistRow: "rdw-artist-row",
  artistLink: "rdw-artist-link",
  artistUndo: "rdw-artist-undo",
  scrollRegion: "rdw-scroll-region",
  settingsGroup: "rdw-settings-group",
  settingsRow: "rdw-settings-row",
  settingsCaption: "rdw-settings-caption",
  pageCard: "rdw-page-card",
} as const;

export const ARTISTS_FILTER_THRESHOLD = 12;
export const UNFOLLOW_UNDO_MS = 5000;
export const ARTISTS_EMPTY_TITLE = "No followed artists yet";
export const ARTISTS_EMPTY_HINT =
  "Follow artists with the Follow button next to their name in the tag list.";
export const ARTIST_FILTER_LABEL = "Filter artists";
export const UNFOLLOW_UNDO_LABEL = "Undo";
export const UNFOLLOWED_PREFIX = "Unfollowed ";

export const FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
export const FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
export const UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
export const PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
export const ARTIST_FILTER_ID = "rdw-artist-filter";
export const GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
export const TWEAKS_SWITCH_ID = "rdw-tweaks-enabled";

export const TAG_GROUPS_FEATURE_ID = "tag-groups";
export const TAG_GROUPS_PANEL_LABEL = "Collapse tags";

export function featurePanelLabel(featureId: string, fallback: string): string {
  if (featureId === TAG_GROUPS_FEATURE_ID) {
    return TAG_GROUPS_PANEL_LABEL;
  }
  return fallback;
}

const HASH_SUFFIX_SPLIT = /[?#]/;
const COLLECTION_DETAIL_SEGMENT_INDEX = 1;

export function isRdwRoute(value: string): value is RdwRoute {
  return RDW_ROUTES.some((route) => route === value);
}

export function isCollectionDetailPage(
  page: RdwPage,
): page is RdwCollectionDetailPage {
  return typeof page !== "string";
}

/** Navbar item for a script page. Collection detail stays under Collections. */
export function menuRouteForPage(page: RdwPage): RdwRoute {
  if (isCollectionDetailPage(page)) {
    return RDW_ROUTE_COLLECTIONS;
  }
  return page;
}

export function collectionDetailHash(collectionId: string): string {
  return `${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}/${encodeURIComponent(collectionId)}`;
}

export function collectionQueueHash(collectionId: string): string {
  return `${RDW_COLLECTION_QUEUE_HASH_PREFIX}${encodeURIComponent(collectionId)}`;
}

export function rdwPageHash(page: RdwPage): string {
  if (isCollectionDetailPage(page)) {
    return collectionDetailHash(page.collectionId);
  }
  return `${RDW_HASH_PREFIX}${page}`;
}

function hashSegment(raw: string): string {
  return raw.split(HASH_SUFFIX_SPLIT)[0] ?? "";
}

function decodeCollectionId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Parse location.hash → script page, or null when the hash is not ours.
 * `#rdw-c=…` is the post-page queue and is never a script page.
 * `#rdw/collections/<id>` is that custom collection; a bare
 * `#rdw/collections` stays the list.
 */
export function parseRdwHash(hash: string): RdwPage | null {
  const trimmed = hash.trim();
  if (
    trimmed.startsWith(RDW_COLLECTION_QUEUE_HASH_MARK) ||
    !trimmed.startsWith(RDW_HASH_PREFIX)
  ) {
    return null;
  }
  const rest = trimmed.slice(RDW_HASH_PREFIX.length);
  const segments = rest.split("/");
  const head = hashSegment(segments[0] ?? "");
  if (!isRdwRoute(head)) {
    return null;
  }
  if (head !== RDW_ROUTE_COLLECTIONS || segments.length <= COLLECTION_DETAIL_SEGMENT_INDEX) {
    return head;
  }
  const collectionId = decodeCollectionId(
    hashSegment(segments[COLLECTION_DETAIL_SEGMENT_INDEX] ?? ""),
  );
  if (collectionId.length === 0) {
    return RDW_ROUTE_COLLECTIONS;
  }
  return {
    kind: RDW_COLLECTION_DETAIL_KIND,
    collectionId,
  };
}

/** CSS: hide site siblings after header while own page is open. */
export function buildOwnPageCss(): string {
  return `
html.${RDW_OWN_PAGE_CLASS} ${HEADER_SELECTOR} ~ *:not(#${RDW_PAGE_ROOT_ID}) {
  display: none !important;
}
#${RDW_PAGE_ROOT_ID} {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
`;
}
