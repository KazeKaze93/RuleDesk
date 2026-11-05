// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IpcSettings } from "@shared/schemas/settings";
import { DEFAULT_IPC_SETTINGS } from "@shared/schemas/settings";

vi.mock("electron-log/renderer", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => undefined,
}));

vi.mock("@/hooks/useApplyAppearance", () => ({
  useApplyAppearance: () => undefined,
}));

vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: () => <div data-testid="main-app-shell">Main app</div>,
}));

vi.mock("@/components/onboarding/AutoBackupOptInPrompt", () => ({
  AutoBackupOptInPrompt: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/features/settings/Settings", () => ({
  Settings: () => null,
}));

vi.mock("@/features/artists/Tracked", () => ({
  Tracked: () => null,
}));

vi.mock("@/features/artists/ArtistDetails", () => ({
  ArtistDetails: () => null,
}));

vi.mock("@/components/pages/Favorites", () => ({
  Favorites: () => null,
}));

vi.mock("@/components/pages/Updates", () => ({
  Updates: () => null,
}));

vi.mock("@/components/pages/Browse", () => ({
  Browse: () => null,
}));

vi.mock("@/components/pages/PlaylistsPage", () => ({
  PlaylistsPage: () => null,
}));

vi.mock("@/components/pages/StatsPage", () => ({
  StatsPage: () => null,
}));

vi.mock("@/features/settings/SettingsAccountTab", () => ({
  SettingsAccountTab: () => <div data-testid="account-gate-form">API key form</div>,
}));

import App from "@/App";

const CONTENT_WARNING =
  "RuleDesk displays sexually explicit content from Rule34. Use only if you are an adult.";

function buildSettings(overrides: Partial<IpcSettings> = {}): IpcSettings {
  return {
    ...DEFAULT_IPC_SETTINGS,
    hasSettingsRecord: true,
    ...overrides,
  };
}

function renderApp(settings: IpcSettings) {
  const getSettings = vi.fn(async () => settings);
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      getSettings,
      resetOnboarding: vi.fn(async () => false),
      confirmLegal: vi.fn(),
    },
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    getSettings,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("App gate order after age-gate removal", () => {
  it("shows AccountGate immediately for settings without credentials, with content warning and no AgeGate", async () => {
    renderApp(
      buildSettings({
        hasApiKey: false,
        isAdultVerified: false,
        tosAcceptedAt: null,
      })
    );

    expect(
      await screen.findByRole("heading", { name: /sign in to ruledesk/i })
    ).toBeTruthy();
    expect(screen.getByText(CONTENT_WARNING)).toBeTruthy();
    expect(screen.getByTestId("account-gate-form")).toBeTruthy();
    expect(screen.queryByText(/Age Verification/i)).toBeNull();
    expect(screen.queryByLabelText(/at least 18 years old/i)).toBeNull();
    expect(screen.queryByTestId("main-app-shell")).toBeNull();
  });

  it("enters the main app when credentials exist, without AgeGate or AccountGate", async () => {
    renderApp(
      buildSettings({
        hasApiKey: true,
        userId: "12345",
        isAdultVerified: false,
        tosAcceptedAt: null,
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId("main-app-shell")).toBeTruthy();
    });
    expect(screen.queryByRole("heading", { name: /sign in to ruledesk/i })).toBeNull();
    expect(screen.queryByText(CONTENT_WARNING)).toBeNull();
    expect(screen.queryByText(/Age Verification/i)).toBeNull();
  });
});
