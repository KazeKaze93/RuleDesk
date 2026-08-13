import { describe, expect, it } from "vitest";
import { parseAutocompleteLabelCount } from "@/shared/utils/autocomplete-label-count";

describe("parseAutocompleteLabelCount", () => {
  it("parses Rule34 autocomplete label suffix", () => {
    expect(parseAutocompleteLabelCount("wlop (16)")).toBe(16);
    expect(parseAutocompleteLabelCount("hatsune_miku (39720)")).toBe(39720);
  });

  it("returns 0 when suffix is missing or invalid", () => {
    expect(parseAutocompleteLabelCount("wlop")).toBe(0);
    expect(parseAutocompleteLabelCount("hatsune miku")).toBe(0);
    expect(parseAutocompleteLabelCount("broken (abc)")).toBe(0);
  });
});
