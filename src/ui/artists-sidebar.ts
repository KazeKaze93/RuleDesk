import {
  CSS_CLASS,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_PAGE,
  SEARCH_SECTION,
  SITE_ORIGIN,
  UI_TEXT,
} from "../config/constants";
import { normalizeArtistTag } from "../search/query";
import { detectPageKind } from "../site/pages";
import { SITE_SELECTORS } from "../site/selectors";
import {
  readArtistsMirror,
  writeArtistsMirror,
} from "../storage/artists-mirror";
import {
  listArtistTags,
  reloadFromStorage,
  save,
} from "../storage/store";
import { ensureDocumentStyles } from "./cards";

function extractArtistTagFromLi(li: Element): string | null {
  const links = li.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if (node.hasAttribute("onclick")) {
      continue;
    }
    const href = node.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_PAGE) !== SEARCH_PAGE) {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_SECTION) !== SEARCH_SECTION) {
      continue;
    }
    const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
    if (tags === null) {
      continue;
    }
    return normalizeArtistTag(tags);
  }
  return null;
}

function mergeArtistTagsByTag(
  left: readonly string[],
  right: readonly string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const tag of left) {
    if (seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    merged.push(tag);
  }
  for (const tag of right) {
    if (seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    merged.push(tag);
  }
  return merged;
}

/**
 * Union of mirror + GM artists by tag.
 * Before Follow/Unfollow write so a bfcache-stale GM snapshot cannot drop
 * artists followed on another page (present only in the mirror).
 *
 * listArtistTags → reload syncs the mirror from GM; restore/merge immediately
 * so that sync cannot leave the mirror permanently wiped.
 */
function readMergedArtistTags(): string[] {
  const mirrored = readArtistsMirror();
  const fromStorage = listArtistTags();
  if (mirrored === null || mirrored.length === 0) {
    return fromStorage;
  }
  const merged = mergeArtistTagsByTag(mirrored, fromStorage);
  writeArtistsMirror(merged);
  return merged;
}

/**
 * Writes the followed list. An artist already followed keeps everything
 * stored about them (cover, post count, newest post, follow date); only a
 * new one starts as a bare entry.
 */
function persistArtistTags(tags: readonly string[]): void {
  const data = reloadFromStorage();
  const stored = new Map(data.artists.map((entry) => [entry.tag, entry]));
  const now = Date.now();
  data.artists = tags.map((tag) => stored.get(tag) ?? { tag, addedAt: now });
  save(data);
  writeArtistsMirror(tags);
}

function isFollowingResolved(tag: string): boolean {
  return readMergedArtistTags().includes(tag);
}

function followArtist(tag: string): void {
  const current = readMergedArtistTags();
  if (current.includes(tag)) {
    persistArtistTags(current);
    return;
  }
  persistArtistTags([...current, tag]);
}

function unfollowArtist(tag: string): void {
  const current = readMergedArtistTags();
  persistArtistTags(current.filter((entry) => entry !== tag));
}

function applyFollowState(button: HTMLButtonElement, following: boolean): void {
  button.setAttribute("aria-pressed", following ? "true" : "false");
  button.classList.toggle(CSS_CLASS.artistFollowMarked, following);
  const label = following ? UI_TEXT.artistFollowing : UI_TEXT.artistFollow;
  const tag = button.dataset.rdwArtistTag ?? "";
  button.setAttribute("aria-label", `${label}: ${tag}`);
  button.textContent = label;
}

function attachFollowButton(li: HTMLElement, tag: string): void {
  if (li.querySelector(SITE_SELECTORS.artistFollowButton) !== null) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = CSS_CLASS.artistFollow;
  button.dataset.rdwArtistTag = tag;
  applyFollowState(button, isFollowingResolved(tag));
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const following = button.getAttribute("aria-pressed") === "true";
    try {
      if (following) {
        unfollowArtist(tag);
        applyFollowState(button, false);
      } else {
        followArtist(tag);
        applyFollowState(button, true);
      }
    } catch {
      applyFollowState(button, isFollowingResolved(tag));
    }
  });
  li.append(button);
}

export function mountArtistSidebar(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  const kind = detectPageKind(search);
  if (kind !== "list" && kind !== "post") {
    return;
  }

  ensureDocumentStyles();
  const sidebar = root.querySelector(SITE_SELECTORS.tagSidebar);
  if (sidebar === null) {
    return;
  }

  const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
  for (const row of rows) {
    if (!(row instanceof HTMLElement)) {
      continue;
    }
    const tag = extractArtistTagFromLi(row);
    if (tag === null) {
      continue;
    }
    attachFollowButton(row, tag);
  }
}
