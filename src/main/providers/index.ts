import { Rule34Provider } from "./rule34-provider";
import { GelbooruProvider } from "./gelbooru-provider";
import { IBooruProvider } from "./types";
import { PROVIDER_IDS, type ProviderId } from "../../shared/constants";

// Re-export for backward compatibility
export { PROVIDER_IDS, type ProviderId };

const providers: Record<ProviderId, IBooruProvider> = {
  "rule34": new Rule34Provider(),
  "gelbooru": new GelbooruProvider(),
};

const PROVIDERS = Object.values(providers);

export function getProvider(id: ProviderId): IBooruProvider {
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
