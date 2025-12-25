import log from "electron-log";
import type { IBooruProvider } from "./IBooruProvider";
import { Rule34Provider } from "./Rule34Provider";
import { getProvider, type ProviderId } from "../../providers";

/**
 * Provider Factory
 * 
 * Resolves Booru providers dynamically based on provider ID.
 * Uses existing provider registry from src/main/providers for consistency.
 */
export class ProviderFactory {
  /**
   * Get provider instance by ID
   * 
   * @param providerId - Provider identifier (e.g., "rule34", "gelbooru")
   * @returns Provider instance implementing IBooruProvider
   * @throws {Error} If provider ID is invalid
   */
  public getProvider(providerId: ProviderId): IBooruProvider {
    try {
      return getProvider(providerId);
    } catch (error) {
      log.error(`[ProviderFactory] Failed to resolve provider "${providerId}":`, error);
      throw new Error(`Invalid provider: ${providerId}`);
    }
  }

  /**
   * Get default provider (Rule34)
   * 
   * @returns Default provider instance
   */
  public getDefaultProvider(): IBooruProvider {
    return new Rule34Provider();
  }
}

