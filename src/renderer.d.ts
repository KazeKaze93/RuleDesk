/**
 * @deprecated Import from ``src/bridge.d.ts`` / ``@shared/types/ipc-bridge``.
 * Kept so existing references to ``renderer.d.ts`` in docs still resolve;
 * ambient ``Window.api`` is declared in ``bridge.d.ts``.
 */
export type {
  IpcBridge,
  TrackedArtist,
  PlaylistWithStats,
  UpdateStatusCallback,
  UpdateProgressCallback,
  SyncErrorCallback,
  AutoBackupInterval,
  BackupResponse,
  PostQueryFilters,
} from "./shared/types/ipc-bridge";
