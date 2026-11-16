import { loadFavSet } from "./favs";
import { getFeatureState, load, setFeatureState } from "./store";

/**
 * Two small records kept with the settings:
 *
 * - a point a day of how much the script holds (favorites, followed tags,
 *   collections), for the History block of Statistics;
 * - when the data was last exported, for the reminder to make a backup.
 *
 * A point is written at most once a day, on the first page of that day.
 */

export const STATS_HISTORY_STATE_ID = "stats-history";
export const LAST_BACKUP_STATE_ID = "last-backup";
/** A little over a year of days. */
export const STATS_HISTORY_MAX = 400;
const MS_PER_DAY = 86_400_000;
/** Remind when the last backup is older than this. */
export const BACKUP_DUE_DAYS = 30;
/** With no backup at all, remind once the script has been in use this long. */
export const BACKUP_FIRST_DUE_DAYS = 14;
const DAY_LENGTH = 10;

export type StatsPoint = {
  /** The day, `YYYY-MM-DD`. */
  readonly day: string;
  readonly favorites: number;
  readonly followed: number;
  readonly collections: number;
};

function isStatsPoint(value: unknown): value is StatsPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "day" in value &&
    typeof value.day === "string" &&
    "favorites" in value &&
    typeof value.favorites === "number" &&
    "followed" in value &&
    typeof value.followed === "number" &&
    "collections" in value &&
    typeof value.collections === "number"
  );
}

export function dayOf(time: number): string {
  return new Date(time).toISOString().slice(0, DAY_LENGTH);
}

export function readStatsHistory(): StatsPoint[] {
  const stored = getFeatureState(STATS_HISTORY_STATE_ID);
  return Array.isArray(stored) ? stored.filter(isStatsPoint) : [];
}

/**
 * `history` with `point` as its last day: a point of the same day replaces
 * the one kept, so the day ends with its latest numbers.
 */
export function withStatsPoint(history: readonly StatsPoint[], point: StatsPoint): StatsPoint[] {
  const rest = history.filter((item) => item.day !== point.day);
  return [...rest, point].slice(-STATS_HISTORY_MAX);
}

/** Writes today's point unless today already has one. */
export function recordStatsPoint(now: number = Date.now()): void {
  const history = readStatsHistory();
  const day = dayOf(now);
  if (history.some((item) => item.day === day)) {
    return;
  }
  const data = load();
  setFeatureState(
    STATS_HISTORY_STATE_ID,
    withStatsPoint(history, {
      day,
      favorites: loadFavSet().size,
      followed: data.artists.length,
      collections: data.collections.length,
    }),
  );
}

export function readLastBackup(): number | null {
  const stored = getFeatureState(LAST_BACKUP_STATE_ID);
  const time = typeof stored === "string" ? Date.parse(stored) : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

export function rememberBackup(now: number = Date.now()): void {
  setFeatureState(LAST_BACKUP_STATE_ID, new Date(now).toISOString());
}

export type BackupStatus = {
  /** True when it is time to say so. */
  readonly due: boolean;
  readonly text: string;
};

function daysBetween(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / MS_PER_DAY));
}

function daysWord(days: number): string {
  return `${String(days)} ${days === 1 ? "day" : "days"}`;
}

/**
 * Whether a backup is due and how to say it.
 *
 * @param lastBackup when the data was last exported, or null for never
 * @param firstDay the first day the script has a record of, `YYYY-MM-DD`, or null
 * @param hasData whether there is anything worth a backup
 */
export function backupStatus(
  lastBackup: number | null,
  firstDay: string | null,
  hasData: boolean,
  now: number,
): BackupStatus {
  if (lastBackup !== null) {
    const days = daysBetween(lastBackup, now);
    const text = days === 0 ? "Last backup: today." : `Last backup: ${daysWord(days)} ago.`;
    return { due: hasData && days > BACKUP_DUE_DAYS, text };
  }
  const since = firstDay === null ? Number.NaN : Date.parse(firstDay);
  const used = Number.isFinite(since) ? daysBetween(since, now) : 0;
  return {
    due: hasData && used >= BACKUP_FIRST_DUE_DAYS,
    text: "No backup yet. Export keeps your collections and follows if the browser's data is lost.",
  };
}

/** The status for the data the script holds now. */
export function currentBackupStatus(now: number = Date.now()): BackupStatus {
  const data = load();
  const hasData = data.artists.length > 0 || data.collections.length > 0;
  return backupStatus(readLastBackup(), readStatsHistory()[0]?.day ?? null, hasData, now);
}
