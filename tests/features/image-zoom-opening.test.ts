import { describe, expect, it } from "vitest";

import {
  fitScale,
  isTallerThanWindow,
  openingState,
  scrollPicture,
} from "../../src/features/image-zoom";

describe("image viewer: how a picture opens", () => {
  it("fits a picture that is not tall", () => {
    const state = openingState(2000, 1500, 1920, 1080);
    expect(state.scale).toBe(fitScale(2000, 1500, 1920, 1080));
    expect(state).toMatchObject({ x: 0, y: 0 });
  });

  it("opens a comic of several screens at its width, from its top", () => {
    // 1079 x 3385 in a 1920 x 1080 window: fitted whole it is a strip at 30%.
    const whole = fitScale(1079, 3385, 1920, 1080);
    const state = openingState(1079, 3385, 1920, 1080);
    expect(whole).toBeLessThan(0.35);
    expect(state.scale).toBe(1);
    // Centred on the window by the viewer; moved down so that its top is at the top margin.
    expect(state.y).toBe((3385 - 1080) / 2 + 24);
  });

  it("never opens above the picture's own size", () => {
    expect(openingState(400, 5000, 1920, 1080).scale).toBe(1);
  });

  it("moves a tall picture with the wheel and stops at its top and bottom", () => {
    const opened = openingState(1079, 3385, 1920, 1080);
    expect(isTallerThanWindow(3385, opened.scale, 1080)).toBe(true);
    // Already at the top: scrolling up changes nothing.
    expect(scrollPicture(opened, -500, 3385, 1080).y).toBe(opened.y);
    const down = scrollPicture(opened, 400, 3385, 1080);
    expect(down.y).toBe(opened.y - 400);
    // Far past the end it stops with the bottom of the picture at the bottom margin.
    expect(scrollPicture(opened, 100000, 3385, 1080).y).toBe(-opened.y);
  });

  it("does not move a picture that fits the window", () => {
    const state = openingState(2000, 1500, 1920, 1080);
    expect(isTallerThanWindow(1500, state.scale, 1080)).toBe(false);
    expect(scrollPicture(state, 300, 1500, 1080).y).toBe(0);
  });
});
