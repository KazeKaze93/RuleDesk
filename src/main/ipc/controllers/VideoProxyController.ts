import { type IpcMainInvokeEvent } from "electron";
import log from "electron-log";
import { z } from "zod";
import { BaseController } from "../../core/ipc/BaseController";
import { VideoProxyServer } from "../../services/video-proxy-server";
import { IPC_CHANNELS } from "../channels";

// Query style: Drizzle Builder API only in this controller.
export class VideoProxyController extends BaseController {
  private readonly videoProxyServer: VideoProxyServer;

  constructor(videoProxyServer: VideoProxyServer) {
    super();
    this.videoProxyServer = videoProxyServer;
  }

  public setup(): void {
    this.handle(
      IPC_CHANNELS.VIDEO_PROXY.GET_URL,
      z.tuple([z.string().url()]),
      this.getVideoProxyUrl.bind(this),
      { isIdempotent: true },
    );

    log.info("[VideoProxyController] All handlers registered");
  }

  private getVideoProxyUrl(
    _event: IpcMainInvokeEvent,
    fileUrl: unknown,
  ): string {
    if (typeof fileUrl !== "string") {
      const message = "[VideoProxyController] getVideoProxyUrl: expected string";
      log.error(message);
      throw new Error(message);
    }
    return this.videoProxyServer.getProxyUrl(fileUrl);
  }
}
