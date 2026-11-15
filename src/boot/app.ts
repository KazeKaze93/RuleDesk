import { runFeaturesYielding, yieldToMain } from "../features/runtime";
import { startRdwPages } from "../pages/router";
import { getSiteSkinCss } from "../skin/site-skin";
import { applyAppearanceTheme } from "../skin/theme";
import { mountCommentsPage } from "../site/comments-page";
import { syncFavoritesPage } from "../site/favorites-page";
import { mountFavoritesPager } from "../site/favorites-pager";
import { mountFavoriteVideoMarks } from "../site/video-thumbs";
import { maybeResumeFavoritesSync } from "../site/favorites-sync-runner";
import { detectPageKind } from "../site/pages";
import { loadBackground } from "../storage/background-store";
import { getAppearance } from "../storage/store";
import { mountArtistSidebar } from "../ui/artists-sidebar";
import { mountCards } from "../ui/cards";

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
 * Feature + own-page mount — after first paint (body exists).
 * Modules run one-by-one with yields between them.
 */
export async function startApp(): Promise<void> {
  await syncAppearanceAfterPaint();
  await yieldToMain();

  const pageKind = detectPageKind(window.location.search);
  const search = window.location.search;

  if (pageKind === "list") {
    mountCards();
    await yieldToMain();
    mountArtistSidebar();
    await yieldToMain();
  } else if (pageKind === "post") {
    mountArtistSidebar();
    await yieldToMain();
  } else if (pageKind === "favorites") {
    syncFavoritesPage();
    mountFavoriteVideoMarks();
    mountFavoritesPager();
    await yieldToMain();
  } else {
    mountCommentsPage();
    await yieldToMain();
  }

  await runFeaturesYielding(pageKind, search);
  await yieldToMain();

  // After Feed inserts its nav item so Collections/Following sit after Feed.
  await startRdwPages();
  await yieldToMain();

  maybeResumeFavoritesSync();
}
