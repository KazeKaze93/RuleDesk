/**
 * Which addresses belong to the site. Addresses that come from outside the
 * script (an API answer, an imported file) are checked with this before the
 * browser is asked to load or save them.
 */

const SITE_DOMAIN = "rule34.xxx";
const HTTPS_PROTOCOL = "https:";

/** True for an `https` address on the site's domain or one of its subdomains. */
export function isSiteUrl(address: string): boolean {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return false;
  }
  return (
    url.protocol === HTTPS_PROTOCOL &&
    (url.hostname === SITE_DOMAIN || url.hostname.endsWith(`.${SITE_DOMAIN}`))
  );
}
