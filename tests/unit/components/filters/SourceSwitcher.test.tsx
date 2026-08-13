// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SourceSwitcher } from "@/renderer/components/layout/filters/SourceSwitcher";

afterEach(() => {
  cleanup();
});

describe("SourceSwitcher", () => {
  it("renders All, Favorites, and Subscriptions options", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={true}
      />
    );

    expect(screen.getByRole("button", { name: /all/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /favorites/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /subscriptions/i })).toBeTruthy();
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

  it('calls onValueChange with "subscriptions" when that option is clicked', () => {
    const onValueChange = vi.fn();
    render(
      <SourceSwitcher
        value="all"
        onValueChange={onValueChange}
        hasActiveSearch={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /subscriptions/i }));

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

  it("disables Favorites and Subscriptions when hasActiveSearch is false", () => {
    render(
      <SourceSwitcher
        value="all"
        onValueChange={vi.fn()}
        hasActiveSearch={false}
      />
    );

    const all = screen.getByRole("button", { name: /all/i });
    const favorites = screen.getByRole("button", { name: /favorites/i });
    const subscriptions = screen.getByRole("button", {
      name: /subscriptions/i,
    });

    expect(all.hasAttribute("disabled")).toBe(false);
    expect(favorites.hasAttribute("disabled")).toBe(true);
    expect(subscriptions.hasAttribute("disabled")).toBe(true);
    expect(favorites.className).toContain("opacity-50");
    expect(favorites.className).toContain("cursor-not-allowed");
    expect(subscriptions.className).toContain("opacity-50");
    expect(subscriptions.className).toContain("cursor-not-allowed");
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
        .getByRole("button", { name: /subscriptions/i })
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

    for (const name of [/all/i, /favorites/i, /subscriptions/i]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("flex-1");
      expect(button.className).toContain("gap-2");
    }
  });
});
