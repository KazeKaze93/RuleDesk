import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isAllowedRendererNavigation,
  resolveNavigationAllowlist,
  resolveRendererIndexHtmlPath,
} from "../../../src/main/lib/navigation-guard";

describe("navigation-guard", () => {
  const mainDir = path.join("C:", "app", "out", "main");
  const indexHtml = resolveRendererIndexHtmlPath(mainDir);

  it("resolveRendererIndexHtmlPath joins ../renderer/index.html from main dirname", () => {
    expect(path.normalize(indexHtml)).toBe(
      path.normalize(path.join(mainDir, "../renderer/index.html"))
    );
  });

  describe("prod-file allowlist", () => {
    const allowlist = resolveNavigationAllowlist(undefined, mainDir);
    const indexFileUrl = pathToFileURL(indexHtml).href;

    it("allows the loaded index.html with a hash route", () => {
      expect(
        isAllowedRendererNavigation(`${indexFileUrl}#/favorites`, allowlist)
      ).toBe(true);
    });

    it("allows the loaded index.html with a query (pathname still matches)", () => {
      expect(
        isAllowedRendererNavigation(`${indexFileUrl}?x=1`, allowlist)
      ).toBe(true);
    });

    it("denies a different file: URL", () => {
      expect(
        isAllowedRendererNavigation("file:///C:/Windows/win.ini", allowlist)
      ).toBe(false);
    });

    it("denies https", () => {
      expect(
        isAllowedRendererNavigation("https://example.com/", allowlist)
      ).toBe(false);
    });
  });

  describe("dev-origin allowlist", () => {
    const allowlist = resolveNavigationAllowlist(
      "http://localhost:5173/",
      mainDir
    );

    it("allows the dev-server origin", () => {
      expect(
        isAllowedRendererNavigation("http://localhost:5173/#/browse", allowlist)
      ).toBe(true);
    });

    it("denies a foreign origin", () => {
      expect(
        isAllowedRendererNavigation("https://example.com/", allowlist)
      ).toBe(false);
    });

    it("denies file: while in dev mode", () => {
      expect(
        isAllowedRendererNavigation(pathToFileURL(indexHtml).href, allowlist)
      ).toBe(false);
    });
  });
});
