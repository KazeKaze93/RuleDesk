import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { IPC_CHANNELS } from "../channels";
import {
  addTagToBlacklist,
  getAllBlacklistedTags,
  removeTagFromBlacklist,
} from "../../db/queries/blacklist";
import { sanitizeProviderTagToken } from "../../../shared/utils/provider-tag-sanitize";

const blacklistTagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(128, "Tag is too long")
  .transform((value) => sanitizeProviderTagToken(value).trim().toLowerCase())
  .refine((value) => value.length > 0, "Tag cannot be empty");

export class BlacklistController extends BaseController {
  public setup(): void {
    this.handle(
      IPC_CHANNELS.BLACKLIST.GET_ALL,
      z.tuple([]),
      this.getAll.bind(this),
      { isIdempotent: true }
    );
    this.handle(
      IPC_CHANNELS.BLACKLIST.ADD,
      z.tuple([blacklistTagSchema]),
      this.add.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );
    this.handle(
      IPC_CHANNELS.BLACKLIST.REMOVE,
      z.tuple([blacklistTagSchema]),
      this.remove.bind(this) as (
        event: IpcMainInvokeEvent,
        ...args: unknown[]
      ) => Promise<unknown>
    );

    log.info("[BlacklistController] All handlers registered");
  }

  private async getAll(_event: IpcMainInvokeEvent): Promise<string[]> {
    return getAllBlacklistedTags();
  }

  private async add(_event: IpcMainInvokeEvent, tag: string): Promise<void> {
    addTagToBlacklist(tag);
  }

  private async remove(_event: IpcMainInvokeEvent, tag: string): Promise<void> {
    removeTagFromBlacklist(tag);
  }
}
