export const SETTINGS_PATH = "/settings";

export const SETTINGS_TAB_QUERY_PARAM = "tab";

export const SETTINGS_TAB = {
  GENERAL: "general",
  ACCOUNT: "account",
  BLACKLIST: "blacklist",
  DATA: "data",
  HELP: "help",
} as const;

export type SettingsTab = (typeof SETTINGS_TAB)[keyof typeof SETTINGS_TAB];

export const SETTINGS_TABS = [
  SETTINGS_TAB.GENERAL,
  SETTINGS_TAB.DATA,
  SETTINGS_TAB.ACCOUNT,
  SETTINGS_TAB.BLACKLIST,
  SETTINGS_TAB.HELP,
] as const satisfies readonly SettingsTab[];

/** Legacy tab query ids → current tab (bookmarks / old deeplinks). */
const LEGACY_SETTINGS_TAB_MAP: Readonly<Record<string, SettingsTab>> = {
  sync: SETTINGS_TAB.GENERAL,
  appearance: SETTINGS_TAB.GENERAL,
  backup: SETTINGS_TAB.DATA,
};

export const SETTINGS_ACCOUNT_DEEPLINK = `${SETTINGS_PATH}?${SETTINGS_TAB_QUERY_PARAM}=${SETTINGS_TAB.ACCOUNT}`;

/**
 * Resolve a settings `tab` query value to a known tab id.
 * Legacy ids (sync, appearance, backup) map to their merged tabs.
 * Unknown, empty, or null values fall back to General.
 */
export function parseSettingsTab(value: string | null): SettingsTab {
  if (value === null) {
    return SETTINGS_TAB.GENERAL;
  }
  const legacy = LEGACY_SETTINGS_TAB_MAP[value];
  if (legacy !== undefined) {
    return legacy;
  }
  const match = SETTINGS_TABS.find((tab) => tab === value);
  return match ?? SETTINGS_TAB.GENERAL;
}
