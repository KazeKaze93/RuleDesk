import { ipcRenderer } from "electron";
import {
  isIpcFailureResult,
  errorFromIpcFailure,
} from "../shared/utils/ipc-result";

/**
 * Preload invoke wrapper: BaseController returns ``{ ok: false, error }`` on
 * failure so ``code`` survives Structured Clone; rethrow as Error with fields.
 */
export async function invokeIpc<T>(
  channel: string,
  ...args: unknown[]
): Promise<T> {
  const result: unknown = await ipcRenderer.invoke(channel, ...args);
  if (isIpcFailureResult(result)) {
    throw errorFromIpcFailure(result);
  }
  // boundary: channel success payload matches the IpcBridge method return type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, no-restricted-syntax -- boundary: preload IPC success payload
  return result as T;
}
