import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { bindPressSelect } from "../../src/features/press-select";

describe("marking posts by a press", () => {
  let marks = 0;
  let unbind: () => void = () => undefined;
  let post: HTMLElement;
  let other: HTMLElement;

  beforeEach(() => {
    marks = 0;
    document.body.innerHTML = '<span class="thumb"><a href="#"><img></a></span><p>text</p>';
    const thumb = document.querySelector("span.thumb img");
    const text = document.querySelector("p");
    if (!(thumb instanceof HTMLElement) || !(text instanceof HTMLElement)) {
      throw new Error("markup missing");
    }
    post = thumb;
    other = text;
    unbind = bindPressSelect((target) =>
      target.closest("span.thumb") === null
        ? null
        : () => {
            marks += 1;
          },
    );
  });

  afterEach(() => {
    unbind();
    document.body.innerHTML = "";
  });

  function fire(target: HTMLElement, type: string, init: MouseEventInit = {}): MouseEvent {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  it("marks at the press, and the click that follows only keeps the post from opening", () => {
    const press = fire(post, "mousedown", { button: 0 });
    expect(marks).toBe(1);
    expect(press.defaultPrevented).toBe(true);
    const click = fire(post, "click", { detail: 1 });
    expect(marks).toBe(1);
    expect(click.defaultPrevented).toBe(true);
  });

  it("marks a post pressed in passing, when no click comes at all", () => {
    fire(post, "mousedown", { button: 0 });
    expect(marks).toBe(1);
  });

  it("does not let a drag of the picture start", () => {
    const drag = new Event("dragstart", { bubbles: true, cancelable: true });
    post.dispatchEvent(drag);
    expect(drag.defaultPrevented).toBe(true);
  });

  it("marks on a click no press made, as the keyboard makes it", () => {
    fire(post, "click", { detail: 0 });
    expect(marks).toBe(1);
  });

  it("leaves the other mouse buttons and the rest of the page alone", () => {
    expect(fire(post, "mousedown", { button: 1 }).defaultPrevented).toBe(false);
    expect(fire(other, "mousedown", { button: 0 }).defaultPrevented).toBe(false);
    expect(fire(other, "click", { detail: 1 }).defaultPrevented).toBe(false);
    expect(marks).toBe(0);
  });

  it("stops when unbound", () => {
    unbind();
    fire(post, "mousedown", { button: 0 });
    expect(marks).toBe(0);
  });
});
