import { z } from "zod";

/** Subset of main-process ErrorCode values used for provider search failures. */
export const ProviderSearchErrorCodeSchema = z.enum([
  "AUTH_ERROR",
  "RATE_LIMIT",
  "NETWORK_ERROR",
  "PARSE_ERROR",
  "UNKNOWN_ERROR",
]);

export type ProviderSearchErrorCode = z.infer<
  typeof ProviderSearchErrorCodeSchema
>;

export const ProviderErrorKindSchema = z.enum([
  "auth",
  "rate_limit",
  "network",
  "parse",
]);

export type ProviderErrorKind = z.infer<typeof ProviderErrorKindSchema>;

/**
 * Serializable provider search error payload (IPC-safe).
 * Reuses the BaseController SerializableError shape (name, message, code)
 * with an explicit providerKind discriminator for Browse UI.
 */
export const ProviderSearchErrorPayloadSchema = z.object({
  name: z.literal("ProviderSearchError"),
  message: z.string().min(1),
  code: ProviderSearchErrorCodeSchema,
  providerKind: ProviderErrorKindSchema,
  retryAfterMs: z.number().int().nonnegative().optional(),
});

export type ProviderSearchErrorPayload = z.infer<
  typeof ProviderSearchErrorPayloadSchema
>;

const PROVIDER_KIND_TO_CODE: Record<
  ProviderErrorKind,
  ProviderSearchErrorCode
> = {
  auth: "AUTH_ERROR",
  rate_limit: "RATE_LIMIT",
  network: "NETWORK_ERROR",
  parse: "PARSE_ERROR",
};

export function providerKindToErrorCode(
  kind: ProviderErrorKind
): ProviderSearchErrorCode {
  return PROVIDER_KIND_TO_CODE[kind];
}

export const PROVIDER_SEARCH_USER_MESSAGES: Record<ProviderErrorKind, string> =
  {
    auth: "Rule34 rejected the API credentials. Open Settings → Account and sign in again.",
    rate_limit:
      "Rule34 is rate-limiting requests. Wait a moment, then use Retry.",
    network:
      "Could not reach Rule34. Check your connection and try again.",
    parse:
      "Rule34 returned an unexpected response. Try again later.",
  };

export const PROVIDER_SEARCH_ERROR_TITLES: Record<ProviderErrorKind, string> =
  {
    auth: "API credentials required",
    rate_limit: "Rate limited by Rule34",
    network: "Network error",
    parse: "Unexpected API response",
  };

export function providerSearchErrorShowsRetry(
  kind: ProviderErrorKind
): boolean {
  return kind !== "auth";
}
