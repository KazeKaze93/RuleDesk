export const RULE34_CDN_HOSTS = [
  "rule34.xxx",
  "us.rule34.xxx",
  "wimg.rule34.xxx",
  "api-cdn.rule34.xxx",
] as const;

export const CDN_PROBE_TIMEOUT_MS = 3000;
export const CDN_SLOW_THRESHOLD_MS = 5000;
export const CDN_MAX_FAILURES_BEFORE_REPROBE = 3;

export const CDN_PROBE_PATH =
  "/thumbnails/1/thumbnail_0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f.jpg";
