import { Rule34Provider } from "./rule34-provider";
import { IBooruProvider } from "./types";
import {
  PROVIDER_IDS,
  isProviderId,
  type ProviderId,
  type StoredProviderId,
} from "../../shared/constants";
import { ErrorCode } from "../../shared/types/error-codes";
import { createCodedError } from "../../shared/utils/coded-error";
import { assertCdnDomainsAreSubsetOfAllowed } from "./assert-cdn-domains-subset";

// Re-export for backward compatibility
export { PROVIDER_IDS, isProviderId, type ProviderId, type StoredProviderId };
export { assertCdnDomainsAreSubsetOfAllowed } from "./assert-cdn-domains-subset";

const providers: Record<ProviderId, IBooruProvider> = {
  rule34: new Rule34Provider(),
};

const PROVIDERS = Object.values(providers);
assertCdnDomainsAreSubsetOfAllowed(PROVIDERS);

/**
 * Resolve a booru provider implementation.
 * Unknown / legacy ids (e.g. "gelbooru") throw UNSUPPORTED_PROVIDER — no silent fallback.
 */
export function getProvider(id: StoredProviderId): IBooruProvider {
  if (!isProviderId(id)) {
    throw createCodedError(
      `Unsupported provider: ${id}`,
      ErrorCode.UNSUPPORTED_PROVIDER
    );
  }
  return providers[id];
}

export function getAllProviderDomains(): string[] {
  return [...new Set(PROVIDERS.flatMap((provider) => provider.allowedDomains))];
}

export function getAllProviderCdnDomains(): string[] {
  return [...new Set(PROVIDERS.flatMap((provider) => provider.cdnDomains))];
}

export type {
  IBooruProvider,
  BooruPost,
  SearchResults,
  ProviderSettings,
} from "./types";
