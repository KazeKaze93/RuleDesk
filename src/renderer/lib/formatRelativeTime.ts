const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const UNIX_SECONDS_THRESHOLD = 1_000_000_000_000;

const normalizeTimestampToMs = (ts: number): number => {
  return ts < UNIX_SECONDS_THRESHOLD ? ts * 1000 : ts;
};

export const formatRelativeTime = (ts: number): string => {
  const normalizedTs = normalizeTimestampToMs(ts);
  const elapsedMs = Math.max(0, Date.now() - normalizedTs);

  if (elapsedMs < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(elapsedMs / MINUTE_MS));
    return `${minutes} min ago`;
  }
  if (elapsedMs < DAY_MS) {
    return `${Math.floor(elapsedMs / HOUR_MS)}h ago`;
  }
  if (elapsedMs < MONTH_MS) {
    return `${Math.floor(elapsedMs / DAY_MS)}d ago`;
  }

  const months = Math.floor(elapsedMs / MONTH_MS);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};
