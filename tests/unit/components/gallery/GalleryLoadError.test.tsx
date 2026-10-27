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
    expect(alert.getAttribute("aria-live")).toBe("polite");
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
});
