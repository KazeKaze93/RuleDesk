import { app } from "electron";
import path from "node:path";
import { existsSync } from "fs";

/**
 * Resolves the directory that contains app PNG icons (tray, window, renderer).
 * Packaged builds load from process.resourcesPath/icons (extraResources).
 */
export function getAppIconsDirectory(): string {
  if (process.env.NODE_ENV === "development") {
    return path.join(process.cwd(), "resources", "icons");
  }

  const fromResourcesPath = path.join(process.resourcesPath, "icons");
  if (existsSync(fromResourcesPath)) {
    return fromResourcesPath;
  }

  const fromAppPath = path.join(app.getAppPath(), "resources", "icons");
  if (existsSync(fromAppPath)) {
    return fromAppPath;
  }

  return path.join(__dirname, "../../resources/icons");
}

export function getAppIconPath(fileName = "icon.png"): string {
  return path.join(getAppIconsDirectory(), fileName);
}
