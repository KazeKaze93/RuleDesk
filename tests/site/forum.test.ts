import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FORUM_BADGE_CLASS,
  FORUM_MARKED_ROW_CLASS,
  FORUM_NO_VALUE_CLASS,
  FORUM_ONLY_NEW_CLASS,
  FORUM_PIN_CLASS,
  FORUM_STATE_ID,
  FORUM_STICKY_ROW_CLASS,
  FORUM_TOOLBAR_CLASS,
  FORUM_UNIT_ATTRIBUTE,
  dressForumRow,
  isStickyRow,
  mountListPages,
  repliesUnit,
  rowSignature,
} from "../../src/site/list-pages";
import { SITE_SKIN_CSS } from "../../src/skin/site-skin";
import { clearStorageCache, getFeatureState, setFeatureState } from "../../src/storage/store";

/** Rows as the site sends them (from Kaze, 16.11.2026), shortened. */
const STICKY_LOCKED = `<tr class="even"><td><span class="forum-topic">Sticky: <a href="?page=forum&amp;s=view&amp;id=13927">Mod applications here - OPEN</a></span> <span class="locked-topic">(locked)</span></td><td>Kielan</td><td><span title="Fri, Sep 18 '26, 18:46">Fri, Sep 18 '26, 18:46</span></td><td>N/A</td><td>0</td></tr>`;
const PLAIN = `<tr class="odd"><td><span class="forum-topic"><a href="?page=forum&amp;s=view&amp;id=39777">Your cup size</a></span></td><td>TittyAddict</td><td><span title="Tue, Nov 17 '26, 03:07">Today, 03:07</span></td><td>realone67</td><td>50</td></tr>`;
const ONE_REPLY = `<tr class="even"><td><span class="forum-topic"><a href="?page=forum&amp;s=view&amp;id=40001">Most disastrous hookup</a></span></td><td>nrkmrs</td><td><span>Today, 02:30</span></td><td>FrierenSlays</td><td>1</td></tr>`;

function page(rows: string): void {
  document.body.innerHTML = `<div id="content"><div id="forum">
  <div id="search"><form method="post" action="?page=forum&amp;s=search"><input type="text" name="search"><input type="submit" value="Search"></form></div>
  <table class="highlightable" width="100%"><thead><tr class="tableheader"><th>Title</th><th>Created by</th><th>Updated</th><th>Updated By</th><th>Replies</th></tr></thead>
  <tbody>${rows}</tbody></table></div></div>`;
}

