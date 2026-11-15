import { afterEach, describe, expect, it } from "vitest";

import { lastRealPid, trimFavoritesPager } from "../../src/site/favorites-pager";

/** `div#paginator > [b current, a[onclick pid], a[name=next], a[name=lastpage]]`. */
function buildPager(pids: readonly number[], nextPid: number, lastPid: number): void {
  const pager = document.createElement("div");
  pager.id = "paginator";
  const link = (pid: number, name?: string): HTMLAnchorElement => {
    const a = document.createElement("a");
    a.href = "#";
    a.setAttribute(
      "onclick",
      `document.location='?page=favorites&s=view&id=1&pid=${String(pid)}'; return false;`,
    );
    a.textContent = name ?? String(pid);
    if (name !== undefined) {
      a.setAttribute("name", name);
    }
    return a;
  };
  for (const pid of pids) {
    pager.append(link(pid));
  }
  pager.append(link(nextPid, "next"), link(lastPid, "lastpage"));
  document.body.append(pager);
}

function visiblePids(): string[] {
  return [...document.querySelectorAll<HTMLElement>("#paginator a")]
    .filter((a) => a.style.display !== "none")
    .map((a) => a.textContent ?? "");
}

describe("favorites pager", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("finds the last page that holds a favorite", () => {
    expect(lastRealPid(0)).toBeNull();
    expect(lastRealPid(1)).toBe(0);
    expect(lastRealPid(50)).toBe(0);
    expect(lastRealPid(51)).toBe(50);
    expect(lastRealPid(11962)).toBe(11950);
  });

  it("hides the links past the last real page and keeps the rest", () => {
    buildPager([0, 50, 100, 150, 200], 50, 200);
    // 120 favorites: pages at 0, 50 and 100.
    expect(trimFavoritesPager(document, 100, 0)).toBe(2);
    expect(visiblePids()).toEqual(["0", "50", "100", "next", "lastpage"]);
    // "Last page" stays and leads to the page that exists.
    const last = document.querySelector('#paginator a[name="lastpage"]');
    expect(last?.getAttribute("onclick")).toBe(
      "document.location='?page=favorites&s=view&id=1&pid=100'; return false;",
    );
  });

  it("hides next and last page on the last real page", () => {
    buildPager([0, 50, 100, 150], 150, 150);
    trimFavoritesPager(document, 100, 100);
    expect(visiblePids()).toEqual(["0", "50", "100"]);
  });
});
