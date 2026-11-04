// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();

vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { UpdatesFeedEmptyState } from "@/components/updates/UpdatesFeedEmptyState";
import { UPDATES_FEED_EMPTY_KIND } from "@/lib/updates-feed-empty";
import { TRACKED_ADD_ARTIST_DEEPLINK } from "@/lib/tracked-route";

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe("UpdatesFeedEmptyState CTAs", () => {
  it("NO_ARTISTS navigates to the Tracked add-artist deeplink", () => {
    render(<UpdatesFeedEmptyState kind={UPDATES_FEED_EMPTY_KIND.NO_ARTISTS} />);

    fireEvent.click(screen.getByRole("button", { name: "Track an artist" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith(TRACKED_ADD_ARTIST_DEEPLINK);
  });

  it("NEVER_SYNCED invokes onSyncNow from the Sync now button", () => {
    const onSyncNow = vi.fn();
    render(
      <UpdatesFeedEmptyState
        kind={UPDATES_FEED_EMPTY_KIND.NEVER_SYNCED}
        onSyncNow={onSyncNow}
      />
    );

    const button = screen.getByRole("button", { name: "Sync now" });
    expect(button.getAttribute("aria-busy")).toBe("false");
    fireEvent.click(button);

    expect(onSyncNow).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("NEVER_SYNCED disables the button and marks it busy while syncing", () => {
    const onSyncNow = vi.fn();
    render(
      <UpdatesFeedEmptyState
        kind={UPDATES_FEED_EMPTY_KIND.NEVER_SYNCED}
        onSyncNow={onSyncNow}
        isSyncing
      />
    );

    const button = screen.getByRole("button", { name: "Syncing..." });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);

    expect(onSyncNow).not.toHaveBeenCalled();
  });

  it("NO_NEW_POSTS shows no CTA buttons", () => {
    render(
      <UpdatesFeedEmptyState
        kind={UPDATES_FEED_EMPTY_KIND.NO_NEW_POSTS}
        onSyncNow={vi.fn()}
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("FILTERED keeps the clear-filter button", () => {
    const onClearFilter = vi.fn();
    render(
      <UpdatesFeedEmptyState
        kind={UPDATES_FEED_EMPTY_KIND.FILTERED}
        onClearFilter={onClearFilter}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear tag filter" }));

    expect(onClearFilter).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Sync now" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Track an artist" })).toBeNull();
  });
});