function row(index: number): Element {
  const found = document.querySelectorAll("tbody > tr")[index];
  if (found === undefined) {
    throw new Error("no row");
  }
  return found;
}

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  vi.stubGlobal("GM_getValue", (key: string, defaultValue?: unknown): unknown =>
    memory.has(key) ? memory.get(key) : defaultValue,
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

describe("a row of the topics list", () => {
  beforeEach(() => {
    page(STICKY_LOCKED + PLAIN + ONE_REPLY);
  });

  it("gets a pin for the word Sticky and keeps its title a link", () => {
    expect(isStickyRow(row(0))).toBe(true);
    expect(isStickyRow(row(1))).toBe(false);
    dressForumRow(row(0));
    const topic = row(0).querySelector("span.forum-topic");
    expect(topic?.textContent).toBe("Mod applications here - OPEN");
    expect(topic?.querySelector(`.${FORUM_PIN_CLASS}`)?.getAttribute("aria-label")).toBe("Sticky");
    expect(row(0).classList.contains(FORUM_STICKY_ROW_CLASS)).toBe(true);
    expect(topic?.querySelector("a")?.getAttribute("href")).toBe("?page=forum&s=view&id=13927");
  });

  it("says Locked without the brackets, hides N/A, and names the number of replies", () => {
    dressForumRow(row(0));
    dressForumRow(row(1));
    dressForumRow(row(2));
    expect(row(0).querySelector("span.locked-topic")?.textContent).toBe("Locked");
    expect(row(0).children[3]?.classList.contains(FORUM_NO_VALUE_CLASS)).toBe(true);
    expect(row(1).children[3]?.classList.contains(FORUM_NO_VALUE_CLASS)).toBe(false);
    expect(row(0).children[4]?.getAttribute(FORUM_UNIT_ATTRIBUTE)).toBe("replies");
    expect(row(2).children[4]?.getAttribute(FORUM_UNIT_ATTRIBUTE)).toBe("reply");
    expect(repliesUnit(" 1 ")).toBe("reply");
    expect(repliesUnit("50")).toBe("replies");
  });

  it("leaves a plain row's cells and their order as the site made them", () => {
    const before = [...row(1).children].map((cell) => cell.textContent);
    dressForumRow(row(1));
    expect([...row(1).children].map((cell) => cell.textContent)).toEqual(before);
    expect(row(1).querySelector(`.${FORUM_PIN_CLASS}`)).toBeNull();
  });
});

describe("the topics list", () => {
  beforeEach(() => {
    installGmMocks();
    document.documentElement.classList.add("rdw-skin");
    document.head.replaceChildren();
    page(STICKY_LOCKED + PLAIN + ONE_REPLY);
  });

  it("remembers everything silently on the first visit, with no marks and no filter", () => {
    mountListPages("?page=forum&s=list");
    expect(document.querySelector(`.${FORUM_BADGE_CLASS}`)).toBeNull();
    expect(document.querySelector(`.${FORUM_TOOLBAR_CLASS}`)?.children).toHaveLength(0);
    expect(Object.keys(Object(getFeatureState(FORUM_STATE_ID)))).toEqual(["13927", "39777", "40001"]);
    // The rows are dressed all the same.
    expect(row(0).querySelector(`.${FORUM_PIN_CLASS}`)).not.toBeNull();
  });

  it("compares the site's own text, so dressing a row does not make it look changed", () => {
    const signatures = [0, 1, 2].map((index) => rowSignature(row(index)));
    setFeatureState(FORUM_STATE_ID, {
      "13927": signatures[0],
      "39777": signatures[1],
      "40001": signatures[2],
    });
    mountListPages("?page=forum&s=list");
    expect(document.querySelector(`.${FORUM_BADGE_CLASS}`)).toBeNull();
  });

  it("marks what changed and filters to it with New for me", () => {
    setFeatureState(FORUM_STATE_ID, {
      "13927": rowSignature(row(0)),
      "39777": "Your cup size TittyAddict Yesterday someone 49",
    });
    mountListPages("?page=forum&s=list");
    const forum = document.getElementById("forum");
    expect(row(1).classList.contains(FORUM_MARKED_ROW_CLASS)).toBe(true);
    expect(row(1).querySelector(`.${FORUM_BADGE_CLASS}`)?.textContent).toBe("updated");
    expect(row(2).querySelector(`.${FORUM_BADGE_CLASS}`)?.textContent).toBe("new");
    expect(row(0).classList.contains(FORUM_MARKED_ROW_CLASS)).toBe(false);

    const buttons = [...document.querySelectorAll(`.${FORUM_TOOLBAR_CLASS} button`)];
    expect(buttons.map((button) => button.textContent)).toEqual([
      "All",
      "New for me",
      "Mark all as read",
    ]);
    const onlyNew = buttons[1];
    if (onlyNew instanceof HTMLButtonElement) {
      onlyNew.click();
    }
    expect(forum?.classList.contains(FORUM_ONLY_NEW_CLASS)).toBe(true);
    expect(onlyNew?.getAttribute("aria-pressed")).toBe("true");

    const readAll = buttons[2];
    if (readAll instanceof HTMLButtonElement) {
      readAll.click();
    }
    expect(document.querySelector(`.${FORUM_BADGE_CLASS}`)).toBeNull();
    expect(forum?.classList.contains(FORUM_ONLY_NEW_CLASS)).toBe(false);
  });

  it("opens the topic on a click anywhere in its row", () => {
    mountListPages("?page=forum&s=list");
    const link = row(1).querySelector("a");
    const opened = vi.fn((event: Event) => {
      event.preventDefault();
    });
    link?.addEventListener("click", opened);
    const cell = row(1).children[4];
    if (cell instanceof HTMLElement) {
      cell.click();
    }
    expect(opened).toHaveBeenCalledTimes(1);
  });
});

describe("the forum in the skin", () => {
  it("lays the list out as cards without touching a topic page, and the other way round", () => {
    expect(SITE_SKIN_CSS).toContain("div#forum:not(.response-list) > table.highlightable > tbody > tr {");
    expect(SITE_SKIN_CSS).toContain("div#forum.response-list > div.post {");
    expect(SITE_SKIN_CSS).toContain('content: " " attr(data-rdw-unit);');
  });
});
