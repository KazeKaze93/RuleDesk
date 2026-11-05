// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toast, log } = vi.hoisted(() => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  log: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("electron-log/renderer", () => ({ default: log }));

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("../../../../src/renderer/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
    isSaving: false,
  }),
}));

vi.mock("../../../../src/renderer/hooks/useCredentialsActions", () => ({
  useCredentialsActions: () => ({
    saveApiKey: vi.fn(),
  }),
}));

vi.mock("../../../../src/renderer/features/settings/SettingsDataTab", () => ({
  SettingsDataTab: () => null,
}));
vi.mock("../../../../src/renderer/features/settings/SettingsAccountTab", () => ({
  SettingsAccountTab: () => null,
}));
vi.mock("../../../../src/renderer/features/settings/SettingsBlacklistTab", () => ({
  SettingsBlacklistTab: () => null,
}));
vi.mock("../../../../src/renderer/features/settings/SettingsHelpTab", () => ({
  SettingsHelpTab: () => null,
}));
vi.mock("../../../../src/renderer/features/settings/SettingsSyncTab", () => ({
  SettingsSyncTab: () => null,
}));
vi.mock("../../../../src/renderer/features/settings/SettingsAppearanceTab", () => ({
  SettingsAppearanceTab: () => null,
}));

import { Settings } from "../../../../src/renderer/features/settings/Settings";

const OPEN_DOWNLOAD_FOLDER_FAILED_TOAST =
  "Could not open the download folder.";

describe("Settings open download folder", () => {
  const getDownloadFolder = vi.fn();
  const openDownloadFolder = vi.fn();
  const getSettings = vi.fn();
  const getDatabaseLocation = vi.fn();
  const getBackupSchedule = vi.fn();
  const saveDownloadFolder = vi.fn();
  const selectDownloadFolder = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getDownloadFolder.mockResolvedValue({
      path: "C:/Users/me/Downloads/BooruClient",
      configuredPath: null,
      isDefault: true,
      usingFallback: false,
    });
    openDownloadFolder.mockResolvedValue({ ok: true });
    getSettings.mockResolvedValue({});
    getDatabaseLocation.mockResolvedValue("C:\\data");
    getBackupSchedule.mockResolvedValue("never");
    saveDownloadFolder.mockResolvedValue(true);
    selectDownloadFolder.mockResolvedValue(null);

    // boundary: vitest stub of window.api surface used by Settings mount
    window.api = {
      getDownloadFolder,
      openDownloadFolder,
      getSettings,
      getDatabaseLocation,
      getBackupSchedule,
      saveDownloadFolder,
      selectDownloadFolder,
      getAppInfo: vi.fn().mockResolvedValue({ osPlatform: "win32" }),
      saveDownloadSettings: vi.fn().mockResolvedValue(true),
      saveMinimizeToTray: vi.fn().mockResolvedValue(true),
      saveShowPanicButton: vi.fn().mockResolvedValue(true),
    } as unknown as Window["api"];
  });

  it("loads the resolved path on mount and opens the folder from General", async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(getDownloadFolder).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("download-folder-path").textContent).toContain(
        "C:/Users/me/Downloads/BooruClient"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
    await waitFor(() => {
      expect(openDownloadFolder).toHaveBeenCalledTimes(1);
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts when openDownloadFolder returns an error envelope", async () => {
    openDownloadFolder.mockResolvedValue({
      ok: false,
      error: OPEN_DOWNLOAD_FOLDER_FAILED_TOAST,
    });
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open folder" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
    });
    expect(log.error).toHaveBeenCalled();
  });

  it("refreshes the path after Reset to Default", async () => {
    getDownloadFolder
      .mockResolvedValueOnce({
        path: "D:/Custom",
        configuredPath: "D:/Custom",
        isDefault: false,
        usingFallback: false,
      })
      .mockResolvedValueOnce({
        path: "C:/Users/me/Downloads/BooruClient",
        configuredPath: null,
        isDefault: true,
        usingFallback: false,
      });

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByTestId("download-folder-path").textContent).toContain(
        "D:/Custom"
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset to Default" }));
    await waitFor(() => {
      expect(saveDownloadFolder).toHaveBeenCalledWith(null);
    });
    await waitFor(() => {
      const text = screen.getByTestId("download-folder-path").textContent ?? "";
      expect(text).toContain("C:/Users/me/Downloads/BooruClient");
      expect(text).toContain("(default)");
    });
  });

  it("shows read-error text when getDownloadFolder rejects", async () => {
    getDownloadFolder.mockRejectedValue(new Error("ipc down"));
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByTestId("download-folder-path").textContent).toContain(
        "Could not read the download folder"
      );
    });
    expect(screen.getByTestId("download-folder-path").textContent).not.toContain(
      "Loading…"
    );
    expect(screen.getByTestId("download-folder-path").textContent).not.toContain(
      "(default)"
    );
    expect(log.error).toHaveBeenCalled();
  });
});
