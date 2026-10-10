/**
 * Opt-in smokes for before-quit (real Electron app.quit(), same entry as tray Quit).
 *
 * - RULEDESK_SMOKE_QUIT_DURING_DOWNLOAD=1 — hung download, then app.quit()
 * - RULEDESK_SMOKE_IDLE_QUIT_MS=<ms> — app.quit() after delay with no downloads
 */
import http from "node:http";
import { app } from "electron";
import log from "electron-log";
import { getFileController } from "../ipc/index";

const SMOKE_QUIT_DELAY_MS = 800;

function forceExitWatchdog(server: http.Server | null): void {
  setTimeout(() => {
    log.error("[QuitSmoke] Process still alive after quit — forcing exit");
    if (server) {
      try {
        server.close();
      } catch {
        /* ignore */
      }
    }
    app.exit(3);
  }, 20_000);
}

export function maybeRunQuitDuringDownloadSmoke(): void {
  const idleMsRaw = process.env.RULEDESK_SMOKE_IDLE_QUIT_MS;
  if (idleMsRaw !== undefined && idleMsRaw !== "") {
    const idleMs = Number(idleMsRaw);
    if (Number.isFinite(idleMs) && idleMs >= 0) {
      log.info(`[QuitSmoke] Idle quit in ${idleMs}ms (no downloads)`);
      setTimeout(() => {
        log.info("[QuitSmoke] Calling app.quit() (idle / tray Quit entry)");
        forceExitWatchdog(null);
        app.quit();
      }, idleMs);
      return;
    }
  }

  if (process.env.RULEDESK_SMOKE_QUIT_DURING_DOWNLOAD !== "1") {
    return;
  }

  void (async () => {
    const fileController = getFileController();
    if (!fileController) {
      log.error("[QuitSmoke] FileController not ready");
      app.exit(2);
      return;
    }

    const server = http.createServer((_req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": "10485760",
      });
      // Never write the body — keeps the mass-download worker in-flight.
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => resolve());
      server.on("error", reject);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      log.error("[QuitSmoke] Failed to bind hung HTTP server");
      app.exit(2);
      return;
    }

    const folder = app.getPath("downloads");
    const filename = `ruledesk-quit-smoke_${Date.now()}.bin`;
    log.info(
      `[QuitSmoke] Starting hung download then app.quit() in ${SMOKE_QUIT_DELAY_MS}ms`,
      { port: address.port, filename, folder }
    );

    void fileController.runDownloadAll([
      {
        url: `http://127.0.0.1:${address.port}/hang`,
        filename,
      },
    ]);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, SMOKE_QUIT_DELAY_MS);
    });

    if (!fileController.hasActiveDownloads()) {
      log.warn("[QuitSmoke] Download was not active before quit");
    } else {
      log.info("[QuitSmoke] Download active — calling app.quit() (tray Quit entry)");
    }

    forceExitWatchdog(server);
    app.quit();
  })().catch((error: unknown) => {
    log.error("[QuitSmoke] Failed:", error);
    app.exit(2);
  });
}
