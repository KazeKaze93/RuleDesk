/**
 * Defers destructive main-side cleanup (release/abort) so React.StrictMode's
 * mount → cleanup → remount in development can cancel before the IPC fires.
 *
 * StrictMode runs that cycle synchronously; any positive macrotask delay is
 * enough for remount's `cancelRelease` to clear the timer. 50 ms adds a small
 * margin for scheduling jitter without making real gallery leave feel sticky.
 */
export const RELEASE_DEFER_MS = 50;

const pendingById = new Map<number, ReturnType<typeof setTimeout>>();

export function cancelRelease(playlistId: number): void {
  const timer = pendingById.get(playlistId);
  if (timer === undefined) {
    return;
  }
  clearTimeout(timer);
  pendingById.delete(playlistId);
}

/**
 * Schedule `fn` after {@link RELEASE_DEFER_MS}. A later schedule for the same
 * `playlistId` replaces the previous timer; `cancelRelease` drops it.
 */
export function scheduleRelease(playlistId: number, fn: () => void): void {
  cancelRelease(playlistId);
  const timer = setTimeout(() => {
    pendingById.delete(playlistId);
    fn();
  }, RELEASE_DEFER_MS);
  pendingById.set(playlistId, timer);
}
