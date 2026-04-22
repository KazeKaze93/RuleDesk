import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

const MINUTE_MS = 60_000;

const getRelativeSyncLabel = (lastSyncedAt: Date | null): string => {
  if (!lastSyncedAt) {
    return "Never synced";
  }

  const elapsedMs = Date.now() - lastSyncedAt.getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / MINUTE_MS));

  if (elapsedMinutes < 1) {
    return "Just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours} h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} d ago`;
};

export const SyncStatusBadge = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      setIsSyncing(true);
    });

    const unsubscribeProgress = window.api.onSyncProgress(() => {
      setIsSyncing(true);
    });

    const unsubscribeEnd = window.api.onSyncEnd(() => {
      setIsSyncing(false);
      setLastSyncedAt(new Date());
    });

    return () => {
      unsubscribeStart();
      unsubscribeProgress();
      unsubscribeEnd();
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, MINUTE_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const label = useMemo(() => {
    void tick;
    return isSyncing ? "Syncing..." : getRelativeSyncLabel(lastSyncedAt);
  }, [isSyncing, lastSyncedAt, tick]);

  return (
    <div
      className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs"
      aria-live="polite"
      title={isSyncing ? "Sync in progress" : "Sync status"}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground",
          isSyncing && "text-primary"
        )}
      >
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        )}
      </span>
      <span className="font-medium text-muted-foreground">{label}</span>
    </div>
  );
};
