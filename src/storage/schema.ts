import * as z from "zod/mini";

import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  COLLECTION_KIND_POSTS,
  COLLECTION_KIND_SEARCH,
  DEFAULT_APPEARANCE_THEME,
  DEFAULT_GRID_FAV_BUTTONS,
  DEFAULT_PLAYLIST_CHUNK_SIZE,
  DEFAULT_SEEN_POST_ID,
  DEFAULT_TWEAKS_ENABLED,
  DEFAULT_UPDATES_GROUP_SIZE,
  FAVS_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TAG_TYPE_EXCLUDE,
  TAG_TYPE_INCLUDE,
} from "../config/constants";
import { customBaseFromLegacyBg } from "../ui/tokens";
export const TagTypeSchema = z.enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);

export const CollectionKindSchema = z.enum([
  COLLECTION_KIND_SEARCH,
  COLLECTION_KIND_POSTS,
]);

export const TagEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
  type: TagTypeSchema,
});

/**
 * Optional `kind` / `postIds`: missing `kind` means a saved search.
 * Custom (`posts`) rows may also carry `thumbs` and `shuffledOrder`.
 * Dynamic searches may carry `query` (raw tag string). All three are optional
 * so 0.15 blobs still parse; {@link migrateCollectionMediaFields} fills the
 * custom-collection defaults without dropping `postIds` or search tags.
 * `shuffledOrder: null` means insertion order (`postIds`).
 * Dynamic searches may also carry `cover`: thumb URLs seen on the first
 * page of their results, newest visit wins. `postCount` comes from the same page.
 */
/**
 * Size of a saved search as read from its results page.
 * `exact: false` means "at least `value`" (taken from the last-page link).
 */
export const PostCountSchema = z.object({
  value: z.int(),
  exact: z.boolean(),
});

export type PostCount = z.infer<typeof PostCountSchema>;

export const CollectionSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  tags: z.array(TagEntrySchema),
  kind: z.optional(CollectionKindSchema),
  postIds: z.optional(z.array(z.int())),
  thumbs: z.optional(z.record(z.string(), z.string())),
  shuffledOrder: z.optional(z.nullable(z.array(z.int()))),
  query: z.optional(z.string()),
  cover: z.optional(z.array(z.string())),
  postCount: z.optional(PostCountSchema),
});

export const ArtistEntrySchema = z.object({
  tag: z.string().check(z.minLength(1)),
});

/** Legacy `fav` remains optional so old storage/export blobs still parse. */
export const MarkFlagsSchema = z.object({
  fav: z.optional(z.boolean()),
  seen: z.optional(z.boolean()),
});

export const AppearanceThemeSchema = z.enum([
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_CUSTOM,
]);

export const APPEARANCE_CUSTOM_BASE_LIGHT = "light" as const;
export const APPEARANCE_CUSTOM_BASE_DARK = "dark" as const;

export const AppearanceCustomBaseSchema = z.enum([
  APPEARANCE_CUSTOM_BASE_LIGHT,
  APPEARANCE_CUSTOM_BASE_DARK,
]);

/** Canonical custom theme: Light/Dark base + optional background image/dim. */
export const AppearanceCustomSchema = z.object({
  base: AppearanceCustomBaseSchema,
  backgroundImage: z.optional(z.string()),
  backgroundDim: z.optional(z.number()),
});

/**
 * Storage/export parse shape: accepts legacy accent/bg/surface/text so 0.10
 * blobs still load; normalize via {@link normalizeAppearanceCustom}.
 */
export const AppearanceCustomStoredSchema = z.object({
  base: z.optional(AppearanceCustomBaseSchema),
  accent: z.optional(z.string()),
  bg: z.optional(z.string()),
  surface: z.optional(z.string()),
  text: z.optional(z.string()),
  backgroundImage: z.optional(z.string()),
  backgroundDim: z.optional(z.number()),
});

