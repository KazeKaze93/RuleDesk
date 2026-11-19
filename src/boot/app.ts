import { runFeaturesYielding, yieldToMain } from "../features/runtime";
import { log } from "../log";
import { startRdwPages } from "../pages/router";
import { getSiteSkinCss } from "../skin/site-skin";
import { applyAppearanceTheme } from "../skin/theme";
import { mountCommentsPage } from "../site/comments-page";
import { mountListPages } from "../site/list-pages";
import { mountSiteNotice } from "../site/site-notice";
import { mountUploadPage } from "../site/upload-page";
import { recordStatsPoint } from "../storage/history";
import { syncFavoritesPage } from "../site/favorites-page";
import { mountFavoritesPager } from "../site/favorites-pager";
import { mountFavoriteVideoMarks, mountGifMarks, mountVideoMarks } from "../site/video-thumbs";
import { SITE_SELECTORS } from "../site/selectors";
import { maybeResumeFavoritesSync } from "../site/favorites-sync-runner";
import { detectPageKind } from "../site/pages";
import { loadBackground } from "../storage/background-store";
import { getAppearance } from "../storage/store";
import { mountArtistSidebar } from "../ui/artists-sidebar";
import { mountCards } from "../ui/cards";
import { bootAiFilter } from "./ai-filter";

/**
 * Re-apply appearance with full store validation + async IDB background.
 * Pre-paint only had cheap appearance + base CSS (no background image).
 */
async function syncAppearanceAfterPaint(): Promise<void> {
  const appearance = getAppearance();
  const backgroundDataUrl = await loadBackground();
  applyAppearanceTheme({
    appearance,
    siteSkinCss: getSiteSkinCss(),
    ...(backgroundDataUrl !== null && backgroundDataUrl.length > 0
      ? { backgroundDataUrl }
      : {}),
  });
}

/**
 * One step of the start. A step that throws is written to the log and the
 * next ones go on: one broken part of a page used to leave the page with no
 * features, no pages of the script and no word of why (the audit of 19.11.2026).
 */
function step(name: string, run: () => void): void {
  try {
    run();
  } catch (error) {
    log.error(`start: ${name} failed`, error);
  }
}

async function stepAsync(name: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    log.error(`start: ${name} failed`, error);
  }
}

/**
 * Feature + own-page mount — after first paint (body exists).
 * Modules run one-by-one with yields between them.
 */
export async function startApp(): Promise<void> {
  await stepAsync("appearance", syncAppearanceAfterPaint);
  await yieldToMain();

  // A list given with the site's AI switch the wrong way for this part of the
  // site is loaded again; nothing else is started on the page being left.
  if (bootAiFilter()) {
    return;
  }

  const pageKind = detectPageKind(window.location.search);
  const search = window.location.search;

  step("site notice", mountSiteNotice);

  if (pageKind === "list") {
    step("gif marks", () => {
      mountGifMarks(SITE_SELECTORS.thumb);
    });
    step("video marks", () => {
      mountVideoMarks(SITE_SELECTORS.thumb);
    });
    step("cards", mountCards);
    await yieldToMain();
    step("artist sidebar", mountArtistSidebar);
    await yieldToMain();
  } else if (pageKind === "post") {
    step("artist sidebar", mountArtistSidebar);
    await yieldToMain();
  } else if (pageKind === "favorites") {
    step("favorites page", syncFavoritesPage);
    step("favorite video marks", mountFavoriteVideoMarks);
    step("gif marks", () => {
      mountGifMarks(SITE_SELECTORS.thumb);
    });
    step("favorites pager", mountFavoritesPager);
    await yieldToMain();
  } else {
    step("comments page", mountCommentsPage);
    step("list pages", mountListPages);
    step("upload page", mountUploadPage);
    await yieldToMain();
  }

  await stepAsync("features", () => runFeaturesYielding(pageKind, search));
  await yieldToMain();

  // After Feed inserts its nav item so Collections/Following sit after Feed.
  await stepAsync("own pages", startRdwPages);
  await yieldToMain();

  step("favorites sync resume", maybeResumeFavoritesSync);
  // Last and cheap: one small write on the first page of a day, none after.
  step("stats point", recordStatsPoint);
}
