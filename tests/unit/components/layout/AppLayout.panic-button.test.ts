import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const APP_LAYOUT_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/components/layout/AppLayout.tsx"
);

vi.mock("electron-log/renderer", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  clearSafeModeWhenPanicButtonHidden,
  useSafeModeStore,
} from "@/store/safeModeStore";

describe("AppLayout panic button mount", () => {
  it("mounts PanicButton only when settings.showPanicButton is true", () => {
    const source = readFileSync(APP_LAYOUT_SOURCE_PATH, "utf8");

    expect(source).toContain("settings?.showPanicButton === true");
    expect(source).toContain("{showPanicButton ? <PanicButton /> : null}");
    expect(source).toContain("clearSafeModeWhenPanicButtonHidden");
    expect(source).toContain("if (settings == null)");
    expect(source).not.toMatch(/<PanicButton\s*\/>\s*\n\s*<\/div>/);
  });
});

describe("clearSafeModeWhenPanicButtonHidden", () => {
  beforeEach(() => {
    useSafeModeStore.setState({
      safeMode: false,
      panicMode: false,
      blurAmount: 20,
    });
  });

  it("resets persisted safeMode and panicMode when setting is false", () => {
    useSafeModeStore.setState({ safeMode: true, panicMode: true });

    clearSafeModeWhenPanicButtonHidden(false);

    const state = useSafeModeStore.getState();
    expect(state.safeMode).toBe(false);
    expect(state.panicMode).toBe(false);
  });

  it("leaves safeMode on when setting is true", () => {
    useSafeModeStore.setState({ safeMode: true, panicMode: true });

    clearSafeModeWhenPanicButtonHidden(true);

    const state = useSafeModeStore.getState();
    expect(state.safeMode).toBe(true);
    expect(state.panicMode).toBe(true);
  });

  it("does nothing while settings are not loaded (undefined)", () => {
    useSafeModeStore.setState({ safeMode: true, panicMode: true });

    clearSafeModeWhenPanicButtonHidden(undefined);

    const state = useSafeModeStore.getState();
    expect(state.safeMode).toBe(true);
    expect(state.panicMode).toBe(true);
  });

  it("resets when setting flips true → false with Safe Mode on", () => {
    useSafeModeStore.setState({ safeMode: true, panicMode: false });

    clearSafeModeWhenPanicButtonHidden(true);
    expect(useSafeModeStore.getState().safeMode).toBe(true);

    clearSafeModeWhenPanicButtonHidden(false);
    expect(useSafeModeStore.getState().safeMode).toBe(false);
    expect(useSafeModeStore.getState().panicMode).toBe(false);
  });
});
