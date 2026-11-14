import { describe, expect, it } from "vitest";

import {
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  CSS_CLASS,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
} from "../../src/config/constants";
import { RDW_PAGE_ROOT_ID } from "../../src/pages/constants";
import {
  CLASS_THUMB_CHECK,
  CLASS_THUMB_SELECTED,
} from "../../src/features/favorites-bulk";
import { SEARCH_TOOLS_AI_ROW_BODY_CLASS } from "../../src/features/search-tools";
import { POST_ACTIONS_ID } from "../../src/features/types";
import {
  getSiteSkinCss,
  RDW_POST_PANEL_MOUNTED_CLASS,
  SITE_SKIN_CSS,
} from "../../src/skin/site-skin";
import { SITE_SELECTORS } from "../../src/site/selectors";
import { LIGHT_PALETTE, TOKEN_VAR } from "../../src/ui/tokens";

const FAV_BULK_ROOT_ID = "rdw-favorites-bulk";
const FAV_BULK_BAR_CLASS = "rdw-favorites-bulk-bar";
const FAV_BULK_SELECTING_BODY_CLASS = "rdw-f-favorites-bulk-selecting";

const HEX_IN_RULES = /#[0-9a-fA-F]{3,8}\b/;
const COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g;
const SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
const SEARCH_TOOLS_RESET_CLASS = "rdw-search-tools-reset";
/** Only unscoped selector allowed: script page host on Site default/dark. */
const UNSCOPED_PAGE_ROOT = `#${RDW_PAGE_ROOT_ID}`;
/**
 * Own scrollable UI (E HANDOFF) — must work on site/site-dark without html.rdw-skin.
 * Keep in sync with site-skin scrollbar block.
 */
const UNSCOPED_SCROLLBAR_SELECTORS = [
  `#${POST_ACTIONS_ID}`,
  ".rdw-select__list",
  ".rdw-ac__list",
  ".rdw-dialog",
  ".rdw-playlist-menu",
] as const;
/** Theme-attr rules for Site / Dark panel chrome (A→E HANDOFF). */
const THEME_ATTR_PREFIX = `html[${RDW_THEME_ATTR}=`;
const WHERE_NOT_OUR_CONTROL = `:where(:not([class*="rdw-"]):not(#${SEARCH_TOOLS_ROOT_ID} *))`;

function isAllowedUnscopedPart(part: string): boolean {
  if (part === UNSCOPED_PAGE_ROOT) {
    return true;
  }
  if ((UNSCOPED_SCROLLBAR_SELECTORS as readonly string[]).includes(part)) {
    return true;
  }
  // Post panel chrome for all themes (incl. site without rdw-skin).
  if (part.startsWith(`#${POST_ACTIONS_ID}`)) {
    return true;
  }
  // html[data-rdw-theme="site|site-dark|dark"] …
  if (part.startsWith(THEME_ATTR_PREFIX)) {
    return true;
  }
  return false;
}

const KEY_SELECTORS = [
  `#site-title`,
  `ul#navbar`,
  `ul#subnavbar`,
  `div.sidebar`,
  `div.tag-search`,
  `ul#tag-sidebar`,
  `.tag-count`,
  `.tag-type-artist`,
  `.tag-type-character`,
  `.tag-type-copyright`,
  `.tag-type-metadata`,
  `.awesomplete`,
  `div.image-list`,
  `img.preview`,
  `.webm-thumb`,
  `img.has-children`,
  `img.has-parent`,
  `img.pending`,
  `img.flagged`,
  `div#paginator`,
  `.pagination`,
  `.manual-page-chooser`,
  `div.status-notice`,
  `div.notice`,
  `div.has-mail`,
  `div.blocked`,
  `div.quote`,
  `img#image`,
  `div#note-container`,
  `div#forum`,
  `ul.flat-list`,
  `div.link-list`,
  `span.thumb > a[onclick]`,
] as const;

function stripComments(css: string): string {
  return css.replace(COMMENT_BLOCK, "");
}

function ruleSelectors(css: string): string[] {
  const bare = stripComments(css);
  const selectors: string[] = [];
  for (const chunk of bare.split("}")) {
    const open = chunk.indexOf("{");
    if (open === -1) {
      continue;
    }
    const selector = chunk.slice(0, open).trim();
    if (selector.length > 0) {
      selectors.push(selector);
    }
  }
  return selectors;
}

