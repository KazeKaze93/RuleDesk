import { beforeEach, describe, expect, it } from "vitest";

import {
  SETTINGS_SECTION_FAVORITES,
  requestSettingsSection,
  takeSettingsSection,
} from "../../src/pages/settings-focus";

describe("opening the settings at a block", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("gives the block that was asked for, once", () => {
    requestSettingsSection(SETTINGS_SECTION_FAVORITES);
    expect(takeSettingsSection()).toBe("favorites");
    expect(takeSettingsSection()).toBeNull();
  });

  it("gives nothing when no block was asked for", () => {
    expect(takeSettingsSection()).toBeNull();
  });
});
