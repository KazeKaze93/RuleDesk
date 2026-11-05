import { describe, expect, it } from "vitest";
import {
  SETTINGS_ACCOUNT_DEEPLINK,
  SETTINGS_PATH,
  SETTINGS_TAB,
  SETTINGS_TAB_QUERY_PARAM,
  SETTINGS_TABS,
  parseSettingsTab,
} from "@/lib/settings-tab";

describe("parseSettingsTab", () => {
  it("returns the matching tab for every current id", () => {
    expect(parseSettingsTab(SETTINGS_TAB.GENERAL)).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab(SETTINGS_TAB.ACCOUNT)).toBe(SETTINGS_TAB.ACCOUNT);
    expect(parseSettingsTab(SETTINGS_TAB.BLACKLIST)).toBe(
      SETTINGS_TAB.BLACKLIST
    );
    expect(parseSettingsTab(SETTINGS_TAB.DATA)).toBe(SETTINGS_TAB.DATA);
    expect(parseSettingsTab(SETTINGS_TAB.HELP)).toBe(SETTINGS_TAB.HELP);
  });

  it("maps legacy tab ids to their merged tabs", () => {
    expect(parseSettingsTab("sync")).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab("appearance")).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab("backup")).toBe(SETTINGS_TAB.DATA);
  });

  it("falls back to general for garbage values", () => {
    expect(parseSettingsTab("")).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab("nope")).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab("Account")).toBe(SETTINGS_TAB.GENERAL);
    expect(parseSettingsTab("../evil")).toBe(SETTINGS_TAB.GENERAL);
  });

  it("falls back to general for null", () => {
    expect(parseSettingsTab(null)).toBe(SETTINGS_TAB.GENERAL);
  });
});

describe("SETTINGS_TABS", () => {
  it("exposes exactly five current tab ids", () => {
    expect(SETTINGS_TABS).toEqual([
      SETTINGS_TAB.GENERAL,
      SETTINGS_TAB.DATA,
      SETTINGS_TAB.ACCOUNT,
      SETTINGS_TAB.BLACKLIST,
      SETTINGS_TAB.HELP,
    ]);
  });
});

describe("SETTINGS_ACCOUNT_DEEPLINK", () => {
  it("points at the account tab under settings", () => {
    expect(SETTINGS_ACCOUNT_DEEPLINK).toBe(
      `${SETTINGS_PATH}?${SETTINGS_TAB_QUERY_PARAM}=${SETTINGS_TAB.ACCOUNT}`
    );
  });
});
