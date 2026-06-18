import { useEffect } from "react";
import { releaseRadixModalLock } from "@/lib/radix-modal-lock";

/**
 * Gallery pages mount many Radix Dialog roots (PostCard playlist modals).
 * Run lock cleanup on mount/unmount so navigation back to Discover routes
 * does not leave body pointer-events stuck.
 */
export function useReleaseRadixModalLockOnMount(): void {
  useEffect(() => {
    releaseRadixModalLock();
    const frameId = requestAnimationFrame(() => {
      releaseRadixModalLock();
    });

    return () => {
      cancelAnimationFrame(frameId);
      releaseRadixModalLock();
    };
  }, []);
}
