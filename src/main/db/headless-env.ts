/** X11 display env var (Linux). */
export const DISPLAY_ENV = "DISPLAY";

/** Wayland display env var (Linux). */
export const WAYLAND_DISPLAY_ENV = "WAYLAND_DISPLAY";

/**
 * True only on Linux when neither X11 nor Wayland display is available.
 * Windows/macOS never count as headless for fatal error dialogs (DISPLAY is unused there).
 */
export function isHeadlessEnvironment(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return (
    platform === "linux" &&
    !env[DISPLAY_ENV] &&
    !env[WAYLAND_DISPLAY_ENV]
  );
}
