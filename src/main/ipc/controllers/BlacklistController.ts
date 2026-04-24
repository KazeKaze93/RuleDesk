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

const blacklistTagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(128, "Tag is too long")
  .regex(/^[a-zA-Z0-9:_-]+$/, "Tag contains unsupported characters")
  .transform((value) => value.toLowerCase());

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
