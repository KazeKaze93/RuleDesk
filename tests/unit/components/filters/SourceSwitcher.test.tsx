// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SourceSwitcher } from "@/components/layout/filters/SourceSwitcher";

afterEach(() => {
  cleanup();
});

describe("SourceSwitcher", () => {
  it("renders All, Favorites, and Since tracked options", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={true}
      />
    );

    expect(screen.getByRole("button", { name: /all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /favorites/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /since tracked/i })).toBeTruthy();
  });

  it('calls onValueChange with "favorites" when that option is clicked', () => {
    const onValueChange = vi.fn();
    render(
      <SourceSwitcher
        value="all"
        onValueChange={onValueChange}
        hasActiveSearch={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /favorites/i }));

    expect(onValueChange).toHaveBeenCalledWith("favorites");
  });

  it('calls onValueChange with "subscriptions" when Since tracked is clicked', () => {
    const onValueChange = vi.fn();
    render(
      <SourceSwitcher
        value="all"
        onValueChange={onValueChange}
        hasActiveSearch={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /since tracked/i }));

    expect(onValueChange).toHaveBeenCalledWith("subscriptions");
  });

  it("does not call onValueChange when the selected option is clicked again", () => {
    const onValueChange = vi.fn();
    render(
      <SourceSwitcher
        value="all"
        onValueChange={onValueChange}
        hasActiveSearch={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /all/i }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disables Favorites and Since tracked when hasActiveSearch is false", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={false}
      />
    );

    const all = screen.getByRole("button", { name: /all/i });
    const favorites = screen.getByRole("button", { name: /favorites/i });
    const sinceTracked = screen.getByRole("button", {
      name: /since tracked/i,
    });

    expect(all.hasAttribute("disabled")).toBe(false);
    expect(favorites.hasAttribute("disabled")).toBe(true);
    expect(sinceTracked.hasAttribute("disabled")).toBe(true);
    expect(favorites.className).toContain("opacity-50");
    expect(favorites.className).toContain("cursor-not-allowed");
    expect(sinceTracked.className).toContain("opacity-50");
    expect(sinceTracked.className).toContain("cursor-not-allowed");
  });

  it("does not call onValueChange when a disabled option is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <SourceSwitcher
        value="all"
        onValueChange={onValueChange}
        hasActiveSearch={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /favorites/i }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("enables all options when hasActiveSearch is true", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={true}
      />
    );

    expect(
      screen.getByRole("button", { name: /favorites/i }).hasAttribute("disabled")
    ).toBe(false);
    expect(
      screen
        .getByRole("button", { name: /since tracked/i })
        .hasAttribute("disabled")
    ).toBe(false);
  });

  it("applies flex-1 gap-2 on each option", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={true}
      />
    );

    for (const name of [/all/i, /favorites/i, /since tracked/i]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("flex-1");
      expect(button.className).toContain("gap-2");
    }
  });
});
