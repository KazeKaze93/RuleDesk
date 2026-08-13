// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createVirtuosoGridFactories } from "@/renderer/components/gallery/virtuoso-factories";

const {
  GridContainer,
  GridItemContainer,
  MasonryItemContainer,
} = createVirtuosoGridFactories("Test");

const GRID_TEMPLATE_COLUMNS_CLASS =
  "[grid-template-columns:repeat(var(--grid-cols,auto-fill),minmax(188px,1fr))]";

afterEach(() => {
  cleanup();
});

describe("GridContainer", () => {
  it("applies grid template-column classes for grid view", () => {
    const { container } = render(<GridContainer viewType="grid" />);
    const element = container.firstElementChild;

    expect(element).not.toBeNull();
    expect(element?.className).toContain("grid");
    expect(element?.className).toContain("gap-4");
    expect(element?.className).toContain("p-4");
    expect(element?.className).toContain("pb-44");
    expect(element?.className).toContain(GRID_TEMPLATE_COLUMNS_CLASS);
    expect(element?.className).not.toContain("columns-2");
  });

  it("defaults to grid viewType", () => {
    const { container } = render(<GridContainer />);
    const element = container.firstElementChild;

    expect(element?.className).toContain("grid");
    expect(element?.className).toContain(GRID_TEMPLATE_COLUMNS_CLASS);
  });

  it("applies columns-N classes for masonry view", () => {
    const { container } = render(<GridContainer viewType="masonry" />);
    const element = container.firstElementChild;

    expect(element).not.toBeNull();
    expect(element?.className).toContain("columns-2");
    expect(element?.className).toContain("md:columns-3");
    expect(element?.className).toContain("lg:columns-4");
    expect(element?.className).toContain("xl:columns-5");
    expect(element?.className).toContain("gap-4");
    expect(element?.className).toContain("pb-44");
    expect(element?.className).not.toContain("flex-wrap");
    expect(element?.className).not.toContain(GRID_TEMPLATE_COLUMNS_CLASS);
  });
});

describe("GridItemContainer", () => {
  it("applies aspect-[2/3] for grid items", () => {
    const { container } = render(<GridItemContainer />);
    const element = container.firstElementChild;

    expect(element?.className).toContain("w-full");
    expect(element?.className).toContain("aspect-[2/3]");
  });
});

describe("MasonryItemContainer", () => {
  it("applies flex-width column classes for masonry items", () => {
    const { container } = render(<MasonryItemContainer />);
    const element = container.firstElementChild;

    expect(element?.className).toContain("flex-shrink-0");
    expect(element?.className).toContain("w-[calc(50%-0.5rem)]");
    expect(element?.className).toContain("md:w-[calc(33.333%-1rem)]");
    expect(element?.className).toContain("lg:w-[calc(25%-1rem)]");
    expect(element?.className).toContain("xl:w-[calc(20%-1rem)]");
    expect(element?.className).not.toContain("break-inside-avoid");
  });
});
