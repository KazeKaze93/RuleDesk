export const SETTINGS_PATH = "/settings";

export const SETTINGS_TAB_QUERY_PARAM = "tab";

export const SETTINGS_TAB = {
  GENERAL: "general",
  SYNC: "sync",
  APPEARANCE: "appearance",
  BACKUP: "backup",
  ACCOUNT: "account",
  BLACKLIST: "blacklist",
  HELP: "help",
} as const;

export type SettingsTab = (typeof SETTINGS_TAB)[keyof typeof SETTINGS_TAB];

export const SETTINGS_TABS = [
  SETTINGS_TAB.GENERAL,
  SETTINGS_TAB.SYNC,
  SETTINGS_TAB.APPEARANCE,
  SETTINGS_TAB.BACKUP,
  SETTINGS_TAB.ACCOUNT,
  SETTINGS_TAB.BLACKLIST,
  SETTINGS_TAB.HELP,
] as const satisfies readonly SettingsTab[];

export const SETTINGS_ACCOUNT_DEEPLINK = `${SETTINGS_PATH}?${SETTINGS_TAB_QUERY_PARAM}=${SETTINGS_TAB.ACCOUNT}`;

/**
 * Resolve a settings `tab` query value to a known tab id.
 * Unknown, empty, or null values fall back to General.
 */
export function parseSettingsTab(value: string | null): SettingsTab {
  const match = SETTINGS_TABS.find((tab) => tab === value);
  return match ?? SETTINGS_TAB.GENERAL;
}
