import { useEffect, useRef, useState } from "react";
import log from "electron-log/renderer";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SettingsGeneralTab } from "./SettingsGeneralTab";
import { SettingsSyncTab } from "./SettingsSyncTab";
import { SettingsAppearanceTab } from "./SettingsAppearanceTab";
import { SettingsBackupTab } from "./SettingsBackupTab";
import { SettingsAccountTab } from "./SettingsAccountTab";
import { normalizeCredentialsInput } from "../../lib/parseCredentialsFromText";
import { SettingsBlacklistTab } from "./SettingsBlacklistTab";
import { useTheme } from "../../hooks/useTheme";
import type { ProviderId } from "../../../shared/constants";

const STATUS_FEEDBACK_TIMEOUT_MS = 5000;
type StatusTimerKey =
  | "backup"
  | "download-folder"
  | "restore"
  | "integrity"
  | "proxy"
  | "account";
type AutoBackupInterval = "never" | "daily" | "weekly";

export const Settings = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme, isSaving: isThemeSaving } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{ ok: boolean; details: string } | null>(null);
  const [backupStatus, setBackupStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [restoreStatus, setRestoreStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [downloadFolder, setDownloadFolder] = useState<string | null>(null);
  const [downloadFolderStatus, setDownloadFolderStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [duplicateFileBehavior, setDuplicateFileBehavior] = useState<
    "skip" | "overwrite"
  >("skip");
  const [downloadFolderStructure, setDownloadFolderStructure] = useState<
    "flat" | "{artist_id}"
  >("flat");
  const [databaseLocation, setDatabaseLocation] = useState<string>("");
  const [autoSyncOnStartup, setAutoSyncOnStartup] = useState(false);
  const [autoSyncOnArtistAdd, setAutoSyncOnArtistAdd] = useState(false);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState("0");
  const [backupRetention, setBackupRetention] = useState("5");
  const [autoBackupInterval, setAutoBackupInterval] = useState<AutoBackupInterval>("never");
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<"idle" | "success" | "error">("idle");
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [provider, setProvider] = useState<ProviderId>("rule34");
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [accountStatus, setAccountStatus] = useState<"idle" | "success" | "error">("idle");
  const statusTimersRef = useRef<Partial<Record<StatusTimerKey, number>>>({});

  const scheduleStatusReset = (key: StatusTimerKey, reset: () => void): void => {
    const existingTimer = statusTimersRef.current[key];
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }
    statusTimersRef.current[key] = window.setTimeout(() => {
      reset();
      delete statusTimersRef.current[key];
    }, STATUS_FEEDBACK_TIMEOUT_MS);
  };

  useEffect(() => {
    const timersRef = statusTimersRef.current;
    window.api.getSettings().then((s) => {
      if (s?.downloadFolder) setDownloadFolder(s.downloadFolder);
      if (s?.duplicateFileBehavior) setDuplicateFileBehavior(s.duplicateFileBehavior);
      if (s?.downloadFolderStructure) setDownloadFolderStructure(s.downloadFolderStructure);
      if (s?.autoSyncOnStartup !== undefined) {
        setAutoSyncOnStartup(s.autoSyncOnStartup);
      }
      if (s?.autoSyncOnArtistAdd !== undefined) {
        setAutoSyncOnArtistAdd(s.autoSyncOnArtistAdd);
      }
      if (s?.syncIntervalMinutes !== undefined) {
        setSyncIntervalMinutes(String(s.syncIntervalMinutes));
      }
      if (s?.backupRetention !== undefined) {
        setBackupRetention(String(s.backupRetention));
      }
      setProxyUrl(s?.proxyUrl ?? null);
      setHasApiKey(s?.hasApiKey ?? false);
      setProvider(s?.provider ?? "rule34");
      setUserId(s?.userId ?? "");
    });
    window.api.getDatabaseLocation().then((location) => {
      setDatabaseLocation(location);
    });
    window.api
      .getBackupSchedule()
      .then((interval) => {
        setAutoBackupInterval(interval);
      })
      .catch((error) => {
        log.error("[Settings] Failed to load backup schedule:", error);
      });
    return () => {
      const activeTimers = Object.values(timersRef);
      for (const timerId of activeTimers) {
        if (timerId !== undefined) {
          window.clearTimeout(timerId);
        }
      }
    };
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus("idle");

    try {
      const result = await window.api.createBackup();
      if (result.success) {
        setBackupStatus("success");
        scheduleStatusReset("backup", () => setBackupStatus("idle"));
      } else {
        setBackupStatus("error");
        scheduleStatusReset("backup", () => setBackupStatus("idle"));
      }
    } catch (error) {
      log.error("[Settings] Failed to create backup:", error);
      setBackupStatus("error");
      scheduleStatusReset("backup", () => setBackupStatus("idle"));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSelectDownloadFolder = async (): Promise<void> => {
    try {
      const path = await window.api.selectDownloadFolder();
      if (path) {
        const ok = await window.api.saveDownloadFolder(path);
        if (ok) {
          setDownloadFolder(path);
          setDownloadFolderStatus("success");
          scheduleStatusReset("download-folder", () => setDownloadFolderStatus("idle"));
        } else {
          setDownloadFolderStatus("error");
          scheduleStatusReset("download-folder", () => setDownloadFolderStatus("idle"));
        }
      }
    } catch (err) {
      log.error("[Settings] Failed to set download folder:", err);
      setDownloadFolderStatus("error");
      scheduleStatusReset("download-folder", () => setDownloadFolderStatus("idle"));
    }
  };

  const handleResetDownloadFolder = async (): Promise<void> => {
    try {
      const ok = await window.api.saveDownloadFolder(null);
      if (ok) {
        setDownloadFolder(null);
        setDownloadFolderStatus("success");
        scheduleStatusReset("download-folder", () => setDownloadFolderStatus("idle"));
      }
    } catch (err) {
      log.error("[Settings] Failed to reset download folder:", err);
      setDownloadFolderStatus("error");
      scheduleStatusReset("download-folder", () => setDownloadFolderStatus("idle"));
    }
  };

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);
    setRestoreStatus("idle");

    try {
      const result = await window.api.restoreBackup();
      if (result.success) {
        setRestoreStatus("success");
        // Main process reopens the DB; a full renderer reload clears React Query cache and remounts so every tab fetches fresh data
        window.setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setRestoreStatus("error");
        scheduleStatusReset("restore", () => setRestoreStatus("idle"));
      }
    } catch (error) {
      log.error("[Settings] Failed to restore backup:", error);
      setRestoreStatus("error");
      scheduleStatusReset("restore", () => setRestoreStatus("idle"));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleIntegrityCheck = async (): Promise<void> => {
    setIsCheckingIntegrity(true);
    setIntegrityResult(null);
    try {
      const result = await window.api.checkDatabaseIntegrity();
      setIntegrityResult(result);
      scheduleStatusReset("integrity", () => setIntegrityResult(null));
    } catch {
      setIntegrityResult({ ok: false, details: "Failed to run integrity check." });
      scheduleStatusReset("integrity", () => setIntegrityResult(null));
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const validateProxyUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSaveProxy = async (showStatus: boolean): Promise<void> => {
    const normalized = proxyUrl?.trim() ?? "";
    if (normalized.length === 0) {
      try {
        await window.api.saveSettings({ proxyUrl: null });
        setProxyUrl(null);
        setProxyError(null);
        if (showStatus) {
          setProxyStatus("success");
          scheduleStatusReset("proxy", () => setProxyStatus("idle"));
        }
      } catch (error) {
        log.error("[Settings] Failed to clear proxy URL:", error);
        if (showStatus) {
          setProxyStatus("error");
          scheduleStatusReset("proxy", () => setProxyStatus("idle"));
        }
      }
      return;
    }

    if (!validateProxyUrl(normalized)) {
      setProxyError("Please enter a valid HTTP/HTTPS URL.");
      return;
    }

    try {
      await window.api.saveSettings({ proxyUrl: normalized });
      setProxyUrl(normalized);
      setProxyError(null);
      if (showStatus) {
        setProxyStatus("success");
        scheduleStatusReset("proxy", () => setProxyStatus("idle"));
      }
    } catch (error) {
      log.error("[Settings] Failed to save proxy URL:", error);
      if (showStatus) {
        setProxyStatus("error");
        scheduleStatusReset("proxy", () => setProxyStatus("idle"));
      }
    }
  };

  const handleDuplicateFileBehaviorChange = async (
    value: "skip" | "overwrite"
  ): Promise<void> => {
    const previousValue = duplicateFileBehavior;
    setDuplicateFileBehavior(value);
    try {
      await window.api.saveDownloadSettings({ duplicateFileBehavior: value });
    } catch (error) {
      log.error("[Settings] Failed to save duplicate file behavior:", error);
      setDuplicateFileBehavior(previousValue);
    }
  };

  const handleDownloadFolderStructureChange = async (
    value: "flat" | "{artist_id}"
  ): Promise<void> => {
    const previousValue = downloadFolderStructure;
    setDownloadFolderStructure(value);
    try {
      await window.api.saveDownloadSettings({ downloadFolderStructure: value });
    } catch (error) {
      log.error("[Settings] Failed to save folder structure:", error);
      setDownloadFolderStructure(previousValue);
    }
  };

  const handleAutoSyncOnStartupChange = async (checked: boolean): Promise<void> => {
    const previousValue = autoSyncOnStartup;
    setAutoSyncOnStartup(checked);
    try {
      await window.api.saveSettings({ autoSyncOnStartup: checked });
    } catch (error) {
      log.error("[Settings] Failed to save auto sync on startup:", error);
      setAutoSyncOnStartup(previousValue);
    }
  };

  const handleAutoSyncOnArtistAddChange = async (checked: boolean): Promise<void> => {
    const previousValue = autoSyncOnArtistAdd;
    setAutoSyncOnArtistAdd(checked);
    try {
      await window.api.saveSettings({ autoSyncOnArtistAdd: checked });
    } catch (error) {
      log.error("[Settings] Failed to save auto sync on artist add:", error);
      setAutoSyncOnArtistAdd(previousValue);
    }
  };

  const handleSyncIntervalChange = async (value: string): Promise<void> => {
    const previousValue = syncIntervalMinutes;
    setSyncIntervalMinutes(value);
    try {
      await window.api.saveSettings({
        syncIntervalMinutes: Number(value),
      });
    } catch (error) {
      log.error("[Settings] Failed to save sync interval:", error);
      setSyncIntervalMinutes(previousValue);
    }
  };

  const parseBackupRetention = (value: string): number | null => {
    if (value.trim().length === 0) {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
      return null;
    }

    return parsed;
  };

  const saveBackupRetention = async (value: string): Promise<void> => {
    const parsed = parseBackupRetention(value);
    if (parsed === null) {
      return;
    }

    try {
      await window.api.saveSettings({ backupRetention: parsed });
      setBackupRetention(String(parsed));
    } catch (error) {
      log.error("[Settings] Failed to save backup retention:", error);
    }
  };

  const handleBackupRetentionChange = (value: string): void => {
    setBackupRetention(value);
    void saveBackupRetention(value);
  };

  const handleBackupRetentionBlur = (): void => {
    const parsed = parseBackupRetention(backupRetention);
    const normalized = parsed === null ? 5 : parsed;
    setBackupRetention(String(normalized));
    void saveBackupRetention(String(normalized));
  };

  const handleAutoBackupIntervalChange = async (
    value: AutoBackupInterval
  ): Promise<void> => {
    const previousValue = autoBackupInterval;
    setAutoBackupInterval(value);
    try {
      const isSaved = await window.api.setBackupSchedule(value);
      if (!isSaved) {
        setAutoBackupInterval(previousValue);
      }
    } catch (error) {
      log.error("[Settings] Failed to save auto-backup schedule:", error);
      setAutoBackupInterval(previousValue);
    }
  };

  const handleSaveApiKey = async (): Promise<void> => {
    setAccountStatus("idle");
    try {
      const normalized = normalizeCredentialsInput({
        userId,
        apiKey,
      });
      if (!normalized.apiKey) {
        setAccountStatus("error");
        scheduleStatusReset("account", () => setAccountStatus("idle"));
        return;
      }
      const saved = await window.api.saveSettings({
        userId: normalized.userId ?? userId.trim(),
        apiKey: normalized.apiKey,
      });
      if (!saved) {
        setAccountStatus("error");
        scheduleStatusReset("account", () => setAccountStatus("idle"));
        return;
      }
      setHasApiKey(true);
      setApiKey("");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      setAccountStatus("success");
      scheduleStatusReset("account", () => setAccountStatus("idle"));
    } catch (error) {
      log.error("[Settings] Failed to save API key:", error);
      setAccountStatus("error");
      scheduleStatusReset("account", () => setAccountStatus("idle"));
    }
  };

  const handleProviderSelect = (value: ProviderId): void => {
    if (value === provider) {
      return;
    }
    setPendingProvider(value);
  };

  const handleProviderChangeConfirm = async (): Promise<void> => {
    if (!pendingProvider) {
      return;
    }
    const nextProvider = pendingProvider;
    const previousProvider = provider;
    setProvider(nextProvider);
    setPendingProvider(null);
    try {
      await queryClient.invalidateQueries({
        predicate: ({ queryKey }) => {
          const root = queryKey[0];
          return (
            root === "posts" ||
            root === "search" ||
            root === "playlist-posts" ||
            root === "artists" ||
            root === "updates" ||
            root === "stats"
          );
        },
      });
      await window.api.saveSettings({ provider: nextProvider });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      setAccountStatus("success");
      scheduleStatusReset("account", () => setAccountStatus("idle"));
    } catch (error) {
      log.error("[Settings] Failed to change provider:", error);
      setProvider(previousProvider);
      setAccountStatus("error");
      scheduleStatusReset("account", () => setAccountStatus("idle"));
    }
  };

  const handleResetOnboarding = async (): Promise<void> => {
    try {
      const reset = await window.api.resetOnboarding();
      if (!reset) {
        return;
      }
      window.location.reload();
    } catch (error) {
      log.error("[Settings] Failed to reset onboarding:", error);
    }
  };

  return (
    <section className="container max-w-4xl space-y-6 py-8">
      <section>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage application preferences in focused sections.
        </p>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsGeneralTab
            downloadFolder={downloadFolder}
            downloadFolderStatus={downloadFolderStatus}
            duplicateFileBehavior={duplicateFileBehavior}
            downloadFolderStructure={downloadFolderStructure}
            proxyUrl={proxyUrl}
            proxyError={proxyError}
            proxyStatus={proxyStatus}
            onSelectDownloadFolder={() => {
              void handleSelectDownloadFolder();
            }}
            onResetDownloadFolder={() => {
              void handleResetDownloadFolder();
            }}
            onDuplicateFileBehaviorChange={(value) => {
              void handleDuplicateFileBehaviorChange(value);
            }}
            onDownloadFolderStructureChange={(value) => {
              void handleDownloadFolderStructureChange(value);
            }}
            onProxyUrlChange={(value) => {
              setProxyUrl(value.length > 0 ? value : null);
              setProxyError(null);
            }}
            onProxyBlur={() => {
              void handleSaveProxy(false);
            }}
            onSaveProxy={() => {
              void handleSaveProxy(true);
            }}
          />
        </TabsContent>

        <TabsContent value="sync">
          <SettingsSyncTab
            autoSyncOnStartup={autoSyncOnStartup}
            autoSyncOnArtistAdd={autoSyncOnArtistAdd}
            syncIntervalMinutes={syncIntervalMinutes}
            onAutoSyncChange={(checked) => {
              void handleAutoSyncOnStartupChange(checked);
            }}
            onAutoSyncOnArtistAddChange={(checked) => {
              void handleAutoSyncOnArtistAddChange(checked);
            }}
            onSyncIntervalChange={(value) => {
              void handleSyncIntervalChange(value);
            }}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <SettingsAppearanceTab
            theme={theme}
            isThemeSaving={isThemeSaving}
            onThemeChange={(value) => {
              setTheme(value);
            }}
          />
        </TabsContent>

        <TabsContent value="backup">
          <SettingsBackupTab
            databaseLocation={databaseLocation}
            isBackingUp={isBackingUp}
            isRestoring={isRestoring}
            isCheckingIntegrity={isCheckingIntegrity}
            backupStatus={backupStatus}
            restoreStatus={restoreStatus}
            integrityResult={integrityResult}
            backupRetention={backupRetention}
            autoBackupInterval={autoBackupInterval}
            onBackup={() => {
              void handleBackup();
            }}
            onRestore={() => {
              void handleRestore();
            }}
            onIntegrityCheck={() => {
              void handleIntegrityCheck();
            }}
            onBackupRetentionChange={handleBackupRetentionChange}
            onBackupRetentionBlur={handleBackupRetentionBlur}
            onAutoBackupIntervalChange={(value) => {
              void handleAutoBackupIntervalChange(value);
            }}
          />
        </TabsContent>

        <TabsContent value="account">
          <SettingsAccountTab
            provider={provider}
            pendingProvider={pendingProvider}
            userId={userId}
            apiKey={apiKey}
            showApiKey={showApiKey}
            hasApiKey={hasApiKey}
            accountStatus={accountStatus}
            isDevMode={import.meta.env.DEV}
            onApiKeyChange={setApiKey}
            onUserIdChange={setUserId}
            onToggleApiKeyVisibility={() => {
              setShowApiKey((current) => !current);
            }}
            onSaveApiKey={() => {
              void handleSaveApiKey();
            }}
            onProviderSelect={handleProviderSelect}
            onProviderChangeConfirm={() => {
              void handleProviderChangeConfirm();
            }}
            onProviderChangeCancel={() => {
              setPendingProvider(null);
            }}
            onResetOnboarding={() => {
              void handleResetOnboarding();
            }}
          />
        </TabsContent>

        <TabsContent value="blacklist">
          <SettingsBlacklistTab />
        </TabsContent>
      </Tabs>
    </section>
  );
};
