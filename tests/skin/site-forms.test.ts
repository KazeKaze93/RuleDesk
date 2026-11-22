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

  it("puts the recent uploads beside the upload form and hides an empty list", () => {
    expect(ruleFor(":has(#fileUpload):has(#tags) {\n  display: flex")).toContain("flex-wrap: wrap");
    expect(ruleFor("> div#bup-recent:not(:has(tr)) {")).toContain("display: none");
    expect(ruleFor("#bup-recent-rows {")).toContain("border: 1px solid var(--rdw-border)");
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

  it("lays the favorites Remove link on the preview and shows it under the pointer", () => {
    const rule = ruleFor("div.image-list > span > a[onclick] {\n    position: absolute");
    expect(rule).toContain("position-anchor: --rdw-fav-img");
    expect(rule).toContain("top: calc(anchor(top) + 6px)");
    expect(rule).toContain("opacity: 0");
    expect(ruleFor("div.image-list > span > span.thumb > a > img {\n    anchor-name")).toContain(
      "anchor-name: --rdw-img, --rdw-fav-img",
    );
    expect(SITE_SKIN_CSS).toContain("div.image-list > span:hover > a[onclick] {");
    expect(SITE_SKIN_CSS).toContain("div.image-list > span > a[onclick] {\n    display: none");
  });

  it("makes the inline-coloured notes of Wiki and Aliases readable", () => {
    expect(
      ruleFor('center > div[style*="font-size: 11px"] {'),
    ).toContain("color: var(--rdw-muted) !important");
    expect(ruleFor('div#content > div[style^="color:"] {')).toContain(
      "color: var(--rdw-muted) !important",
    );
  });

  it("puts My Account and the Help groups into cards", () => {
    const account = ruleFor("div#user-index {");
    expect(account).toContain("max-width: 640px");
    expect(account).toContain("border: 1px solid var(--rdw-border)");
    expect(ruleFor("div#user-index > h1 {")).toContain("font-size: 13px");
    expect(ruleFor("div#static-more > div > ul {")).toContain("list-style: none");
    expect(ruleFor("div#content > div#footer {")).toContain("font-size: 13px");
  });

  it("makes the favorites Remove link quiet", () => {
    expect(ruleFor("div.image-list > span > a[onclick] > b")).toContain("font-weight: normal");
  });
});
