// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));
vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { SettingsDownloadFolderFields } from "../../../../src/renderer/features/settings/SettingsGeneralTab";

describe("SettingsDownloadFolderFields", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the resolved path and default badge when isDefault", () => {
    const path = String.raw`C:\Users\me\Downloads\BooruClient`;
    render(
      <SettingsDownloadFolderFields
        downloadFolderPath={path}
        downloadFolderIsDefault={true}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain(path);
    expect(pathNode.textContent).toContain("(default)");
    expect(
      screen.queryByRole("button", { name: "Reset to Default" })
    ).toBeNull();
  });

  it("hides the default badge and shows Reset for a custom folder", () => {
    const path = String.raw`D:\Media\RuleDesk`;
    render(
      <SettingsDownloadFolderFields
        downloadFolderPath={path}
        downloadFolderIsDefault={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain(path);
    expect(pathNode.textContent).not.toContain("(default)");
    expect(
      screen.getByRole("button", { name: "Reset to Default" })
    ).toBeTruthy();
  });

  it("Open folder button invokes the open handler", () => {
    const onOpen = vi.fn();
    render(
      <SettingsDownloadFolderFields
        downloadFolderPath={String.raw`C:\Downloads\BooruClient`}
        downloadFolderIsDefault={true}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={onOpen}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("announces update status via aria-live", () => {
    render(
      <SettingsDownloadFolderFields
        downloadFolderPath={String.raw`C:\Downloads\BooruClient`}
        downloadFolderIsDefault={true}
        downloadFolderStatus="success"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    expect(screen.getAllByText("Updated").length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText("Download folder update status")
    ).toBeTruthy();
  });
});
