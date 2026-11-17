import { createContext } from "preact";

/**
 * Where the things that open over the page are drawn: a dialog, the list of a
 * select. On the site's pages they are drawn in <body>, never where the
 * component stands. The blocks the script adds there are held while the page
 * scrolls (the sidebar of Posts, the column of Favorites, the header): a held
 * block is a layer of its own and clips what does not fit, so a dialog drawn
 * inside it lies under the thumbnails that come after it, however high its
 * z-index, and a list is cut at the block's edge. The own pages live in a
 * shadow root with their own styles, and say so with this context: there
 * everything stays where it stands.
 */
export const OverlayInPlace = createContext(false);

/** Over the post panel and the pinned blocks, as the popovers are. */
export const OVERLAY_Z_INDEX = 120;