export const AppearanceSchema = z.object({
  theme: AppearanceThemeSchema,
  custom: z.optional(AppearanceCustomSchema),
});

export const AppearanceStoredSchema = z.object({
  theme: AppearanceThemeSchema,
  custom: z.optional(AppearanceCustomStoredSchema),
});

/**
 * Package B: module toggle id for «Video player tweaks»
 * (`settings.features[VIDEO_PLAYER_FEATURE_ID]`).
 */
export const VIDEO_PLAYER_FEATURE_ID = "video-player";
export const DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED = true;

/**
 * Package C HANDOFF: «Video preview on hover» lives only in the features map
 * (`settings.features[VIDEO_PREVIEW_FEATURE_ID]`), default OFF — no dedicated
 * SettingsSchema boolean. UI caption: VIDEO_PREVIEW_SETTING_CAPTION in
 * video-preview.ts.
 */
export const VIDEO_PREVIEW_FEATURE_ID = "video-preview";
export const DEFAULT_VIDEO_PREVIEW_ON_HOVER = false;

/** Package B: `settings.featureChoice[VIDEO_PLAYER_FEATURE_ID]` values. */
export const VIDEO_SIZE_FIT_HEIGHT = "fit-height" as const;
export const VIDEO_SIZE_FIT_WIDTH = "fit-width" as const;
export const VIDEO_SIZE_ORIGINAL = "original" as const;
export const DEFAULT_VIDEO_SIZE = VIDEO_SIZE_FIT_HEIGHT;

export const VideoSizeSchema = z.enum([
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
]);

export const DEFAULT_VIDEO_VOLUME = 1;
export const DEFAULT_VIDEO_MUTED = false;
export const DEFAULT_VIDEO_PLAYBACK_RATE = 1;

/**
 * Package B: persisted player prefs under
 * `settings.featureState[VIDEO_PLAYER_FEATURE_ID]`.
 */
export const VideoPlayerStateSchema = z.object({
  volume: z.optional(z.number()),
  muted: z.optional(z.boolean()),
  playbackRate: z.optional(z.number()),
});

export const SettingsSchema = z.object({
  gridFavButtons: z.boolean(),
  updatesGroupSize: z.optional(z.int().check(z.nonnegative())),
  playlistChunkSize: z.optional(z.int().check(z.positive())),
  tweaksEnabled: z.optional(z.boolean()),
  features: z.optional(z.record(z.string(), z.boolean())),
  featureChoice: z.optional(z.record(z.string(), z.string())),
  featureState: z.optional(z.record(z.string(), z.unknown())),
  appearance: z.optional(AppearanceStoredSchema),
});
export const UpdatesSchema = z.object({
  seenPostId: z.int().check(z.nonnegative()),
});

export const StorageSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: z.record(z.string(), MarkFlagsSchema),
  settings: z.optional(SettingsSchema),
  updates: z.optional(UpdatesSchema),
});

/** Legacy floating-panel size keys under settings.featureState.panel. */
export const LEGACY_PANEL_FEATURE_STATE_ID = "panel";
export const LEGACY_PANEL_WIDTH_KEY = "width";
export const LEGACY_PANEL_HEIGHT_KEY = "height";

const GRID_DENSITY_CHOICE_ID = "grid-density";
const GRID_DENSITY_DEFAULT_VALUE = "default";
const LEGACY_MASONRY_CHOICE_VALUE = "masonry";
/** Post panel Info/Comments tab used to live here. Always Info as of 0.15.1. */
const POST_PANEL_TAB_CHOICE_ID = "post-actions";

export const FavsSyncLockSchema = z.object({
  tabId: z.string().check(z.minLength(1)),
  beatAt: z.number(),
});

/** Package F HANDOFF: incremental stops early; full walks every page. */
export const FAVS_SYNC_MODE_INCREMENTAL = "incremental" as const;
export const FAVS_SYNC_MODE_FULL = "full" as const;

