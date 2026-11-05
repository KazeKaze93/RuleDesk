import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SETTINGS_SOURCE_PATH = resolve(
  process.cwd(),
  "src/renderer/features/settings/Settings.tsx"
);

describe("Settings tabs", () => {
  it("renders exactly five tab triggers (General, Account, Blacklist, Data, Help)", () => {
    const source = readFileSync(SETTINGS_SOURCE_PATH, "utf8");
    const triggers = source.match(/<TabsTrigger\b/g) ?? [];

    expect(triggers).toHaveLength(5);
    expect(source).toContain("SETTINGS_TAB.GENERAL");
    expect(source).toContain("SETTINGS_TAB.ACCOUNT");
    expect(source).toContain("SETTINGS_TAB.BLACKLIST");
    expect(source).toContain("SETTINGS_TAB.DATA");
    expect(source).toContain("SETTINGS_TAB.HELP");
    expect(source).not.toContain("SETTINGS_TAB.SYNC");
    expect(source).not.toContain("SETTINGS_TAB.APPEARANCE");
    expect(source).not.toContain("SETTINGS_TAB.BACKUP");
  });
});
