export const STORAGE_KEY = "ruledesk-web.storage";
export const STORAGE_BACKUP_KEY = "ruledesk-web.storage.backup";
export const FAVS_STORAGE_KEY = "ruledesk-web.favs";
export const DEBUG_KEY = "ruledesk-web.debug";
export const APPEARANCE_BACKGROUND_KEY = "ruledesk-web.appearance.background";

export const APPEARANCE_BACKGROUND_MAX_BYTES = 1_572_864;
export const APPEARANCE_BACKGROUND_TOO_LARGE =
  "Background image is too large (max 1.5 MB).";

export const TOKEN_STYLE_ID = "ruledesk-web-tokens";
export const SITE_SKIN_STYLE_ID = "ruledesk-web-site-skin";
export const RDW_SKIN_CLASS = "rdw-skin";
export const RDW_THEME_ATTR = "data-rdw-theme";

export const APPEARANCE_THEME_SITE = "site" as const;
export const APPEARANCE_THEME_SITE_DARK = "site-dark" as const;
export const APPEARANCE_THEME_LIGHT = "light" as const;
export const APPEARANCE_THEME_DARK = "dark" as const;
export const APPEARANCE_THEME_CUSTOM = "custom" as const;
export const DEFAULT_APPEARANCE_THEME = APPEARANCE_THEME_LIGHT;

export const SCHEMA_VERSION = 1 as const;
export const FAVS_SCHEMA_VERSION = 1 as const;

export const SITE_ORIGIN = "https://rule34.xxx";
export const SEARCH_PATH = "/index.php";
export const SEARCH_PAGE = "post";
export const SEARCH_SECTION = "list";
export const SEARCH_SECTION_VIEW = "view";
export const SEARCH_PARAM_PAGE = "page";
export const SEARCH_PARAM_SECTION = "s";
export const SEARCH_PARAM_TAGS = "tags";
export const SEARCH_PARAM_ID = "id";
export const SEARCH_PARAM_PID = "pid";

export const FAVORITES_PAGE = "favorites";
export const FAVORITES_SECTION_VIEW = "view";
export const FAVORITES_SECTION_DELETE = "delete";
export const FAVORITES_PARAM_RETURN_PID = "return_pid";
export const FAVORITES_RETURN_PID_DEFAULT = "0";

export const ADDFAV_PATH = "/public/addfav.php";
export const ADDFAV_PARAM_ID = "id";
export const VOTE_PATH = "/index.php";
export const VOTE_PARAM_PAGE = "page";
export const VOTE_PARAM_SECTION = "s";
export const VOTE_PARAM_ID = "id";
export const VOTE_PARAM_TYPE = "type";
export const VOTE_PAGE = "post";
export const VOTE_SECTION = "vote";
export const VOTE_TYPE_UP = "up";

export const ADDFAV_RESPONSE_ADDED = "3";
export const ADDFAV_RESPONSE_ALREADY = "1";
export const ADDFAV_RESPONSE_NOT_LOGGED_IN = "2";

export const FETCH_CREDENTIALS = "same-origin" as const;
export const FETCH_METHOD_GET = "GET" as const;

export const TAG_TYPE_INCLUDE = "include" as const;
export const TAG_TYPE_EXCLUDE = "exclude" as const;
export const EXCLUDE_PREFIX = "-";
export const TAG_SEPARATOR = " ";
export const URL_TAG_SEPARATOR = "+";

export const UPDATES_OR_OPEN = "(";
export const UPDATES_OR_CLOSE = ")";
export const UPDATES_OR_JOIN = "~";
export const UPDATES_ID_PREFIX = "id:>";

export const IMPORT_SCHEMA_ERROR_PREFIX =
  "File is not a RuleDesk Web export";

export const DEFAULT_GRID_FAV_BUTTONS = true;
export const DEFAULT_TWEAKS_ENABLED = true;
export const DEFAULT_UPDATES_GROUP_SIZE = 0;
/** Max artists in one OR-search; setting 0 means this value (site OR-alt limit ~639). */
export const MAX_UPDATES_GROUP_SIZE = 400;
export const DEFAULT_SEEN_POST_ID = 0;
export const DEFAULT_PLAYLIST_CHUNK_SIZE = 40;

export const COLLECTION_KIND_SEARCH = "search" as const;
export const COLLECTION_KIND_POSTS = "posts" as const;

export const PLAYLIST_ID_PREFIX = "id:";

export const DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
export const UPDATES_BAR_ID = "ruledesk-web-updates-bar";

export const SITE_THEME_COOKIE_NAME = "theme";
export const SITE_THEME_COOKIE_VALUE_DARK = "dark";
export const SITE_THEME_COOKIE_MAX_AGE_DAYS = 365;
export const SITE_THEME_COOKIE_PATH = "/";
export const SITE_BLACKLIST_COOKIE_NAME = "tag_blacklist";
export const SITE_BLACKLIST_COOKIE_PATH = "/";
export const SITE_BLACKLIST_COOKIE_MAX_AGE_YEARS = 5;
export const SITE_THEME_STYLESHEET_DIR = "/css/";
export const SITE_THEME_STYLESHEET_LIGHT = "desktop.css";
export const SITE_THEME_STYLESHEET_DARK = "desktop-dark.css";

