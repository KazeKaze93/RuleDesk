import { Rule34Provider } from "./rule34-provider";
import { GelbooruProvider } from "./gelbooru-provider";
import { IBooruProvider } from "./types";

export const PROVIDER_IDS = ["rule34", "gelbooru"] as const;
export type ProviderId = typeof PROVIDER_IDS[number];

const providers: Record<ProviderId, IBooruProvider> = {
  "rule34": new Rule34Provider(),
  "gelbooru": new GelbooruProvider(),
};

export function getProvider(id: ProviderId): IBooruProvider {
  return providers[id];
}

export type {
  IBooruProvider,
  BooruPost,
  SearchResults,
  ProviderSettings,
} from "./types";