export const FavsSyncModeSchema = z.enum([
  FAVS_SYNC_MODE_INCREMENTAL,
  FAVS_SYNC_MODE_FULL,
]);

export const FavsSyncSchema = z.object({
  nextPid: z.int(),
  lastPid: z.int(),
  startedAt: z.string(),
  finishedAt: z.optional(z.string()),
  running: z.optional(z.boolean()),
  userId: z.optional(z.int()),
  lock: z.optional(FavsSyncLockSchema),
  mode: z.optional(FavsSyncModeSchema),
});
export const FavsSchema = z.object({
  version: z.literal(FAVS_SCHEMA_VERSION),
  ids: z.array(z.int()),
  sync: z.optional(FavsSyncSchema),
});

/** Export/import blob: main storage fields plus optional `favIds`. */
export const ExportBlobSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  collections: z.array(CollectionSchema),
  artists: z.array(ArtistEntrySchema),
  marks: z.record(z.string(), MarkFlagsSchema),
  settings: z.optional(SettingsSchema),
  updates: z.optional(UpdatesSchema),
  favIds: z.optional(z.array(z.int())),
});

export type TagType = z.infer<typeof TagTypeSchema>;
export type TagEntry = z.infer<typeof TagEntrySchema>;
export type CollectionKind = z.infer<typeof CollectionKindSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type ArtistEntry = z.infer<typeof ArtistEntrySchema>;
export type MarkFlags = z.infer<typeof MarkFlagsSchema>;
export type AppearanceTheme = z.infer<typeof AppearanceThemeSchema>;
export type AppearanceCustomBase = z.infer<typeof AppearanceCustomBaseSchema>;
export type AppearanceCustom = z.infer<typeof AppearanceCustomSchema>;
export type AppearanceCustomStored = z.infer<typeof AppearanceCustomStoredSchema>;
export type Appearance = z.infer<typeof AppearanceSchema>;
export type AppearanceStored = z.infer<typeof AppearanceStoredSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type UpdatesState = z.infer<typeof UpdatesSchema>;
export type StorageData = z.infer<typeof StorageSchema>;
export type FavsSyncLock = z.infer<typeof FavsSyncLockSchema>;
export type FavsSyncMode = z.infer<typeof FavsSyncModeSchema>;
export type FavsSyncState = z.infer<typeof FavsSyncSchema>;
export type FavsData = z.infer<typeof FavsSchema>;
export type ExportBlob = z.infer<typeof ExportBlobSchema>;
export type VideoSize = z.infer<typeof VideoSizeSchema>;
export type VideoPlayerState = z.infer<typeof VideoPlayerStateSchema>;

export function createDefaultVideoPlayerState(): VideoPlayerState {
  return {
    volume: DEFAULT_VIDEO_VOLUME,
    muted: DEFAULT_VIDEO_MUTED,
    playbackRate: DEFAULT_VIDEO_PLAYBACK_RATE,
  };
}

export function parseVideoPlayerState(raw: unknown): VideoPlayerState {
  const parsed = VideoPlayerStateSchema.safeParse(raw);
  if (!parsed.success) {
    return createDefaultVideoPlayerState();
  }
  const defaults = createDefaultVideoPlayerState();
  const volume = parsed.data.volume;
  const muted = parsed.data.muted;
  const playbackRate = parsed.data.playbackRate;
  return {
    volume:
      volume !== undefined && Number.isFinite(volume)
        ? Math.min(1, Math.max(0, volume))
        : defaults.volume,
    muted: muted ?? defaults.muted,
    playbackRate:
      playbackRate !== undefined &&
      Number.isFinite(playbackRate) &&
      playbackRate > 0
        ? playbackRate
        : defaults.playbackRate,
  };
}

