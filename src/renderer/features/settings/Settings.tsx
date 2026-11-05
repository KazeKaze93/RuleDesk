import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { PageHeader } from "../../components/layout/PageHeader";
import { SettingsGeneralTab, SettingsSetupSection } from "./SettingsGeneralTab";
import { SettingsSyncTab } from "./SettingsSyncTab";
import { SettingsAppearanceTab } from "./SettingsAppearanceTab";
import { SettingsDataTab } from "./SettingsDataTab";
import { SettingsAccountTab } from "./SettingsAccountTab";
import { SettingsBlacklistTab } from "./SettingsBlacklistTab";
import { SettingsHelpTab } from "./SettingsHelpTab";
import { useTheme } from "../../hooks/useTheme";
import { useCredentialsActions } from "../../hooks/useCredentialsActions";
import type { IpcSettings } from "../../../shared/schemas/settings";
import {
  SETTINGS_TAB,
  SETTINGS_TAB_QUERY_PARAM,
  parseSettingsTab,
  type SettingsTab,
} from "../../lib/settings-tab";

const SETTINGS_QUERY_KEY = ["settings"] as const;

const TAB_GENERAL_LABEL = "General";
const TAB_ACCOUNT_LABEL = "Account";
const TAB_BLACKLIST_LABEL = "Blacklist";
const TAB_DATA_LABEL = "Data";
const TAB_HELP_LABEL = "Help";
const PAGE_TITLE = "Settings";
const PAGE_DESCRIPTION = "Manage application preferences in focused sections.";
const OPEN_DOWNLOAD_FOLDER_FAILED_TOAST =
  "Could not open the download folder.";
