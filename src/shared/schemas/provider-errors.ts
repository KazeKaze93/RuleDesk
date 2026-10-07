import { z } from "zod";
import { ErrorCode } from "../types/error-codes";

/** Subset of ErrorCode values used for provider search failures. */
export const ProviderSearchErrorCodeSchema = z.enum([
  ErrorCode.AUTH_ERROR,
  ErrorCode.RATE_LIMIT,
  ErrorCode.NETWORK_ERROR,
  ErrorCode.PARSE_ERROR,
  ErrorCode.UNKNOWN_ERROR,
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
export const ProviderSearchErrorPayloadSchema = z
  .object({
    name: z.literal("ProviderSearchError"),
    message: z.string().min(1),
    code: ProviderSearchErrorCodeSchema,
    providerKind: ProviderErrorKindSchema,
    retryAfterMs: z.number().int().nonnegative().optional(),
  })
  .strict();

/** IPC-safe fields only — explicitly excludes stack and originalError. */
export type ProviderSearchIpcPayload = z.infer<
  typeof ProviderSearchErrorPayloadSchema
>;

export type ProviderSearchErrorPayload = ProviderSearchIpcPayload;

const PROVIDER_KIND_TO_CODE: Record<
  ProviderErrorKind,
  ProviderSearchErrorCode
> = {
  auth: ErrorCode.AUTH_ERROR,
  rate_limit: ErrorCode.RATE_LIMIT,
  network: ErrorCode.NETWORK_ERROR,
  parse: ErrorCode.PARSE_ERROR,
};

export function providerKindToErrorCode(
  kind: ProviderErrorKind
): ProviderSearchErrorCode {
  return PROVIDER_KIND_TO_CODE[kind];
}

export const PROVIDER_SEARCH_USER_MESSAGES: Record<ProviderErrorKind, string> =
  {
    auth: "The API rejected the credentials. Open Settings → Account and sign in again.",
    rate_limit:
      "The imageboard is rate-limiting requests. Wait a moment, then use Retry.",
    network:
      "Could not reach the imageboard. Check your connection and try again.",
    parse:
      "The imageboard returned an unexpected response. Try again later.",
  };

export const PROVIDER_SEARCH_ERROR_TITLES: Record<ProviderErrorKind, string> =
  {
    auth: "API credentials required",
    rate_limit: "Rate limited",
    network: "Network error",
    parse: "Unexpected API response",
  };

export function providerSearchErrorShowsRetry(
  kind: ProviderErrorKind
): boolean {
  return kind !== "auth";
}
