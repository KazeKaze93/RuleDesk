import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SIDEBAR_SOURCE = readFileSync(
  resolve(process.cwd(), "src/renderer/components/layout/Sidebar.tsx"),
  "utf8"
);
const ACCOUNT_TAB_SOURCE = readFileSync(
  resolve(process.cwd(), "src/renderer/features/settings/SettingsAccountTab.tsx"),
  "utf8"
);

describe("Log Out lives in Settings → Account", () => {
  it("Sidebar keeps Sync now and does not host Log Out beside it", () => {
    expect(SIDEBAR_SOURCE).toContain("Sync now");
    expect(SIDEBAR_SOURCE).not.toContain("Log Out");
    expect(SIDEBAR_SOURCE).not.toContain("LogOut");
    expect(SIDEBAR_SOURCE).not.toContain("ConfirmActionDialog");
    expect(SIDEBAR_SOURCE).not.toContain("window.api.logout()");
  });

  it("Account tab hosts Log Out with the same confirmation dialog", () => {
    expect(ACCOUNT_TAB_SOURCE).toContain("LOG_OUT_BUTTON_LABEL");
    expect(ACCOUNT_TAB_SOURCE).toContain('"Log Out"');
    expect(ACCOUNT_TAB_SOURCE).toContain("ConfirmActionDialog");
    expect(ACCOUNT_TAB_SOURCE).toContain("LOG_OUT_DIALOG_TITLE");
    expect(ACCOUNT_TAB_SOURCE).toContain('"Log out?"');
    expect(ACCOUNT_TAB_SOURCE).toContain(
      '"Are you sure you want to log out? You will need to enter your API credentials again."'
    );
    expect(ACCOUNT_TAB_SOURCE).toContain("window.api.logout()");
    expect(ACCOUNT_TAB_SOURCE).toContain('variant="destructive"');
    // Gate reuses this tab with hasApiKey={false}; hide Log Out until credentials exist.
    expect(ACCOUNT_TAB_SOURCE).toMatch(/\{hasApiKey \? \([\s\S]*LOG_OUT_BUTTON_LABEL/);
  });
});