const SETTINGS_LOG_PREFIX = "[Settings]";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseSettingsTab(searchParams.get(SETTINGS_TAB_QUERY_PARAM));

  const handleTabChange = (value: string): void => {
    const nextTab: SettingsTab = parseSettingsTab(value);
    if (nextTab === SETTINGS_TAB.GENERAL) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ [SETTINGS_TAB_QUERY_PARAM]: nextTab }, { replace: true });
  };
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
  const [downloadFolderPath, setDownloadFolderPath] = useState<string | null>(
    null
  );
  const [downloadFolderIsDefault, setDownloadFolderIsDefault] = useState(true);
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
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [showPanicButton, setShowPanicButton] = useState(false);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState("0");
  const [backupRetention, setBackupRetention] = useState("5");
  const [autoBackupInterval, setAutoBackupInterval] = useState<AutoBackupInterval>("never");
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<"idle" | "success" | "error">("idle");
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
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

  const { saveApiKey } = useCredentialsActions({
    setAccountStatus,
    requireUserId: false,
    resolveSaveUserId: ({ normalizedUserId, rawUserId }) =>
      normalizedUserId ?? rawUserId.trim(),
    onAfterSaveSuccess: () => {
      setHasApiKey(true);
      setApiKey("");
    },
    onAccountStatusSettled: () => {
      scheduleStatusReset("account", () => setAccountStatus("idle"));
    },
    logSaveFailure: "[Settings] Failed to save API key:",
  });

  const refreshDownloadFolderInfo = async (): Promise<void> => {
    try {
      const info = await window.api.getDownloadFolder();
      setDownloadFolderPath(info.path);
      setDownloadFolderIsDefault(info.isDefault);
    } catch (error: unknown) {
      log.error(`${SETTINGS_LOG_PREFIX} Failed to load download folder:`, error);
    }
  };

  useEffect(() => {
    const timersRef = statusTimersRef.current;
    void window.api
      .getSettings()
      .then((s) => {
        if (s?.duplicateFileBehavior) setDuplicateFileBehavior(s.duplicateFileBehavior);
        if (s?.downloadFolderStructure) setDownloadFolderStructure(s.downloadFolderStructure);
        if (s?.autoSyncOnStartup !== undefined) {
          setAutoSyncOnStartup(s.autoSyncOnStartup);
        }
        if (s?.autoSyncOnArtistAdd !== undefined) {
          setAutoSyncOnArtistAdd(s.autoSyncOnArtistAdd);
        }
        if (s?.minimizeToTray !== undefined) {
          setMinimizeToTray(s.minimizeToTray);
        }
        if (s?.showPanicButton !== undefined) {
          setShowPanicButton(s.showPanicButton);
        }
        if (s?.syncIntervalMinutes !== undefined) {
          setSyncIntervalMinutes(String(s.syncIntervalMinutes));
        }
        if (s?.backupRetention !== undefined) {
          setBackupRetention(String(s.backupRetention));
        }
        setProxyUrl(s?.proxyUrl ?? null);
        setHasApiKey(s?.hasApiKey ?? false);
        setUserId(s?.userId ?? "");
      })
      .catch((error: unknown) => {
        log.error(`${SETTINGS_LOG_PREFIX} Failed to load settings:`, error);
      });
    void refreshDownloadFolderInfo();
    void window.api
      .getDatabaseLocation()
      .then((location) => {
        setDatabaseLocation(location);
      })
      .catch((error: unknown) => {
        log.error(
          `${SETTINGS_LOG_PREFIX} Failed to load database location:`,
          error
        );
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
          await refreshDownloadFolderInfo();
          setDownloadFolderStatus("success");
          scheduleStatusReset("download-folder", () =>
            setDownloadFolderStatus("idle")
          );
        } else {
          setDownloadFolderStatus("error");
          scheduleStatusReset("download-folder", () =>
            setDownloadFolderStatus("idle")
          );
        }
      }
    } catch (err) {
      log.error(`${SETTINGS_LOG_PREFIX} Failed to set download folder:`, err);
      setDownloadFolderStatus("error");
      scheduleStatusReset("download-folder", () =>
        setDownloadFolderStatus("idle")
      );
    }
  };

  const handleResetDownloadFolder = async (): Promise<void> => {
    try {
      const ok = await window.api.saveDownloadFolder(null);
      if (ok) {
        await refreshDownloadFolderInfo();
        setDownloadFolderStatus("success");
        scheduleStatusReset("download-folder", () =>
          setDownloadFolderStatus("idle")
        );
      }
    } catch (err) {
      log.error(`${SETTINGS_LOG_PREFIX} Failed to reset download folder:`, err);
      setDownloadFolderStatus("error");
      scheduleStatusReset("download-folder", () =>
        setDownloadFolderStatus("idle")
      );
    }
  };

  const handleOpenDownloadFolder = async (): Promise<void> => {
    try {
      const result = await window.api.openDownloadFolder();
      if (!result.ok) {
        log.error(
          `${SETTINGS_LOG_PREFIX} openDownloadFolder failed:`,
          result.error
        );
        toast.error(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
      }
    } catch (error: unknown) {
      log.error(`${SETTINGS_LOG_PREFIX} openDownloadFolder threw:`, error);
      toast.error(OPEN_DOWNLOAD_FOLDER_FAILED_TOAST);
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
    } catch (error: unknown) {
      log.error("[Settings] Failed to run integrity check:", error);
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
      return;
    }

    try {
      await window.api.saveSettings({ proxyUrl: normalized });
      setProxyUrl(normalized);
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

  const handleMinimizeToTrayChange = async (checked: boolean): Promise<void> => {
    const previousValue = minimizeToTray;
    setMinimizeToTray(checked);
    try {
      await window.api.saveSettings({ minimizeToTray: checked });
    } catch (error) {
      log.error("[Settings] Failed to save minimize to tray:", error);
      setMinimizeToTray(previousValue);
    }
  };

  const handleShowPanicButtonChange = async (checked: boolean): Promise<void> => {
    const previousValue = showPanicButton;
    setShowPanicButton(checked);
    queryClient.setQueryData<IpcSettings>(SETTINGS_QUERY_KEY, (current) => {
      if (!current) {
        return current;
      }
      return { ...current, showPanicButton: checked };
    });
    try {
      await window.api.saveSettings({ showPanicButton: checked });
    } catch (error) {
      log.error("[Settings] Failed to save show panic button:", error);
      setShowPanicButton(previousValue);
      queryClient.setQueryData<IpcSettings>(SETTINGS_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return { ...current, showPanicButton: previousValue };
      });
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
      <PageHeader
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        icon={SettingsIcon}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value={SETTINGS_TAB.GENERAL}>{TAB_GENERAL_LABEL}</TabsTrigger>
          <TabsTrigger value={SETTINGS_TAB.DATA}>{TAB_DATA_LABEL}</TabsTrigger>
          <TabsTrigger value={SETTINGS_TAB.ACCOUNT}>{TAB_ACCOUNT_LABEL}</TabsTrigger>
          <TabsTrigger value={SETTINGS_TAB.BLACKLIST}>{TAB_BLACKLIST_LABEL}</TabsTrigger>
          <TabsTrigger value={SETTINGS_TAB.HELP}>{TAB_HELP_LABEL}</TabsTrigger>
        </TabsList>

        <TabsContent value={SETTINGS_TAB.GENERAL}>
          <div className="space-y-4">
            <SettingsSetupSection
              autoSyncOnStartup={autoSyncOnStartup}
              theme={theme}
              isThemeSaving={isThemeSaving}
              onAutoSyncChange={(checked) => {
                void handleAutoSyncOnStartupChange(checked);
              }}
              onThemeChange={(value) => {
                setTheme(value);
              }}
            />
            <SettingsGeneralTab
              downloadFolderPath={downloadFolderPath}
              downloadFolderIsDefault={downloadFolderIsDefault}
              downloadFolderStatus={downloadFolderStatus}
              duplicateFileBehavior={duplicateFileBehavior}
              downloadFolderStructure={downloadFolderStructure}
              proxyUrl={proxyUrl}
              proxyStatus={proxyStatus}
              onSelectDownloadFolder={() => {
                void handleSelectDownloadFolder();
              }}
              onResetDownloadFolder={() => {
                void handleResetDownloadFolder();
              }}
              onOpenDownloadFolder={() => {
                void handleOpenDownloadFolder();
              }}
              onDuplicateFileBehaviorChange={(value) => {
                void handleDuplicateFileBehaviorChange(value);
              }}
              onDownloadFolderStructureChange={(value) => {
                void handleDownloadFolderStructureChange(value);
              }}
              onProxyUrlChange={(value) => {
                setProxyUrl(value.length > 0 ? value : null);
              }}
              onProxyBlur={() => {
                void handleSaveProxy(false);
              }}
              onSaveProxy={() => {
                void handleSaveProxy(true);
              }}
              minimizeToTray={minimizeToTray}
              showPanicButton={showPanicButton}
              onMinimizeToTrayChange={(checked) => {
                void handleMinimizeToTrayChange(checked);
              }}
              onShowPanicButtonChange={(checked) => {
                void handleShowPanicButtonChange(checked);
              }}
            />
            <SettingsSyncTab
              autoSyncOnStartup={autoSyncOnStartup}
              autoSyncOnArtistAdd={autoSyncOnArtistAdd}
              syncIntervalMinutes={syncIntervalMinutes}
              showStartupSync={false}
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
            <SettingsAppearanceTab
              theme={theme}
              isThemeSaving={isThemeSaving}
              showTheme={false}
              onThemeChange={(value) => {
                setTheme(value);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value={SETTINGS_TAB.DATA}>
          <SettingsDataTab
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
            onRestore={handleRestore}
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

        <TabsContent value={SETTINGS_TAB.ACCOUNT}>
          <SettingsAccountTab
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
              void saveApiKey({
                userId,
                apiKey,
              });
            }}
            onResetOnboarding={() => {
              void handleResetOnboarding();
            }}
          />
        </TabsContent>

        <TabsContent value={SETTINGS_TAB.BLACKLIST}>
          <SettingsBlacklistTab />
        </TabsContent>

        <TabsContent value={SETTINGS_TAB.HELP}>
          <SettingsHelpTab />
        </TabsContent>
      </Tabs>
    </section>
  );
};
