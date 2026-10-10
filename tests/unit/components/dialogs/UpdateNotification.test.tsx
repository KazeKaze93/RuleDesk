// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateNotification } from "@/renderer/components/dialogs/UpdateNotification";
import type { UpdateStatusCallback } from "@/shared/types/ipc-bridge";

vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("UpdateNotification", () => {
  let statusCallback: UpdateStatusCallback | null = null;
  const openReleasePage = vi.fn(async () => undefined);

  beforeEach(() => {
    statusCallback = null;
    openReleasePage.mockClear();
    Object.defineProperty(window, "api", {
      configurable: true,
      value: {
        onUpdateStatus: (callback: UpdateStatusCallback) => {
          statusCallback = callback;
          return () => {
            statusCallback = null;
          };
        },
        openReleasePage,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows version and opens the release page on available", () => {
    render(<UpdateNotification />);
    expect(screen.queryByText(/Update/i)).toBeNull();

    act(() => {
      statusCallback?.({ status: "available", version: "18.2.0" });
    });

    expect(screen.getByText("Update v18.2.0 available")).toBeTruthy();
    const openButton = screen.getByRole("button", {
      name: /Open release page for version 18\.2\.0/i,
    });
    fireEvent.click(openButton);
    expect(openReleasePage).toHaveBeenCalledWith();
  });

  it("ignores checking, not-available, and error (no phantom UI)", () => {
    render(<UpdateNotification />);

    act(() => {
      statusCallback?.({ status: "checking" });
      statusCallback?.({ status: "not-available" });
      statusCallback?.({ status: "error", message: "network down" });
      statusCallback?.({ status: "legacy-install-ready" });
    });

    expect(screen.queryByText(/Update/i)).toBeNull();
    expect(screen.queryByText(/failed/i)).toBeNull();
  });
});
