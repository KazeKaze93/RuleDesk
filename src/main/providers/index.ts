import { Rule34Provider } from "./rule34-provider";
import { GelbooruProvider } from "./gelbooru-provider";
import { IBooruProvider } from "./types";

const providers: Record<string, IBooruProvider> = {
  "rule34": new Rule34Provider(),
  "gelbooru": new GelbooruProvider(),
};

export function getProvider(id: string = "rule34"): IBooruProvider {
  const provider = providers[id];
  if (!provider) {
    return providers["rule34"];
  }
  return provider;
}

export type {
  IBooruProvider,
  BooruPost,
  SearchResults,
  ProviderSettings,
} from "./types";
