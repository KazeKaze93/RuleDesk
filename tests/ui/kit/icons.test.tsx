import { describe, expect, it } from "vitest";

import {
  IconCheck,
  IconOriginalOrder,
  IconPencil,
  IconPlus,
  IconShuffle,
  IconTrash,
} from "../../../src/ui/kit";
import { cleanupKit, renderKit } from "../../kit/render";

describe("kit icons", () => {
  it("renders shuffle and original-order in the same stroke style as plus", () => {
    const host = renderKit(
      <div>
        <IconPlus />
        <IconCheck />
        <IconTrash />
        <IconPencil />
        <IconShuffle />
        <IconOriginalOrder />
      </div>,
    );
    try {
      const svgs = [...host.querySelectorAll("svg")];
      expect(svgs).toHaveLength(6);
      for (const svg of svgs) {
        expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
        expect(svg.getAttribute("fill")).toBe("none");
        expect(svg.getAttribute("stroke")).toBe("currentColor");
        expect(svg.getAttribute("stroke-width")).toBe("2");
      }
      const shuffle = svgs[4];
      const originalOrder = svgs[5];
      expect(shuffle?.querySelectorAll("path").length).toBeGreaterThan(0);
      expect(originalOrder?.querySelectorAll("path").length).toBeGreaterThan(0);
    } finally {
      cleanupKit(host);
    }
  });
});
