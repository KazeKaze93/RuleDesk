import { describe, expect, it } from "vitest";

import { SITE_SKIN_CSS } from "../../src/skin/site-skin";

/** The block of the first rule whose selector list contains `selector`. */
function ruleFor(selector: string): string {
  const at = SITE_SKIN_CSS.indexOf(selector);
  if (at < 0) {
    throw new Error(`no rule for ${selector}`);
  }
  const open = SITE_SKIN_CSS.indexOf("{", at);
  return SITE_SKIN_CSS.slice(open, SITE_SKIN_CSS.indexOf("}", open));
}

describe("site skin: forms, tables and text columns", () => {
  it("gives the site's text fields a height that matches its buttons", () => {
    const rule = ruleFor('select:where(:not([class*="rdw-"]):not(#rdw-search-tools *)) {\n  box-sizing');
    expect(rule).toContain("min-height: 30px");
    expect(rule).toContain("padding: 4px 8px");
  });

  it("dresses the file chooser button and removes stripes from forms", () => {
    expect(SITE_SKIN_CSS).toContain("::file-selector-button {");
    expect(ruleFor("::file-selector-button {")).toContain("background: var(--rdw-surface)");
    expect(ruleFor("div#upload-form table tr:nth-child(odd)")).toContain(
      "background: transparent",
    );
    expect(SITE_SKIN_CSS).toContain("table.form tr:nth-child(odd)");
  });

  it("frames every data table the same way", () => {
    const rule = ruleFor("table.highlightable {");
    expect(rule).toContain("border: 1px solid var(--rdw-border)");
    expect(rule).toContain("border-radius: var(--rdw-radius-l)");
  });

  it("lets comment and forum text take the free width instead of 50em and 30em", () => {
    expect(ruleFor("div#comments div#comment-list > div.post > div.col2 {\n  float: none")).toContain(
      "width: auto",
    );
    expect(ruleFor("div.response-list > div.post > div.content {\n  float: none")).toContain(
      "width: auto",
    );
  });

  it("makes the favorites Remove link quiet", () => {
    expect(ruleFor("div.image-list > span > a[onclick] > b")).toContain("font-weight: normal");
  });
});
