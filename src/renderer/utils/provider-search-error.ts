import {
  type ProviderErrorKind,
  type ProviderSearchErrorPayload,
} from "../../shared/schemas/provider-errors";
import {
  PROVIDER_SEARCH_ERROR_TITLES,
  PROVIDER_SEARCH_USER_MESSAGES,
  providerSearchErrorShowsRetry,
} from "../../shared/schemas/provider-errors";
import { parseProviderSearchErrorPayload } from "../../shared/utils/provider-search-ipc";

export { parseProviderSearchErrorPayload } from "../../shared/utils/provider-search-ipc";

export class BrowseSearchError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;
  readonly code: ProviderSearchErrorPayload["code"];

  constructor(payload: ProviderSearchErrorPayload) {
    super(payload.message);
    this.name = "BrowseSearchError";
    this.kind = payload.providerKind;
    this.retryAfterMs = payload.retryAfterMs;
    this.code = payload.code;
  }
}

export function toBrowseSearchError(error: unknown): BrowseSearchError | null {
  if (error instanceof BrowseSearchError) {
    return error;
  }
  const payload = parseProviderSearchErrorPayload(error);
  if (!payload) {
    return null;
  }
  return new BrowseSearchError(payload);
}

export function assertBrowseSearchError(error: unknown): never {
  const typed = toBrowseSearchError(error);
  if (typed) {
    throw typed;
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(String(error));
}

export type BrowseSearchErrorPresentation = {
  title: string;
  description: string;
  showRetry: boolean;
};

export function getBrowseSearchErrorPresentation(
  kind: ProviderErrorKind,
  retryAfterMs?: number
): BrowseSearchErrorPresentation {
  const title = PROVIDER_SEARCH_ERROR_TITLES[kind];
  const showRetry = providerSearchErrorShowsRetry(kind);
  let description = PROVIDER_SEARCH_USER_MESSAGES[kind];

  if (kind === "rate_limit" && retryAfterMs !== undefined && retryAfterMs > 0) {
    const waitSeconds = Math.ceil(retryAfterMs / 1000);
    description = `${description} Try again in about ${waitSeconds} seconds.`;
  }

  return {
    title,
    description,
    showRetry,
  };
}

export function getBrowseSearchRetryDelayMs(
  attempt: number,
  error: unknown
): number {
  const payload = parseProviderSearchErrorPayload(error);
  if (payload?.providerKind === "rate_limit" && payload.retryAfterMs) {
    return payload.retryAfterMs;
  }
  const baseMs = 1000;
  const maxMs = 30_000;
  return Math.min(baseMs * 2 ** attempt, maxMs);
}

export function shouldRetryBrowseSearch(
  failureCount: number,
  error: unknown
): boolean {
  const payload = parseProviderSearchErrorPayload(error);
  if (!payload) {
    return failureCount < 2;
  }
  if (payload.providerKind === "auth") {
    return false;
  }
  if (payload.providerKind === "rate_limit") {
    return false;
  }
  if (payload.providerKind === "parse") {
    return false;
  }
  if (payload.providerKind === "network") {
    return failureCount < 2;
  }
  return false;
}
