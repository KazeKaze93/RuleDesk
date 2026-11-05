import { describe, expect, it } from "vitest";
import {
  DEFAULT_IPC_SETTINGS,
  IpcSettingsSchema,
  SaveSettingsSchema,
} from "../../../src/shared/schemas/settings";

describe("showPanicButton settings contract", () => {
  it("defaults to false in DEFAULT_IPC_SETTINGS", () => {
    expect(DEFAULT_IPC_SETTINGS.showPanicButton).toBe(false);
  });

  it("requires showPanicButton on IpcSettings payloads", () => {
    const { showPanicButton: _omit, ...withoutFlag } = DEFAULT_IPC_SETTINGS;
    void _omit;
    expect(IpcSettingsSchema.safeParse(withoutFlag).success).toBe(false);
    expect(IpcSettingsSchema.safeParse(DEFAULT_IPC_SETTINGS).success).toBe(true);
  });

  it("accepts showPanicButton on SaveSettingsSchema", () => {
    expect(SaveSettingsSchema.safeParse({ showPanicButton: true }).success).toBe(
      true
    );
    expect(SaveSettingsSchema.safeParse({ showPanicButton: false }).success).toBe(
      true
    );
  });
});