export function resolveVideoSize(raw: string | undefined): VideoSize {
  const parsed = VideoSizeSchema.safeParse(raw);
  if (!parsed.success) {
    return DEFAULT_VIDEO_SIZE;
  }
  return parsed.data;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Drop legacy floating-panel width/height from featureState.panel.
 * Keeps tab and any other keys. No SCHEMA_VERSION bump.
 */
export function stripLegacyPanelWindowSize(
  data: StorageData,
): { data: StorageData; changed: boolean } {
  const featureState = data.settings?.featureState;
  if (featureState === undefined) {
    return { data, changed: false };
  }
  const panelRaw = featureState[LEGACY_PANEL_FEATURE_STATE_ID];
  if (!isUnknownRecord(panelRaw)) {
    return { data, changed: false };
  }
  const hasWidth = Object.prototype.hasOwnProperty.call(
    panelRaw,
    LEGACY_PANEL_WIDTH_KEY,
  );
  const hasHeight = Object.prototype.hasOwnProperty.call(
    panelRaw,
    LEGACY_PANEL_HEIGHT_KEY,
  );
  if (!hasWidth && !hasHeight) {
    return { data, changed: false };
  }

  const nextPanel: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(panelRaw)) {
    if (key === LEGACY_PANEL_WIDTH_KEY || key === LEGACY_PANEL_HEIGHT_KEY) {
      continue;
    }
    nextPanel[key] = value;
  }

  const nextFeatureState: Record<string, unknown> = { ...featureState };
  if (Object.keys(nextPanel).length === 0) {
    delete nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID];
  } else {
    nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID] = nextPanel;
  }

  const nextSettings = data.settings === undefined
    ? { gridFavButtons: DEFAULT_GRID_FAV_BUTTONS }
    : { ...data.settings };
  if (Object.keys(nextFeatureState).length === 0) {
    delete nextSettings.featureState;
  } else {
    nextSettings.featureState = nextFeatureState;
  }

  return {
    data: {
      ...data,
      settings: nextSettings,
    },
    changed: true,
  };
}

/**
 * Saved masonry grid becomes default. Post-panel tab choice is removed.
 * No SCHEMA_VERSION bump.
 */
export function migrateRetiredFeatureChoices(
  data: StorageData,
): { data: StorageData; changed: boolean } {
  const featureChoice = data.settings?.featureChoice;
  if (featureChoice === undefined) {
    return { data, changed: false };
  }
  const nextChoice: Record<string, string> = { ...featureChoice };
  let changed = false;
  if (nextChoice[GRID_DENSITY_CHOICE_ID] === LEGACY_MASONRY_CHOICE_VALUE) {
    nextChoice[GRID_DENSITY_CHOICE_ID] = GRID_DENSITY_DEFAULT_VALUE;
    changed = true;
  }
  if (
    Object.prototype.hasOwnProperty.call(nextChoice, POST_PANEL_TAB_CHOICE_ID)
  ) {
    delete nextChoice[POST_PANEL_TAB_CHOICE_ID];
    changed = true;
  }
  if (!changed) {
    return { data, changed: false };
  }
  const nextSettings =
    data.settings === undefined
      ? { gridFavButtons: DEFAULT_GRID_FAV_BUTTONS }
      : { ...data.settings };
  if (Object.keys(nextChoice).length === 0) {
    delete nextSettings.featureChoice;
  } else {
    nextSettings.featureChoice = nextChoice;
  }
  return {
    data: {
      ...data,
      settings: nextSettings,
    },
    changed: true,
  };
}

export function isPlaylist(collection: Collection): boolean {
  return collection.kind === COLLECTION_KIND_POSTS;
}

/**
 * Posts collections gain `thumbs: {}` and `shuffledOrder: null` when those
 * keys are absent. Saved searches (including explicit `kind: "search"`) are
 * copied through unchanged. No SCHEMA_VERSION bump.
 */
