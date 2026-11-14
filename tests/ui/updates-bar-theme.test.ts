import { describe, expect, it } from "vitest";

import { CSS_CLASS } from "../../src/config/constants";
import { playlistBarFeature } from "../../src/features/playlist-bar";
import { CARD_CSS } from "../../src/ui/document-chrome-css";

const HEX_COLOR = /#[0-9a-f]{3,8}\b/i;

function rulesFor(css: string, className: string): string[] {
  return css
    .split("}")
    .filter((rule) => (rule.split("{")[0] ?? "").includes(`.${className}`));
}

describe("collection bar theme", () => {
  it("takes every colour from theme tokens", () => {
    const css = playlistBarFeature.css ?? "";
    expect(css).not.toMatch(HEX_COLOR);
    expect(css).toContain("background: var(--rdw-surface)");
    expect(css).toContain("color: var(--rdw-text)");
  });
});

describe("updates bar theme", () => {
  it("takes every colour from theme tokens", () => {
    const rules = rulesFor(CARD_CSS, CSS_CLASS.updatesBar);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule).not.toMatch(HEX_COLOR);
    }
    expect(rules.join("\n")).toContain("background: var(--rdw-surface)");
  });
});
