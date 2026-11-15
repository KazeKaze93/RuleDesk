import * as z from "zod/mini";

/**
 * The user's own API credentials for the download manager.
 *
 * They are typed in by the user in settings (generated on the site's account
 * options page) and kept under their own key in the script manager's storage,
 * apart from the main data, so they never get into an export file.
 * Nothing else in the script uses the API.
 */

export const API_CREDENTIALS_KEY = "ruledesk-web.api";

const ApiCredentialsSchema = z.object({
  userId: z.string().check(z.minLength(1)),
  apiKey: z.string().check(z.minLength(1)),
});

export type ApiCredentials = z.infer<typeof ApiCredentialsSchema>;

export function getApiCredentials(): ApiCredentials | null {
  const parsed = ApiCredentialsSchema.safeParse(GM_getValue(API_CREDENTIALS_KEY));
  return parsed.success ? parsed.data : null;
}

export function hasApiCredentials(): boolean {
  return getApiCredentials() !== null;
}

/** Stores trimmed credentials. Returns false when either part is empty. */
export function setApiCredentials(userId: string, apiKey: string): boolean {
  const parsed = ApiCredentialsSchema.safeParse({
    userId: userId.trim(),
    apiKey: apiKey.trim(),
  });
  if (!parsed.success) {
    return false;
  }
  GM_setValue(API_CREDENTIALS_KEY, parsed.data);
  return true;
}

export function clearApiCredentials(): void {
  GM_setValue(API_CREDENTIALS_KEY, null);
}

const USER_ID_PARAM = /(?:^|[?&\s])user_id=([^&\s#]+)/i;
const API_KEY_PARAM = /(?:^|[?&\s])api_key=([^&\s#]+)/i;

function decodePart(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Splits the line the site shows on its account options page,
 * `&api_key=KEY&user_id=123`, into its two parts. The order of the parts and
 * anything around them (a full address, spaces) do not matter.
 * Null when either part is missing.
 */
export function parseApiCredentials(text: string): ApiCredentials | null {
  const userId = USER_ID_PARAM.exec(text)?.[1];
  const apiKey = API_KEY_PARAM.exec(text)?.[1];
  if (userId === undefined || apiKey === undefined) {
    return null;
  }
  const parsed = ApiCredentialsSchema.safeParse({
    userId: decodePart(userId).trim(),
    apiKey: decodePart(apiKey).trim(),
  });
  return parsed.success ? parsed.data : null;
}