/** Thumb grid gap on both axes for Default, Compact, and Large. */
export const IMAGE_LIST_GAP_PX = 4;

export const UI_TEXT = {
  toggleOpen: "Open RuleDesk",
  toggleClose: "Close RuleDesk",
  panelTitle: "RuleDesk",
  collectionsHeading: "Collections",
  emptyCollections: "No collections yet.",
  saveCurrent: "Save current search",
  nameLabel: "Name",
  save: "Save",
  cancel: "Cancel",
  rename: "Rename",
  delete: "Delete",
  confirmDelete: "Delete this collection?",
  confirm: "Confirm",
  openCollection: "Open collection",
  export: "Export",
  import: "Import",
  importErrorPrefix: "Import failed:",
  notOnSearchPage: "Open a post list search with tags to save it.",
  settingsHeading: "Settings",
  enablePageTweaksLabel: "Enable page tweaks",
  siteDarkThemeLabel: "Dark theme (site)",
  siteDarkThemeHint: "Uses the site's own dark stylesheet",
  gridFavButtonsLabel: "Show favorite buttons in grid",
  cardFavAddLabel: "Add post to favorites",
  cardFavRemoveLabel: "Remove post from favorites",
  cardFavGlyph: "★",
  cardFavErrorNotLoggedIn: "Log in to use favorites",
  cardFavErrorRequest: "Favorite request failed",
  artistsHeading: "Artists",
  artistsEmpty: "No artists followed yet.",
  artistTagLabel: "Artist tag",
  artistAdd: "Add",
  artistRemove: "Unfollow",
  artistFollow: "Follow",
  artistFollowing: "Following",
  artistUnfollow: "Unfollow",
  artistOpenSearch: "Search artist",
  artistInvalid: "Invalid artist tag.",
  artistDuplicate: "Already following this artist.",
  openUpdates: "Open updates",
  openUpdatesGroup: "Updates",
  updatesGroupSizeLabel: "Artists per search (0 = 400)",
  playlistChunkSizeLabel: "Collection part size",
  seenUpTo: "Seen up to post #",
  seenNothing: "Nothing marked as seen yet.",
  markAllSeen: "Mark all seen",
  markedSeenConfirm: "Marked as seen up to post #",
  alreadyMarkedSeenPrefix: "Everything here is already marked as seen (up to #",
  alreadyMarkedSeenSuffix: ")",
  reloadUpdates: "Reload updates",
  goToPageOneToMark: "Go to page 1 to mark everything as seen",
  noNewPosts: "No new posts",
  noNewPostsSince: "No new posts since #",
  showAllFollowedPosts: "Show all posts from followed artists",
  updatesPartialHint:
    "This search covers only part of your artists. Marking as seen works when all artists are in one search (set “Artists per search” to 0).",
  updatesBarMissingHost:
    "updates empty host not found; updates bar not mounted",
} as const;

export const CSS_CLASS = {
  host: "rdw-host",
  toggle: "rdw-toggle",
  panel: "rdw-panel",
  panelOpen: "rdw-panel--open",
  header: "rdw-header",
  title: "rdw-title",
  close: "rdw-close",
  body: "rdw-body",
  section: "rdw-section",
  sectionTitle: "rdw-section-title",
  list: "rdw-list",
  listItem: "rdw-list-item",
  itemName: "rdw-item-name",
  itemActions: "rdw-item-actions",
  iconButton: "rdw-icon-button",
  primaryButton: "rdw-primary-button",
  secondaryButton: "rdw-secondary-button",
  dangerButton: "rdw-danger-button",
  form: "rdw-form",
  field: "rdw-field",
  label: "rdw-label",
  input: "rdw-input",
  checkboxRow: "rdw-checkbox-row",
  checkbox: "rdw-checkbox",
  formActions: "rdw-form-actions",
  toolbar: "rdw-toolbar",
  hint: "rdw-hint",
  error: "rdw-error",
  confirmRow: "rdw-confirm-row",
  hidden: "rdw-hidden",
  thumb: "rdw-thumb",
  cardFav: "rdw-card-fav",
  cardFavMarked: "rdw-card-fav--marked",
  cardFavError: "rdw-card-fav--error",
  cardFavPending: "rdw-card-fav--pending",
  gridFavsHidden: "rdw-grid-favs-hidden",
  artistFollow: "rdw-artist-follow",
  artistFollowMarked: "rdw-artist-follow--marked",
  updatesBar: "rdw-updates-bar",
  updatesBarActions: "rdw-updates-bar-actions",
} as const;

/** The site's own switch for AI posts: `1` leaves them out of every list the server gives. */
export const SITE_AI_FILTER_COOKIE_NAME = "filter_ai";
export const SITE_AI_FILTER_COOKIE_HIDE = "1";
export const SITE_AI_FILTER_COOKIE_SHOW = "0";
export const SITE_AI_FILTER_COOKIE_PATH = "/";
export const SITE_AI_FILTER_COOKIE_MAX_AGE_DAYS = 365;
