import { afterEach, describe, expect, it } from "vitest";
import {
  isQuitRequested,
  resetQuitRequestedForTests,
  setQuitRequested,
} from "../../../src/main/lib/quit-state";

describe("quit-state", () => {
  afterEach(() => {
    resetQuitRequestedForTests();
  });

  it("defaults to false", () => {
    expect(isQuitRequested()).toBe(false);
  });

  it("setQuitRequested flips the flag", () => {
    setQuitRequested();
    expect(isQuitRequested()).toBe(true);
  });

  it("resetQuitRequestedForTests clears the flag", () => {
    setQuitRequested();
    resetQuitRequestedForTests();
    expect(isQuitRequested()).toBe(false);
  });
});
