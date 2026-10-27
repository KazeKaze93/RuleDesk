// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GalleryLoadError } from "@/components/gallery/GalleryLoadError";

afterEach(() => {
  cleanup();
});

describe("GalleryLoadError", () => {
  it("renders title, description, and retry control with alert semantics", () => {
    const onRetry = vi.fn();
    render(
      <GalleryLoadError
        title="Could not load favorites"
        description="IPC rejected"
        onRetry={onRetry}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert.hasAttribute("aria-live")).toBe(false);
    expect(screen.getByText("Could not load favorites")).toBeTruthy();
    expect(screen.getByText("IPC rejected")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("uses default copy when title and description are omitted", () => {
    render(<GalleryLoadError onRetry={vi.fn()} />);

    expect(screen.getByText("Could not load gallery")).toBeTruthy();
    expect(screen.getByText("Failed to load posts.")).toBeTruthy();
  });

  it("renders inline variant without fullscreen layout and without aria-live", () => {
    const onRetry = vi.fn();
    render(
      <GalleryLoadError
        variant="inline"
        title="Could not load more favorites"
        description="Next page failed. Showing previously loaded posts."
        onRetry={onRetry}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert.hasAttribute("aria-live")).toBe(false);
    expect(screen.getByText("Could not load more favorites")).toBeTruthy();
    expect(
      screen.getByText("Next page failed. Showing previously loaded posts.")
    ).toBeTruthy();
    expect(alert.className.includes("h-full")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
