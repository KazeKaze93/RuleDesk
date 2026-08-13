type ProviderAllowlists = {
  id: string;
  allowedDomains: readonly string[];
  cdnDomains: readonly string[];
};

/**
 * Fail-fast: video-proxy hosts must be listed for CSP too.
 * A host in cdnDomains but not allowedDomains is a developer config error.
 */
export function assertCdnDomainsAreSubsetOfAllowed(
  providers: readonly ProviderAllowlists[]
): void {
  for (const provider of providers) {
    const allowed = new Set(provider.allowedDomains);
    const extraHosts = provider.cdnDomains.filter((host) => !allowed.has(host));
    if (extraHosts.length === 0) {
      continue;
    }
    throw new Error(
      `[Providers] ${provider.id}: cdnDomains must be a subset of allowedDomains; extra: ${extraHosts.join(", ")}`
    );
  }
}
