import { describe, expect, it } from "vitest";

import { AUTOCOMPLETE_FIELD_CSS } from "../../../src/ui/kit/autocomplete-field";
import { TEXT_FIELD_CSS } from "../../../src/ui/kit";

/**
 * The site styles `input[type=text]:focus` (specificity 0,2,1) with a light
 * yellow background. Kit inputs used on site pages must outrank it.
 */
describe("kit input focus colours", () => {
  it("keeps theme colours on a focused text field", () => {
    expect(TEXT_FIELD_CSS).toMatch(
      /input\.rdw-field__input\.rdw-kit-focusable:focus \{\s*background: var\(--rdw-surface\);\s*color: var\(--rdw-text\);/,
    );
  });

  it("keeps theme colours on a focused autocomplete field", () => {
    expect(AUTOCOMPLETE_FIELD_CSS).toMatch(
      /input\.rdw-ac__input\.rdw-kit-focusable:focus \{\s*background: var\(--rdw-surface\);\s*color: var\(--rdw-text\);/,
    );
  });
});
