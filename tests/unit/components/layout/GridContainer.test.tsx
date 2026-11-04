// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const masonryColumnCount = vi.hoisted(() => ({ current: 3 }));

vi.mock("@/hooks/useMasonryColumnCount", () => ({
  useMasonryColumnCount: () => masonryColumnCount.current,
}));

import { createVirtuosoGridFactories } from "@/components/gallery/virtuoso-factories";

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

beforeEach(() => {
  masonryColumnCount.current = 3;
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

  it("uses a flex row of columns for masonry (no CSS columns-*)", () => {
    const { container } = render(
      <GridContainer viewType="masonry">
        <div>a</div>
      </GridContainer>
    );
    const element = container.firstElementChild;

    expect(element).not.toBeNull();
    expect(element?.className).toContain("flex");
    expect(element?.className).toContain("gap-4");
    expect(element?.className).toContain("p-4");
    expect(element?.className).toContain("pb-44");
    expect(element?.className).not.toContain("columns-2");
    expect(element?.className).not.toContain("md:columns-3");
    expect(element?.className).not.toContain("lg:columns-4");
    expect(element?.className).not.toContain("xl:columns-5");
    expect(element?.className).not.toContain(GRID_TEMPLATE_COLUMNS_CLASS);
  });

  it("round-robins seven children into three columns as [0,3,6],[1,4],[2,5]", () => {
    render(
      <GridContainer viewType="masonry" data-testid="masonry-root">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={`item-${index}`} data-testid={`item-${index}`}>
            {index}
          </div>
        ))}
      </GridContainer>
    );

    const root = screen.getByTestId("masonry-root");
    const columns = Array.from(root.children);
    expect(columns).toHaveLength(3);

    const columnTexts = columns.map((column) =>
      Array.from(column.children).map((child) => child.textContent)
    );
    expect(columnTexts).toEqual([
      ["0", "3", "6"],
      ["1", "4"],
      ["2", "5"],
    ]);

    for (let index = 0; index < 7; index += 1) {
      expect(screen.getByTestId(`item-${index}`)).toBeTruthy();
    }
  });

  it("keeps existing items in their columns when children are appended", () => {
    const { rerender } = render(
      <GridContainer viewType="masonry" data-testid="masonry-root">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={`item-${index}`} data-testid={`item-${index}`}>
            {index}
          </div>
        ))}
      </GridContainer>
    );

    let columns = Array.from(screen.getByTestId("masonry-root").children);
    expect(
      columns.map((column) =>
        Array.from(column.children).map((child) => child.getAttribute("data-testid"))
      )
    ).toEqual([["item-0"], ["item-1"], ["item-2"]]);

    rerender(
      <GridContainer viewType="masonry" data-testid="masonry-root">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`item-${index}`} data-testid={`item-${index}`}>
            {index}
          </div>
        ))}
      </GridContainer>
    );

    columns = Array.from(screen.getByTestId("masonry-root").children);
    expect(
      columns.map((column) =>
        Array.from(column.children).map((child) => child.getAttribute("data-testid"))
      )
    ).toEqual([
      ["item-0", "item-3"],
      ["item-1", "item-4"],
      ["item-2"],
    ]);
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
  it("applies width and vertical margin without break-inside-avoid", () => {
    const { container } = render(<MasonryItemContainer />);
    const element = container.firstElementChild;

    expect(element?.className).toContain("w-full");
    expect(element?.className).toContain("mb-4");
    expect(element?.className).not.toContain("break-inside-avoid");
    expect(element?.className).not.toContain("flex-shrink-0");
    expect(element?.className).not.toContain("w-[calc(");
  });
});
