import type {
  ProviderErrorKind,
  ProviderSearchErrorPayload,
} from "../../shared/schemas/provider-errors";
import {
  providerKindToErrorCode,
  PROVIDER_SEARCH_USER_MESSAGES,
} from "../../shared/schemas/provider-errors";

export class ProviderSearchError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;

  constructor(
    kind: ProviderErrorKind,
    message?: string,
    retryAfterMs?: number
  ) {
    super(message ?? PROVIDER_SEARCH_USER_MESSAGES[kind]);
    this.name = "ProviderSearchError";
    this.kind = kind;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isProviderSearchError(
  error: unknown
): error is ProviderSearchError {
  return error instanceof ProviderSearchError;
}

export function toProviderSearchSerializableError(
  error: ProviderSearchError
): ProviderSearchErrorPayload {
  return {
    name: "ProviderSearchError",
    message: error.message,
    code: providerKindToErrorCode(error.kind),
    providerKind: error.kind,
    retryAfterMs: error.retryAfterMs,
  };
}

export function providerSearchErrorFromUnknown(
  error: unknown
): ProviderSearchError {
  if (isProviderSearchError(error)) {
    return error;
  }
  return new ProviderSearchError("network");
}
