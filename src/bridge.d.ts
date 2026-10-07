/**
 * Ambient ``window.api`` types — derived from the shared IPC bridge contract.
 * Do not redeclare methods here; edit ``src/shared/types/ipc-bridge.ts`` instead.
 */
import type { IpcBridge } from "./shared/types/ipc-bridge";

declare global {
  interface Window {
    api: IpcBridge;
  }
}

export {};
