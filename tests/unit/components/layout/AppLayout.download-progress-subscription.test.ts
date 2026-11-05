import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_LAYOUT_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/components/layout/AppLayout.tsx"
);
const USE_DOWNLOAD_ALL_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/hooks/useDownloadAll.ts"
);
const USE_TRACK_AND_DOWNLOAD_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/hooks/useTrackAndDownloadArtist.ts"
);

describe("AppLayout download progress subscription ownership", () => {
  it("mounts the single layout subscription hook", () => {
    const source = readFileSync(APP_LAYOUT_SOURCE_PATH, "utf8");
    expect(source).toContain("useSubscribeDownloadAllProgress");
  });

  it("does not subscribe to onDownloadAllProgress inside download hooks", () => {
    const downloadAll = readFileSync(USE_DOWNLOAD_ALL_SOURCE_PATH, "utf8");
    const trackAndDownload = readFileSync(
      USE_TRACK_AND_DOWNLOAD_SOURCE_PATH,
      "utf8"
    );

    expect(downloadAll).not.toContain("onDownloadAllProgress");
    expect(trackAndDownload).not.toContain("onDownloadAllProgress");
  });
});