export function migrateCollectionMediaFields(
  data: StorageData,
): { data: StorageData; changed: boolean } {
  let changed = false;
  const collections: Collection[] = [];
  for (const collection of data.collections) {
    if (!isPlaylist(collection)) {
      collections.push(collection);
      continue;
    }
    const needsThumbs = collection.thumbs === undefined;
    const needsOrder = collection.shuffledOrder === undefined;
    if (!needsThumbs && !needsOrder) {
      collections.push(collection);
      continue;
    }
    changed = true;
    const next: Collection = { ...collection };
    if (needsThumbs) {
      next.thumbs = {};
    }
    if (needsOrder) {
      next.shuffledOrder = null;
    }
    collections.push(next);
  }
  if (!changed) {
    return { data, changed: false };
  }
  return {
    data: {
      ...data,
      collections,
    },
    changed: true,
  };
}

export function resolveCollectionKind(collection: Collection): CollectionKind {
  return collection.kind ?? COLLECTION_KIND_SEARCH;
}

export function createDefaultFavs(): FavsData {
  return {
    version: FAVS_SCHEMA_VERSION,
    ids: [],
  };
}

export function createDefaultAppearance(): Appearance {
  return {
    theme: DEFAULT_APPEARANCE_THEME,
  };
}

/**
 * Drop legacy custom color fields; pick Light/Dark base from stored base or
 * luminance of legacy `bg`.
 */
export function normalizeAppearanceCustom(
  raw: AppearanceCustomStored,
): AppearanceCustom {
  const base =
    raw.base === APPEARANCE_CUSTOM_BASE_LIGHT ||
    raw.base === APPEARANCE_CUSTOM_BASE_DARK
      ? raw.base
      : customBaseFromLegacyBg(raw.bg);
  const next: {
    base: AppearanceCustomBase;
    backgroundImage?: string;
    backgroundDim?: number;
  } = { base };
  if (raw.backgroundImage !== undefined) {
    next.backgroundImage = raw.backgroundImage;
  }
  if (raw.backgroundDim !== undefined) {
    next.backgroundDim = raw.backgroundDim;
  }
  return next;
}

export function normalizeAppearance(stored: AppearanceStored): Appearance {
  if (stored.custom === undefined) {
    return { theme: stored.theme };
  }
  return {
    theme: stored.theme,
    custom: normalizeAppearanceCustom(stored.custom),
  };
}

export function createDefaultStorage(): StorageData {
  return {
    version: SCHEMA_VERSION,
    collections: [],
    artists: [],
    marks: {},
    settings: {
      gridFavButtons: DEFAULT_GRID_FAV_BUTTONS,
      updatesGroupSize: DEFAULT_UPDATES_GROUP_SIZE,
      tweaksEnabled: DEFAULT_TWEAKS_ENABLED,
      appearance: createDefaultAppearance(),
    },
    updates: {
      seenPostId: DEFAULT_SEEN_POST_ID,
    },
  };
}

export function resolveAppearance(data: StorageData): Appearance {
  const stored = data.settings?.appearance;
  if (stored === undefined) {
    return createDefaultAppearance();
  }
  return normalizeAppearance(stored);
}

export function resolveGridFavButtons(data: StorageData): boolean {
  return data.settings?.gridFavButtons ?? DEFAULT_GRID_FAV_BUTTONS;
}

export function resolveTweaksEnabled(data: StorageData): boolean {
  return data.settings?.tweaksEnabled ?? DEFAULT_TWEAKS_ENABLED;
}

export function resolveUpdatesGroupSize(data: StorageData): number {
  return data.settings?.updatesGroupSize ?? DEFAULT_UPDATES_GROUP_SIZE;
}

export function resolvePlaylistChunkSize(data: StorageData): number {
  return data.settings?.playlistChunkSize ?? DEFAULT_PLAYLIST_CHUNK_SIZE;
}

export function resolveSeenPostId(data: StorageData): number {
  return data.updates?.seenPostId ?? DEFAULT_SEEN_POST_ID;
}
