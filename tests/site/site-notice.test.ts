import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RDW_SKIN_CLASS } from "../../src/config/constants";
import {
  NOTICE_GONE_CLASS,
  NOTICE_SHOWN_MS,
  mountSiteNotice,
} from "../../src/site/site-notice";
import { SITE_SKIN_CSS } from "../../src/skin/site-skin";

const TEXT = "You can only cum once a day. You can cum again in 23 hours and 59 minutes";

function notice(): HTMLElement {
  const found = document.querySelector("div#notice");
  if (!(found instanceof HTMLElement)) {
    throw new Error("no notice");
  }
  return found;
}

function gone(): boolean {
  return notice().classList.contains(NOTICE_GONE_CLASS);
}

describe("the site's message to the user", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.classList.add(RDW_SKIN_CLASS);
    document.body.innerHTML = `<div id="notice" class="notice" style="">${TEXT}</div><div id="content"></div>`;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
  });

  it("goes after its time", async () => {
    mountSiteNotice();
    expect(gone()).toBe(false);
    await vi.advanceTimersByTimeAsync(NOTICE_SHOWN_MS - 1);
    expect(gone()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(gone()).toBe(true);
    expect(notice().textContent).toBe(TEXT);
  });

  it("goes on a click", () => {
    mountSiteNotice();
    notice().click();
    expect(gone()).toBe(true);
  });

  it("comes back with a new text and starts its time over", async () => {
    mountSiteNotice();
    notice().click();
    notice().textContent = "Post added to favorites";
    await vi.advanceTimersByTimeAsync(0);
    expect(gone()).toBe(false);
    await vi.advanceTimersByTimeAsync(NOTICE_SHOWN_MS);
    expect(gone()).toBe(true);
  });

  it("is found when the site adds it later", async () => {
    document.body.innerHTML = `<div id="content"></div>`;
    mountSiteNotice();
    document.body.insertAdjacentHTML("afterbegin", `<div id="notice" class="notice">${TEXT}</div>`);
    await vi.advanceTimersByTimeAsync(NOTICE_SHOWN_MS);
    expect(gone()).toBe(true);
  });

  it("is left alone in the site's themes", async () => {
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
    mountSiteNotice();
    await vi.advanceTimersByTimeAsync(NOTICE_SHOWN_MS);
    expect(gone()).toBe(false);
  });

  it("is hidden by the skin once gone", () => {
    expect(SITE_SKIN_CSS).toContain(`div#notice.notice.${NOTICE_GONE_CLASS}`);
  });
});
