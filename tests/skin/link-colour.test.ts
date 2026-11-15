import { describe, expect, it } from "vitest";

import { SITE_SKIN_CSS } from "../../src/skin/site-skin";

describe("site skin links", () => {
  it("gives a visited link the same colour as an unvisited one", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /a:link,\s*[^{]*a:visited\s*\{[^}]*color:\s*var\(--rdw-accent\)/,
    );
    // No rule left that greys visited links out.
    expect(SITE_SKIN_CSS).not.toMatch(/a:visited\s*\{[^}]*color:\s*var\(--rdw-muted\)/);
  });

  it("colours the Logout heading button of My Account like a link", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /h4 > button\[type="submit"\]\[style\*="color: inherit"\]\s*\{[^}]*color:\s*var\(--rdw-accent\) !important/,
    );
  });
});
