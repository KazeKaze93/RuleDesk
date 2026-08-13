// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Image } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilterToggleGroup } from "@/renderer/components/layout/filters/FilterToggleGroup";

afterEach(() => {
  cleanup();
});

describe("FilterToggleGroup", () => {
  it("calls onValueChange with the clicked option value", () => {
    const onValueChange = vi.fn();
    render(
      <FilterToggleGroup
        value="all"
        onValueChange={onValueChange}
        options={[
          { value: "all", label: "All" },
          { value: "hide", label: "Hide" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /hide/i }));

    expect(onValueChange).toHaveBeenCalledWith("hide");
  });

  it("does not call onValueChange when the selected option is clicked again", () => {
    const onValueChange = vi.fn();
    render(
      <FilterToggleGroup
        value="all"
        onValueChange={onValueChange}
        options={[{ value: "all", label: "All" }]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /all/i }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("applies disabled attributes and Coming soon title to disabled options", () => {
    render(
      <FilterToggleGroup
        value="all"
        onValueChange={vi.fn()}
        options={[
          { value: "all", label: "All" },
          { value: "horizontal", label: "Horizontal", disabled: true },
        ]}
      />
    );

    const disabled = screen.getByRole("button", { name: /horizontal/i });
    expect(disabled.hasAttribute("disabled")).toBe(true);
    expect(disabled.getAttribute("title")).toBe("Coming soon");
    expect(disabled.className).toContain("opacity-50");
    expect(disabled.className).toContain("cursor-not-allowed");
  });

  it("does not apply disabled classes to enabled options", () => {
    render(
      <FilterToggleGroup
        value="all"
        onValueChange={vi.fn()}
        options={[{ value: "all", label: "All" }]}
      />
    );

    const enabled = screen.getByRole("button", { name: /all/i });
    expect(enabled.hasAttribute("disabled")).toBe(false);
    expect(enabled.getAttribute("title")).toBeNull();
    expect(enabled.className).not.toContain("cursor-not-allowed");
  });

  it("does not call onValueChange when a disabled option is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <FilterToggleGroup
        value="all"
        onValueChange={onValueChange}
        options={[
          { value: "all", label: "All" },
          { value: "horizontal", label: "Horizontal", disabled: true },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /horizontal/i }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders an icon when the option provides one", () => {
    render(
      <FilterToggleGroup
        value="images"
        onValueChange={vi.fn()}
        options={[
          {
            value: "images",
            label: "Images",
            icon: <Image data-testid="filter-option-icon" />,
          },
        ]}
      />
    );

    expect(screen.getByTestId("filter-option-icon")).toBeTruthy();
    expect(screen.getByRole("button", { name: /images/i })).toBeTruthy();
  });

  it("renders options without icons", () => {
    const { container } = render(
      <FilterToggleGroup
        value="all"
        onValueChange={vi.fn()}
        options={[{ value: "all", label: "All" }]}
      />
    );

    expect(screen.getByRole("button", { name: /all/i })).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
  });
});
