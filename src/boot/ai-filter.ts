import {
  AI_SCOPE_COLLECTIONS,
  AI_SCOPE_FOLLOWING,
  adoptSiteAiChoice,
  alignSiteAiFilter,
  currentListScope,
  scopeOfListUrl,
  setAiHiddenIn,
  type AiScope,
} from "../features/ai-scope";
import {
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  isCollectionDetailPage,
  parseRdwHash,
} from "../pages/constants";
import { SITE_SELECTORS } from "../site/selectors";

const EVENT_CLICK = "click";
const EVENT_AUXCLICK = "auxclick";
const EVENT_HASHCHANGE = "hashchange";
const EVENT_CHANGE = "change";
/** Holds the address reloaded for the site's AI switch, so that one page is not reloaded twice. */
const RELOAD_GUARD_KEY = "ruledesk-web.ai-reload";

/** The part of the site an own page of the script belongs to, or null. */
function ownPageScope(hash: string): AiScope | null {
  const page = parseRdwHash(hash);
  if (page === null) {
    return null;
  }
  if (page === RDW_ROUTE_FOLLOWING) {
    return AI_SCOPE_FOLLOWING;
  }
  if (page === RDW_ROUTE_COLLECTIONS || isCollectionDetailPage(page)) {
    return AI_SCOPE_COLLECTIONS;
  }
  return null;
}

/** The part of the site the page being shown belongs to, or null where AI posts are not the site's to filter. */
export function currentAiScope(): AiScope | null {
  return ownPageScope(window.location.hash) ?? currentListScope();
}

/** Puts the site's switch right for the page being shown, before it asks the site for more posts. */
export function alignAiFilterForPage(): void {
  const scope = currentAiScope();
  if (scope !== null) {
    alignSiteAiFilter(scope);
  }
}

function readGuard(): string | null {
  try {
    return window.sessionStorage.getItem(RELOAD_GUARD_KEY);
  } catch {
    return null;
  }
}

function writeGuard(value: string | null): void {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
    } else {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, value);
    }
  } catch {
    // Without session storage the page is simply not reloaded twice in a row.
  }
}

/** A link about to be followed: the site's switch is put right for where it leads. */
function onLinkPress(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const link = target.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }
  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) {
    return;
  }
  const scope = scopeOfListUrl(url);
  if (scope !== null) {
    alignSiteAiFilter(scope);
  }
}

/**
 * The site's own checkbox, pressed by the user (it is on the page in the
 * site's themes): the choice is kept for the part being looked at. The site
 * writes its cookie and reloads the page itself.
 */
function onSiteSwitch(event: Event): void {
  const target = event.target;
  if (
    !event.isTrusted ||
    !(target instanceof HTMLInputElement) ||
    !target.matches(SITE_SELECTORS.filterAiCheckbox)
  ) {
    return;
  }
  const scope = currentListScope();
  if (scope !== null) {
    setAiHiddenIn(scope, target.checked);
  }
}

let bound = false;

/**
 * Keeps the site's AI switch the way the part of the site being looked at
 * wants it. Returns true when the page is being loaded again: a list already
 * given with the other setting (an address typed by hand, a tab that another
 * tab changed the switch under). The rest of the start is then skipped.
 *
 * Most of the time nothing is loaded twice: the switch is set when a link to
 * a list is pressed and when an own page of the script is opened.
 */
export function bootAiFilter(): boolean {
  adoptSiteAiChoice();
  if (!bound) {
    bound = true;
    document.addEventListener(EVENT_CLICK, onLinkPress, true);
    document.addEventListener(EVENT_AUXCLICK, onLinkPress, true);
    window.addEventListener(EVENT_HASHCHANGE, alignAiFilterForPage);
    document.addEventListener(EVENT_CHANGE, onSiteSwitch, true);
  }

  const own = ownPageScope(window.location.hash);
  if (own !== null) {
    alignSiteAiFilter(own);
    return false;
  }
  const scope = currentListScope();
  if (scope === null) {
    return false;
  }
  const here = window.location.href;
  if (!alignSiteAiFilter(scope)) {
    writeGuard(null);
    return false;
  }
  if (readGuard() === here) {
    // Reloaded once already and the site still answers the other way: leave it.
    writeGuard(null);
    return false;
  }
  writeGuard(here);
  window.location.reload();
  return true;
}
