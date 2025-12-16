export const IPC_CHANNELS = {
  APP: {
    GET_VERSION: "app:get-version",
    OPEN_EXTERNAL: "app:open-external",
    DOWNLOAD_FILE: "app:download-file",
    WRITE_CLIPBOARD: "app:write-to-clipboard",
    LOGOUT: "app:logout",
    VERIFY_CREDS: "app:verify-creds",
  },
  SETTINGS: {
    GET: "app:get-settings-status",
    SAVE: "app:save-settings",
  },
  DB: {
    GET_ARTISTS: "db:get-artists",
    ADD_ARTIST: "db:add-artist",
    DELETE_ARTIST: "db:delete-artist",
    SEARCH_TAGS: "db:search-tags",
    GET_POSTS: "db:get-posts",
    GET_POSTS_COUNT: "db:get-posts-count",
    MARK_VIEWED: "db:mark-post-viewed",
    TOGGLE_FAVORITE: "db:toggle-post-favorite",
    SYNC_ALL: "db:sync-all",
    TOGGLE_POST_VIEWED: "db:toggle-post-viewed" as const,
    RESET_POST_CACHE: "db:reset-post-cache" as const,
    GET_API_KEY_ENCRYPTED: "db:get-api-key-encrypted",
  },
  API: {
    SEARCH_REMOTE: "api:search-remote-tags",
  },
  BACKUP: {
    CREATE: "db:create-backup",
    RESTORE: "db:restore-backup",
  },
  SYNC: {
    REPAIR: "sync:repair-artist",
  },

  FILES: {
    DOWNLOAD: "files:download",
    OPEN_FOLDER: "files:open-folder",
    DOWNLOAD_PROGRESS: "files:download-progress",
  },
} as const;
