// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isEventFromOwnDom } from "@/lib/dom-event";

describe("isEventFromOwnDom", () => {
  it("returns true when target is inside currentTarget", () => {
    const host = document.createElement("div");
    const child = document.createElement("span");
    host.appendChild(child);

    expect(
      isEventFromOwnDom({ target: child, currentTarget: host })
    ).toBe(true);
  });

  it("returns false when target is outside currentTarget", () => {
    const host = document.createElement("div");
    const outsider = document.createElement("span");

    expect(
      isEventFromOwnDom({ target: outsider, currentTarget: host })
    ).toBe(false);
  });

  it("returns false when target is not a Node", () => {
    const host = document.createElement("div");

    expect(
      isEventFromOwnDom({ target: null, currentTarget: host })
    ).toBe(false);
    expect(
      isEventFromOwnDom({
        target: new EventTarget(),
        currentTarget: host,
      })
    ).toBe(false);
  });
});