describe("site-skin CSS export", () => {
  it("exports SITE_SKIN_CSS and getSiteSkinCss identically", () => {
    expect(SITE_SKIN_CSS.length).toBeGreaterThan(0);
    expect(getSiteSkinCss()).toBe(SITE_SKIN_CSS);
  });

  it("scopes every rule under html.rdw-skin except page-root, scrollbars, panel chrome", () => {
    const scope = `html.${RDW_SKIN_CLASS}`;
    const selectors = ruleSelectors(SITE_SKIN_CSS);
    expect(selectors.length).toBeGreaterThan(20);
    for (const selector of selectors) {
      for (const part of selector.split(",")) {
        const trimmed = part.trim();
        if (isAllowedUnscopedPart(trimmed)) {
          continue;
        }
        expect(trimmed.startsWith(scope)).toBe(true);
      }
    }
  });

  it("has no hardcoded hex outside comments", () => {
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(HEX_IN_RULES);
  });

  it("does not override thumb cell width/height 200", () => {
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(/\.thumb\b[^}]*\b(?:width|height)\s*:\s*200/i);
    expect(bare).not.toMatch(/\b(?:width|height)\s*:\s*200px\b/i);
  });

  it("includes key site selectors from the mock/spec", () => {
    for (const selector of KEY_SELECTORS) {
      expect(SITE_SKIN_CSS).toContain(selector);
    }
  });

  it("uses design tokens for colors and dark theme attribute", () => {
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.bg})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.text})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.accent})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.font})`);
    expect(SITE_SKIN_CSS).toContain(
      `html.${RDW_SKIN_CLASS}[${RDW_THEME_ATTR}="dark"]`,
    );
  });

  it("sets sidebar to 228px and grid gap to 4px on both axes", () => {
    expect(SITE_SKIN_CSS).toContain("width: 228px");
    expect(SITE_SKIN_CSS).toContain("min-width: 228px");
    expect(SITE_SKIN_CSS).toContain("max-width: 228px");
    expect(SITE_SKIN_CSS).toMatch(
      /div\.image-list\s*\{[^}]*column-gap:\s*4px/s,
    );
    expect(SITE_SKIN_CSS).toMatch(/div\.image-list\s*\{[^}]*row-gap:\s*4px/s);
  });

  it("removes native chrome images and thick blue webm border", () => {
    expect(SITE_SKIN_CSS).toContain("background-image: none");
    expect(SITE_SKIN_CSS).toMatch(
      /\.webm-thumb\s*\{[^}]*border:\s*1px solid var\(--rdw-accent\)/s,
    );
    expect(SITE_SKIN_CSS).toContain(".awesomplete > ul:before");
    expect(SITE_SKIN_CSS).toContain("display: none");
  });

  it("uses light page bg from mock-site-skin .new, not the old green", () => {
    expect(LIGHT_PALETTE.bg).toBe("#f3f5f7");
    expect(LIGHT_PALETTE.bg).not.toBe("#aae5a4");
  });

  it("colors the last tag-sidebar link by type; mutes the others", () => {
    expect(SITE_SKIN_CSS).toContain(
      'ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type)',
    );
    expect(SITE_SKIN_CSS).toContain(
      "ul#tag-sidebar > li.tag-type-artist > a:last-of-type",
    );
    expect(SITE_SKIN_CSS).not.toContain("a:nth-of-type(-n+3)");
  });

  it("hides the standalone Tags heading above the tag list card", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /div\.sidebar\s*>\s*h5\s*\{[^}]*display:\s*none/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /div\.tag-search\s*\+\s*h5\s*\{[^}]*display:\s*none/s,
    );
    expect(SITE_SKIN_CSS).toContain(SITE_SELECTORS.tagsHeadingAfterSearchTools);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${SITE_SELECTORS.tagsHeadingAfterSearchTools.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\s*\\{[^}]*display:\\s*none`,
        "s",
      ),
    );
  });

  it("hides the native Filter AI posts row only when AI posts row is rendered (F HANDOFF)", () => {
    expect(SEARCH_TOOLS_AI_ROW_BODY_CLASS).toBe("rdw-search-tools-ai-posts");
    expect(SITE_SKIN_CSS).toContain(SITE_SELECTORS.filterAiRow);
    expect(SITE_SKIN_CSS).toContain("#chkFilterAI");
    expect(SITE_SKIN_CSS).toContain(`body.${SEARCH_TOOLS_AI_ROW_BODY_CLASS}`);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `body\\.${SEARCH_TOOLS_AI_ROW_BODY_CLASS}\\s+${SITE_SELECTORS.filterAiRow.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\s*\\{[^}]*display:\\s*none`,
        "s",
      ),
    );
    const bare = stripComments(SITE_SKIN_CSS);
    // Old CSS hid Filter AI unconditionally under html.rdw-skin — must be gated.
    expect(bare).not.toMatch(
      new RegExp(
        `html\\.${RDW_SKIN_CLASS}\\s+${SITE_SELECTORS.filterAiRow.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\s*\\{[^}]*display:\\s*none`,
        "s",
      ),
    );
    expect(bare).not.toMatch(
      /#chkFilterAI\s*\{[^}]*display:\s*none/s,
    );
  });

  it("lifts post-comments max-width inside the post panel column (A HANDOFF)", () => {
    expect(POST_ACTIONS_ID).toBe("rdw-post-actions");
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `body\\.${RDW_POST_PANEL_MOUNTED_CLASS}\\s+#${POST_ACTIONS_ID}\\s+#post-comments\\s*\\{[^}]*max-width:\\s*none`,
        "s",
      ),
    );
    const bare = stripComments(SITE_SKIN_CSS);
    // Must be gated on panel mount + host — not a global #post-comments override.
    expect(bare).not.toMatch(
      /html\.rdw-skin\s+(?:div)?#post-comments\s*\{[^}]*max-width:\s*none/s,
    );
  });

  it("hides native stats, link-list, and iCame row when post panel is mounted (E HANDOFF)", () => {
    expect(RDW_POST_PANEL_MOUNTED_CLASS).toBe("rdw-post-panel-mounted");
    expect(SITE_SKIN_CSS).toContain(`body.${RDW_POST_PANEL_MOUNTED_CLASS}`);

    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `body\\.${RDW_POST_PANEL_MOUNTED_CLASS}\\s+div#stats\\s*\\{[^}]*display:\\s*none\\s*!important`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `body\\.${RDW_POST_PANEL_MOUNTED_CLASS}\\s+div\\.link-list\\s*\\{[^}]*display:\\s*none\\s*!important`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `body\\.${RDW_POST_PANEL_MOUNTED_CLASS}\\s+li:has\\(a\\[onclick\\^=\"iCame\\(\"\\]\\)\\s*\\{[^}]*display:\\s*none\\s*!important`,
        "s",
      ),
    );

    const bare = stripComments(SITE_SKIN_CSS);
    // Only body.rdw-post-panel-mounted — no :has(.rdw-post-panel) secondary gate.
    expect(bare).not.toContain("body:has(.rdw-post-panel)");
    // Must be gated on mount class — unconditional hide would break post pages
    // without the panel and would match old CSS that only styles link-list.
    expect(bare).not.toMatch(
      /html\.rdw-skin\s+div\.link-list\s*\{[^}]*display:\s*none/s,
    );
    expect(bare).not.toMatch(
      /html\.rdw-skin\s+div#stats\s*\{[^}]*display:\s*none/s,
    );
  });

  it("styles favorites bulk-select chrome with theme tokens (F HANDOFF)", () => {
    expect(CLASS_THUMB_SELECTED).toBe("rdw-fav-bulk-selected");
    expect(CLASS_THUMB_CHECK).toBe("rdw-fav-bulk-check");
    expect(SITE_SKIN_CSS).toContain(`span.thumb.${CLASS_THUMB_SELECTED}`);
    expect(SITE_SKIN_CSS).toContain(`span.thumb > .${CLASS_THUMB_CHECK}`);
    expect(SITE_SKIN_CSS).toContain(
      `body.${FAV_BULK_SELECTING_BODY_CLASS} span.thumb`,
    );
    expect(SITE_SKIN_CSS).toContain(`#${FAV_BULK_ROOT_ID}`);
    expect(SITE_SKIN_CSS).toContain(`.${FAV_BULK_BAR_CLASS}`);

    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `span\\.thumb\\.${CLASS_THUMB_SELECTED}\\s*\\{[^}]*outline:\\s*2px solid var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `span\\.thumb\\s*>\\s*\\.${CLASS_THUMB_CHECK}\\s*\\{[^}]*background:\\s*var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `span\\.thumb\\s*>\\s*\\.${CLASS_THUMB_CHECK}\\s*\\{[^}]*color:\\s*var\\(--rdw-surface\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `span\\.thumb\\.${CLASS_THUMB_SELECTED}\\s*>\\s*\\.${CLASS_THUMB_CHECK}\\s*\\{[^}]*display:\\s*inline-flex`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${FAV_BULK_ROOT_ID}[\\s\\S]*?color:\\s*var\\(--rdw-text\\)`,
      ),
    );

    const bare = stripComments(SITE_SKIN_CSS);
    // Badge must stay a direct child of thumb (sibling of a#p…), never a#p … .check
    expect(bare).not.toMatch(
      /a#p[^\{]*\.rdw-fav-bulk-check/,
    );
    expect(bare).not.toMatch(
      new RegExp(
        `span\\.thumb\\.${CLASS_THUMB_SELECTED}\\s*\\{[^}]*outline:[^;]*#`,
        "s",
      ),
    );
    expect(bare).not.toMatch(
      new RegExp(
        `span\\.thumb\\s*>\\s*\\.${CLASS_THUMB_CHECK}\\s*\\{[^}]*background:\\s*#`,
        "s",
      ),
    );
  });

  it("hides closed awesomplete lists instead of forcing transform:none on all ul", () => {
    expect(SITE_SKIN_CSS).toContain(
      ".awesomplete > ul:not([hidden]):not(:empty)",
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.awesomplete\s*>\s*ul\[hidden\][\s\S]*?display:\s*none\s*!important/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.awesomplete\s*>\s*ul:empty[\s\S]*?pointer-events:\s*none/,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /\.awesomplete\s*>\s*ul\s*\{[^}]*transform:\s*none/s,
    );
  });

  it("excludes search-tools root and rdw-* controls from site button/input chrome", () => {
    expect(SITE_SKIN_CSS).toContain(':not([class*="rdw-"])');
    expect(SITE_SKIN_CSS).toContain(`:not(#${SEARCH_TOOLS_ROOT_ID} *)`);
    expect(SITE_SKIN_CSS).toContain(`button${WHERE_NOT_OUR_CONTROL}`);
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /html\.rdw-skin\s+button\s*,\s*html\.rdw-skin\s+input\[type="submit"\]/s,
    );
  });

  it("wraps general button exclusions in :where so accent submit wins", () => {
    expect(SITE_SKIN_CSS).toContain(
      `input[type="submit"]${WHERE_NOT_OUR_CONTROL}`,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    // Pre-:where form inflated specificity via #rdw-search-tools and beat accent.
    expect(bare).not.toMatch(
      /input\[type="submit"\]:not\(\[class\*="rdw-"\]\):not\(#rdw-search-tools \*\)/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /div\.tag-search input\[type="submit"\][\s\S]*?background:\s*var\(--rdw-accent\)/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.manual-page-chooser\s*>\s*input\[type="submit"\][\s\S]*?background:\s*var\(--rdw-accent\)/,
    );
  });

  it("leaves the search panel Reset button to the kit", () => {
    expect(SITE_SKIN_CSS).not.toContain(SEARCH_TOOLS_RESET_CLASS);
  });

  it("styles artist Follow as secondary button on theme tokens", () => {
    expect(SITE_SKIN_CSS).toContain(`button.${CSS_CLASS.artistFollow}`);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*background:\\s*var\\(--rdw-surface\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*border:\\s*1px solid var\\(--rdw-border\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*color:\\s*var\\(--rdw-text\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toContain(
      `button.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked}`,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*background:\\s*#fff`,
        "s",
      ),
    );
  });

  it("flows tag-sidebar rows as wrapping text with count on the first line", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*display:\s*block/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /ul#tag-sidebar\s*>\s*li\s*>\s*a\s*\{[^}]*display:\s*inline/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.tag-count[\s\S]*?position:\s*absolute[\s\S]*?right:\s*0/s,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*display:\s*flex/s,
    );
    expect(bare).not.toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*flex-wrap:\s*wrap/s,
    );
  });

  it("does not paint favorites thumb background on hover", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /span\.thumb\s*>\s*a\[onclick\]:hover\s*\{[^}]*background:\s*transparent/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /span\.thumb:hover[\s\S]*?background-color:\s*transparent/s,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /span\.thumb\s*>\s*a\[onclick\]:hover\s*\{[^}]*background:\s*var\(--rdw-danger-soft\)/s,
    );
  });

  it("colors #rdw-page-root for readable script page text on site themes", () => {
    expect(SITE_SKIN_CSS).toContain(`#${RDW_PAGE_ROOT_ID}`);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${RDW_PAGE_ROOT_ID}\\s*\\{[^}]*color:\\s*var\\(${TOKEN_VAR.text.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\)`,
        "s",
      ),
    );
    const pageRootRule = ruleSelectors(SITE_SKIN_CSS).some((selector) =>
      selector.split(",").some((part) => part.trim() === UNSCOPED_PAGE_ROOT),
    );
    expect(pageRootRule).toBe(true);
  });

  it("themes own scrollable UI with thin scrollbar tokens (E HANDOFF)", () => {
    const scrollRule = new RegExp(
      `#${POST_ACTIONS_ID}[\\s\\S]*?\\.rdw-select__list[\\s\\S]*?\\.rdw-ac__list[\\s\\S]*?\\.rdw-dialog[\\s\\S]*?\\.rdw-playlist-menu\\s*\\{[^}]*scrollbar-width:\\s*thin[^}]*scrollbar-color:\\s*var\\(--rdw-border\\)\\s+var\\(--rdw-surface\\)`,
      "s",
    );
    expect(SITE_SKIN_CSS).toMatch(scrollRule);

    // Must not depend on html.rdw-skin — site/site-dark omit that class.
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      new RegExp(
        `html\\.${RDW_SKIN_CLASS}\\s+#${POST_ACTIONS_ID}\\s*\\{[^}]*scrollbar-width`,
        "s",
      ),
    );
    // Old CSS had no themed scrollbar — fail if missing thin + border/surface pair.
    expect(bare).toMatch(
      /scrollbar-color:\s*var\(--rdw-border\)\s+var\(--rdw-surface\)/,
    );
    expect(bare).not.toMatch(/scrollbar-color:\s*#fff/i);
    expect(bare).not.toMatch(/scrollbar-color:\s*white/i);

    expect(SITE_SKIN_CSS).toMatch(
      /\.awesomplete\s*>\s*ul:not\(\[hidden\]\):not\(:empty\)[\s\S]*?scrollbar-width:\s*thin/,
    );
  });

  it("themes post panel actions + tabs for all four themes (A→E HANDOFF)", () => {
    const host = `#${POST_ACTIONS_ID}`;
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-actions`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-actions-row`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-tabpanel`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-post-action`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-fav`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-post-panel-original`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-tabs`);
    expect(SITE_SKIN_CSS).toContain(`${host} .rdw-tabs__tab`);

    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${host}\\s*\\.rdw-post-panel-fav\\.rdw-btn--primary\\s*\\{[^}]*background:\\s*var\\(--rdw-accent\\)[^}]*border-color:\\s*var\\(--rdw-accent\\)[^}]*color:\\s*var\\(--rdw-surface\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${host}\\s*\\.rdw-post-panel-original\\s*\\{[^}]*width:\\s*34px[^}]*height:\\s*34px[^}]*background:\\s*var\\(--rdw-surface\\)[^}]*border:\\s*1px solid var\\(--rdw-border\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${host}\\s*\\.rdw-tabs__tab\\[aria-selected="true"\\]\\s*\\{[^}]*border-bottom-color:\\s*var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${host}\\s*\\.rdw-post-panel-post-action\\s*\\{[^}]*background:\\s*var\\(--rdw-surface\\)[^}]*border:\\s*1px solid var\\(--rdw-border\\)[^}]*color:\\s*var\\(--rdw-text\\)`,
        "s",
      ),
    );

    // Site themes (no rdw-skin): tabs force readable text + accent underline.
    const siteSel = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
    const siteDarkSel = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
    const darkSel = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_DARK}"]`;
    expect(SITE_SKIN_CSS).toContain(siteSel);
    expect(SITE_SKIN_CSS).toContain(siteDarkSel);
    // Site + Site dark share comma-grouped rules (not one block per theme).
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${siteSel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+#${POST_ACTIONS_ID}\\s*\\.rdw-tabs__tab[^{]*\\{[^}]*color:\\s*var\\(--rdw-text\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${siteDarkSel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+#${POST_ACTIONS_ID}\\s*\\.rdw-tabs__tab\\[aria-selected="true"\\][^{]*\\{[^}]*border-bottom-color:\\s*var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `${darkSel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+#${POST_ACTIONS_ID}\\s*\\.rdw-post-panel-fav\\.rdw-btn--primary\\s*\\{[^}]*color:\\s*var\\(--rdw-text\\)`,
        "s",
      ),
    );

    const bare = stripComments(SITE_SKIN_CSS);
    // Must not gate panel chrome solely under html.rdw-skin (breaks Site themes).
    expect(bare).not.toMatch(
      new RegExp(
        `html\\.${RDW_SKIN_CLASS}\\s+#${POST_ACTIONS_ID}\\s*\\.rdw-post-panel-fav\\.rdw-btn--primary\\s*\\{[^}]*background:\\s*var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(bare).not.toMatch(
      new RegExp(
        `html\\.${RDW_SKIN_CLASS}\\s+#${POST_ACTIONS_ID}\\s*\\.rdw-tabs__tab\\[aria-selected="true"\\]\\s*\\{[^}]*border-bottom-color`,
        "s",
      ),
    );
  });
});
