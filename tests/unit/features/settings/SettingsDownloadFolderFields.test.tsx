// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsDownloadFolderFields } from "../../../../src/renderer/features/settings/SettingsGeneralTab";

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

describe("SettingsDownloadFolderFields", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Loading… without a default badge before load completes", () => {
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="loading"
        downloadFolderPath={null}
        downloadFolderConfiguredPath={null}
        downloadFolderIsDefault={false}
        downloadFolderUsingFallback={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain("Loading…");
    expect(pathNode.textContent).not.toContain("(default)");
  });

  it("shows the resolved path and default badge when loaded + isDefault", () => {
    const resolvedPath = "C:/Users/me/Downloads/BooruClient";
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="loaded"
        downloadFolderPath={resolvedPath}
        downloadFolderConfiguredPath={null}
        downloadFolderIsDefault={true}
        downloadFolderUsingFallback={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain(resolvedPath);
    expect(pathNode.textContent).toContain("(default)");
    expect(
      screen.queryByRole("button", { name: "Reset to Default" })
    ).toBeNull();
  });

  it("shows read-error text without a default badge when load failed", () => {
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="error"
        downloadFolderPath={null}
        downloadFolderConfiguredPath={null}
        downloadFolderIsDefault={false}
        downloadFolderUsingFallback={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain(
      "Could not read the download folder"
    );
    expect(pathNode.textContent).not.toContain("Loading…");
    expect(pathNode.textContent).not.toContain("(default)");
  });

  it("shows a fallback warning with both paths when usingFallback", () => {
    const activePath = "C:/Users/me/Downloads/BooruClient";
    const configuredPath = "D:/Gone";
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="loaded"
        downloadFolderPath={activePath}
        downloadFolderConfiguredPath={configuredPath}
        downloadFolderIsDefault={false}
        downloadFolderUsingFallback={true}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const alert = screen.getByTestId("download-folder-fallback-alert");
    expect(alert.textContent).toContain(configuredPath);
    expect(alert.textContent).toContain(activePath);
    expect(
      screen.getByRole("button", { name: "Reset to Default" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose Folder" })).toBeTruthy();
  });

  it("hides the default badge and shows Reset for a custom folder", () => {
    const customPath = "D:/Media/RuleDesk";
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="loaded"
        downloadFolderPath={customPath}
        downloadFolderConfiguredPath={customPath}
        downloadFolderIsDefault={false}
        downloadFolderUsingFallback={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={vi.fn()}
      />
    );

    const pathNode = screen.getByTestId("download-folder-path");
    expect(pathNode.textContent).toContain(customPath);
    expect(pathNode.textContent).not.toContain("(default)");
    expect(
      screen.getByRole("button", { name: "Reset to Default" })
    ).toBeTruthy();
  });

  it("Open folder button invokes the open handler when loaded", () => {
    const onOpen = vi.fn();
    render(
      <SettingsDownloadFolderFields
        downloadFolderLoadState="loaded"
        downloadFolderPath="C:/Downloads/BooruClient"
        downloadFolderConfiguredPath={null}
        downloadFolderIsDefault={true}
        downloadFolderUsingFallback={false}
        downloadFolderStatus="idle"
        onSelectDownloadFolder={vi.fn()}
        onResetDownloadFolder={vi.fn()}
        onOpenDownloadFolder={onOpen}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
