export type ParsedCredentials = {
  userId?: string;
  apiKey?: string;
};

const USER_ID_PARAM = /(?:^|[?&])user_id=([^&\s#]+)/i;
const API_KEY_PARAM = /(?:^|[?&])api_key=([^&\s#]+)/i;

function looksLikeCredentialQuery(text: string): boolean {
  return /(?:^|[?&])(?:api_key|user_id)=/i.test(text);
}

/**
 * Extracts user_id and api_key from pasted query strings
 * (e.g. "api_key=KEY&user_id=123", "&api_key=KEY&user_id=123", or full URLs).
 */
export function parseCredentialsFromText(text: string): ParsedCredentials {
  const result: ParsedCredentials = {};
  const trimmed = text.trim();
  if (!trimmed) {
    return result;
  }

  const userIdMatch = trimmed.match(USER_ID_PARAM);
  if (userIdMatch) {
    result.userId = decodeURIComponent(userIdMatch[1]);
  }

  const apiKeyMatch = trimmed.match(API_KEY_PARAM);
  if (apiKeyMatch) {
    result.apiKey = decodeURIComponent(apiKeyMatch[1]);
  }

  return result;
}

/**
 * Normalizes credential fields before persistence.
 * Accepts raw keys or combined query-string pastes.
 */
export function normalizeCredentialsInput(input: {
  userId?: string;
  apiKey?: string;
}): { userId?: string; apiKey?: string } {
  const rawUserId = input.userId?.trim() ?? "";
  const rawApiKey = input.apiKey?.trim() ?? "";

  const combined = [rawApiKey, rawUserId].filter(Boolean).join(
    rawApiKey && rawUserId ? "&" : ""
  );
  const fromCombined =
    combined && looksLikeCredentialQuery(combined)
      ? parseCredentialsFromText(combined)
      : {};

  const fromApiKeyField = parseCredentialsFromText(rawApiKey);
  const fromUserIdField = parseCredentialsFromText(rawUserId);

  const userId =
    fromCombined.userId ??
    fromApiKeyField.userId ??
    fromUserIdField.userId ??
    (rawUserId && !looksLikeCredentialQuery(rawUserId) ? rawUserId : undefined);

  const apiKey =
    fromCombined.apiKey ??
    fromApiKeyField.apiKey ??
    fromUserIdField.apiKey ??
    (rawApiKey && !looksLikeCredentialQuery(rawApiKey) ? rawApiKey : undefined);

  return {
    userId: userId?.trim() || undefined,
    apiKey: apiKey?.trim() || undefined,
  };
}
