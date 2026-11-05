import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import log from "electron-log/renderer";
import { FolderOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { SaveSettingsSchema } from "../../../shared/schemas/settings";
import { resolveErrorMessage } from "../../utils/error-message";

const MinimizeToTrayFormSchema = z.object({
  minimizeToTray: z.boolean(),
});

type MinimizeToTrayFormValues = z.infer<typeof MinimizeToTrayFormSchema>;

const ShowPanicButtonFormSchema = z.object({
  showPanicButton: z.boolean(),
});

type ShowPanicButtonFormValues = z.infer<typeof ShowPanicButtonFormSchema>;

const PROXY_URL_INVALID_MESSAGE = "Please enter a valid HTTP/HTTPS URL.";

const ProxyFormSchema = z.object({
  proxyUrl: z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return;
    }
    const parsed = SaveSettingsSchema.pick({ proxyUrl: true }).safeParse({
      proxyUrl: trimmed,
    });
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROXY_URL_INVALID_MESSAGE,
      });
      return;
    }
    try {
      const protocol = new URL(trimmed).protocol;
      if (protocol !== "http:" && protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: PROXY_URL_INVALID_MESSAGE,
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROXY_URL_INVALID_MESSAGE,
      });
    }
  }),
});

type ProxyFormValues = z.infer<typeof ProxyFormSchema>;

const OS_PLATFORM_DARWIN = "darwin";

const SETUP_SECTION_TITLE = "Setup";
const SETUP_SECTION_DESCRIPTION =
  "One-time preferences: sync on startup and theme.";
const GENERAL_SECTION_TITLE = "General";
const GENERAL_SECTION_DESCRIPTION = "Default download and connection preferences.";
const SHOW_PANIC_BUTTON_LABEL = "Show panic button";
const SHOW_PANIC_BUTTON_DESCRIPTION =
  "Show a floating button that instantly blurs previews (Safe Mode).";
const DOWNLOAD_FOLDER_LABEL = "Default download folder";
const DOWNLOAD_FOLDER_DEFAULT_BADGE = "(default)";
const DOWNLOAD_FOLDER_PATH_FALLBACK = "Loading…";
const CHOOSE_FOLDER_LABEL = "Choose Folder";
const RESET_FOLDER_LABEL = "Reset to Default";
const OPEN_FOLDER_LABEL = "Open folder";
const FOLDER_UPDATED_LABEL = "Updated";
const FOLDER_UPDATE_FAILED_LABEL = "Update failed";
const FOLDER_STATUS_REGION_LABEL = "Download folder update status";
const SYNC_ON_STARTUP_LABEL = "Sync on startup";
const SYNC_ON_STARTUP_DESCRIPTION =
  "Automatically run sync when the application opens.";
const THEME_LABEL = "Theme";
const THEME_SYSTEM_LABEL = "System";
const THEME_LIGHT_LABEL = "Light";
const THEME_DARK_LABEL = "Dark";
const DANGER_ZONE_TITLE = "Danger zone";
const DANGER_ZONE_DESCRIPTION_LEAD =
  "Permanently delete all local RuleDesk data stored under the";
const DANGER_ZONE_DATA_FOLDER = "RuleDesk-Data";
const DANGER_ZONE_DESCRIPTION_TAIL = "folder, then quit the app.";
const DELETE_ALL_DATA_BUTTON = "Delete all data…";
const DELETE_ALL_DATA_CONFIRM_TITLE = "Delete all local data?";
const WIPE_ACKNOWLEDGE_LABEL =
  "I understand this permanently deletes my local library, settings, and credentials.";
const WIPE_CANCEL_LABEL = "Cancel";
const WIPE_CONFIRM_LABEL = "Delete all data";
const WIPE_IN_PROGRESS_LABEL = "Deleting…";
const WIPE_FAILED_FALLBACK = "Failed to delete application data.";

type ThemePreference = "system" | "light" | "dark";

const parseThemePreference = (value: string): ThemePreference | null => {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }
  return null;
};

export interface SettingsDownloadFolderFieldsProps {
  downloadFolderPath: string | null;
  downloadFolderIsDefault: boolean;
  downloadFolderStatus: "idle" | "success" | "error";
  onSelectDownloadFolder: () => void;
  onResetDownloadFolder: () => void;
  onOpenDownloadFolder: () => void;
}

export const SettingsDownloadFolderFields = ({
  downloadFolderPath,
  downloadFolderIsDefault,
  downloadFolderStatus,
  onSelectDownloadFolder,
  onResetDownloadFolder,
  onOpenDownloadFolder,
}: SettingsDownloadFolderFieldsProps) => {
  const pathText = downloadFolderPath ?? DOWNLOAD_FOLDER_PATH_FALLBACK;
  const statusAnnouncement =
    downloadFolderStatus === "success"
      ? FOLDER_UPDATED_LABEL
      : downloadFolderStatus === "error"
        ? FOLDER_UPDATE_FAILED_LABEL
        : "";

  return (
    <section className="space-y-3" aria-labelledby="download-folder-label">
      <Label id="download-folder-label">{DOWNLOAD_FOLDER_LABEL}</Label>
      <p
        className="break-all text-sm text-muted-foreground"
        aria-live="polite"
        data-testid="download-folder-path"
      >
        <span>{pathText}</span>
        {downloadFolderIsDefault ? (
          <span className="ml-2 text-muted-foreground">
            {DOWNLOAD_FOLDER_DEFAULT_BADGE}
          </span>
        ) : null}
      </p>
      <section className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSelectDownloadFolder}
        >
          {CHOOSE_FOLDER_LABEL}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenDownloadFolder}
          aria-label={OPEN_FOLDER_LABEL}
        >
          <FolderOpen className="size-4" aria-hidden="true" />
          {OPEN_FOLDER_LABEL}
        </Button>
        {!downloadFolderIsDefault ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetDownloadFolder}
          >
            {RESET_FOLDER_LABEL}
          </Button>
        ) : null}
        <section
          className="flex items-center gap-2"
          aria-live="polite"
          aria-atomic="true"
          aria-label={FOLDER_STATUS_REGION_LABEL}
        >
          {downloadFolderStatus === "success" ? (
            <Badge variant="success">{FOLDER_UPDATED_LABEL}</Badge>
          ) : null}
          {downloadFolderStatus === "error" ? (
            <Badge variant="destructive">{FOLDER_UPDATE_FAILED_LABEL}</Badge>
          ) : null}
          <span className="sr-only">{statusAnnouncement}</span>
        </section>
      </section>
    </section>
  );
};

interface SettingsSetupSectionProps {
  autoSyncOnStartup: boolean;
  theme: ThemePreference;
  isThemeSaving: boolean;
  onAutoSyncChange: (checked: boolean) => void;
  onThemeChange: (value: ThemePreference) => void;
}

export const SettingsSetupSection = ({
  autoSyncOnStartup,
  theme,
  isThemeSaving,
  onAutoSyncChange,
  onThemeChange,
}: SettingsSetupSectionProps) => {
  const handleThemeChange = (value: string): void => {
    const next = parseThemePreference(value);
    if (next === null) {
      return;
    }
    onThemeChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{SETUP_SECTION_TITLE}</CardTitle>
        <CardDescription>{SETUP_SECTION_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="setup-auto-sync-on-startup">{SYNC_ON_STARTUP_LABEL}</Label>
            <p className="text-sm text-muted-foreground">{SYNC_ON_STARTUP_DESCRIPTION}</p>
          </section>
          <Switch
            id="setup-auto-sync-on-startup"
            checked={autoSyncOnStartup}
            onCheckedChange={onAutoSyncChange}
          />
        </section>

        <Separator />

        <section className="space-y-2">
          <Label>{THEME_LABEL}</Label>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            disabled={isThemeSaving}
            className="space-y-2"
          >
            <Label htmlFor="setup-theme-system" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="system" id="setup-theme-system" />
              {THEME_SYSTEM_LABEL}
            </Label>
            <Label htmlFor="setup-theme-light" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="light" id="setup-theme-light" />
              {THEME_LIGHT_LABEL}
            </Label>
            <Label htmlFor="setup-theme-dark" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="dark" id="setup-theme-dark" />
              {THEME_DARK_LABEL}
            </Label>
          </RadioGroup>
        </section>
      </CardContent>
    </Card>
  );
};

export const SettingsDangerZone = () => {
  const [wipeDialogOpen, setWipeDialogOpen] = useState(false);
  const [wipeAcknowledged, setWipeAcknowledged] = useState(false);
  const [wipeInProgress, setWipeInProgress] = useState(false);

  const handleWipeDialogOpenChange = (open: boolean) => {
    if (wipeInProgress) {
      return;
    }
    setWipeDialogOpen(open);
    if (!open) {
      setWipeAcknowledged(false);
    }
  };

  const handleWipeAllData = async () => {
    if (!wipeAcknowledged || wipeInProgress) {
      return;
    }
    setWipeInProgress(true);
    try {
      await window.api.wipeAllData();
      // Process exits on success; if we return, something went wrong upstream.
    } catch (error: unknown) {
      const message = resolveErrorMessage(error, WIPE_FAILED_FALLBACK);
      log.error("[Settings] wipeAllData failed:", message);
      toast.error(message);
      setWipeInProgress(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">{DANGER_ZONE_TITLE}</CardTitle>
          <CardDescription>
            {DANGER_ZONE_DESCRIPTION_LEAD}{" "}
            <span className="font-mono">{DANGER_ZONE_DATA_FOLDER}</span>{" "}
            {DANGER_ZONE_DESCRIPTION_TAIL}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This removes the database (<span className="font-mono">data.bin</span> and
            WAL/SHM), video cache, logs, backup schedule, download queue, and other Electron
            cache files inside <span className="font-mono">RuleDesk-Data</span>. Database backup
            files under <span className="font-mono">RuleDesk-Backups</span> (sibling of{" "}
            <span className="font-mono">RuleDesk-Data</span>) are not deleted. Your chosen media
            download folder outside that directory is not touched. After restart you will see
            the account sign-in screen again.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setWipeAcknowledged(false);
              setWipeDialogOpen(true);
            }}
          >
            {DELETE_ALL_DATA_BUTTON}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={wipeDialogOpen} onOpenChange={handleWipeDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{DELETE_ALL_DATA_CONFIRM_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Everything in{" "}
              <span className="font-mono">RuleDesk-Data</span> will be erased and the app will
              quit. Database backups under{" "}
              <span className="font-mono">RuleDesk-Backups</span> are not deleted.
              Reinstalling or deleting the .exe alone does not remove{" "}
              <span className="font-mono">RuleDesk-Data</span> — use this action (or delete that
              folder manually) when you want a clean wipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="flex items-start gap-3 py-2">
            <Checkbox
              id="wipe-acknowledge"
              checked={wipeAcknowledged}
              disabled={wipeInProgress}
              onCheckedChange={(checked) => {
                setWipeAcknowledged(checked === true);
              }}
            />
            <Label htmlFor="wipe-acknowledge" className="text-sm font-normal leading-snug">
              {WIPE_ACKNOWLEDGE_LABEL}
            </Label>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={wipeInProgress}>{WIPE_CANCEL_LABEL}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!wipeAcknowledged || wipeInProgress}
              onClick={() => {
                void handleWipeAllData();
              }}
            >
              {wipeInProgress ? WIPE_IN_PROGRESS_LABEL : WIPE_CONFIRM_LABEL}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface SettingsGeneralTabProps {
  downloadFolderPath: string | null;
  downloadFolderIsDefault: boolean;
  downloadFolderStatus: "idle" | "success" | "error";
  duplicateFileBehavior: "skip" | "overwrite";
  downloadFolderStructure: "flat" | "{artist_id}";
  proxyUrl: string | null;
  proxyStatus: "idle" | "success" | "error";
  minimizeToTray: boolean;
  showPanicButton: boolean;
  onSelectDownloadFolder: () => void;
  onResetDownloadFolder: () => void;
  onOpenDownloadFolder: () => void;
  onDuplicateFileBehaviorChange: (value: "skip" | "overwrite") => void;
  onDownloadFolderStructureChange: (value: "flat" | "{artist_id}") => void;
  onProxyUrlChange: (value: string) => void;
  onProxyBlur: () => void;
  onSaveProxy: () => void;
  onMinimizeToTrayChange: (checked: boolean) => void;
  onShowPanicButtonChange: (checked: boolean) => void;
}

export const SettingsGeneralTab = ({
  downloadFolderPath,
  downloadFolderIsDefault,
  downloadFolderStatus,
  duplicateFileBehavior,
  downloadFolderStructure,
  proxyUrl,
  proxyStatus,
  minimizeToTray,
  showPanicButton,
  onSelectDownloadFolder,
  onResetDownloadFolder,
  onOpenDownloadFolder,
  onDuplicateFileBehaviorChange,
  onDownloadFolderStructureChange,
  onProxyUrlChange,
  onProxyBlur,
  onSaveProxy,
  onMinimizeToTrayChange,
  onShowPanicButtonChange,
}: SettingsGeneralTabProps) => {
  const [isDarwin, setIsDarwin] = useState(false);

  const { control, reset } = useForm<MinimizeToTrayFormValues>({
    resolver: zodResolver(MinimizeToTrayFormSchema),
    defaultValues: { minimizeToTray },
  });

  const {
    control: panicControl,
    reset: resetPanicForm,
  } = useForm<ShowPanicButtonFormValues>({
    resolver: zodResolver(ShowPanicButtonFormSchema),
    defaultValues: { showPanicButton },
  });

  const proxyForm = useForm<ProxyFormValues>({
    resolver: zodResolver(ProxyFormSchema),
    defaultValues: { proxyUrl: proxyUrl ?? "" },
    mode: "onSubmit",
  });

  const { reset: resetProxyForm } = proxyForm;

  useEffect(() => {
    reset({ minimizeToTray });
  }, [minimizeToTray, reset]);

  useEffect(() => {
    resetPanicForm({ showPanicButton });
  }, [showPanicButton, resetPanicForm]);

  useEffect(() => {
    resetProxyForm({ proxyUrl: proxyUrl ?? "" });
  }, [proxyUrl, resetProxyForm]);

  useEffect(() => {
    let cancelled = false;
    window.api
      .getAppInfo()
      .then((info) => {
        if (!cancelled) {
          setIsDarwin(info.osPlatform === OS_PLATFORM_DARWIN);
        }
      })
      .catch((error: unknown) => {
        log.error("[SettingsGeneralTab] Failed to load app info for tray setting:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProxyIfValid = (then: () => void): void => {
    void proxyForm.handleSubmit(() => {
      then();
    })();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{GENERAL_SECTION_TITLE}</CardTitle>
        <CardDescription>{GENERAL_SECTION_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsDownloadFolderFields
          downloadFolderPath={downloadFolderPath}
          downloadFolderIsDefault={downloadFolderIsDefault}
          downloadFolderStatus={downloadFolderStatus}
          onSelectDownloadFolder={onSelectDownloadFolder}
          onResetDownloadFolder={onResetDownloadFolder}
          onOpenDownloadFolder={onOpenDownloadFolder}
        />

        <Separator />

        <section className="space-y-2">
          <Label htmlFor="duplicate-file-behavior">When file already exists</Label>
          <Select value={duplicateFileBehavior} onValueChange={onDuplicateFileBehaviorChange}>
            <SelectTrigger id="duplicate-file-behavior">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip (keep existing)</SelectItem>
              <SelectItem value="overwrite">Overwrite</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2">
          <Label htmlFor="download-folder-structure">Folder structure</Label>
          <Select
            value={downloadFolderStructure}
            onValueChange={onDownloadFolderStructureChange}
          >
            <SelectTrigger id="download-folder-structure">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat (single folder)</SelectItem>
              <SelectItem value="{artist_id}">By artist (subfolder)</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <Separator />

        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="minimize-to-tray">Minimize to tray on close</Label>
            <p className="text-sm text-muted-foreground">
              {isDarwin
                ? "On macOS, closing the window always hides the app (Dock convention). This option does not change quit behavior."
                : "When enabled, closing the window hides the app to the system tray. When disabled, closing the window quits the application."}
            </p>
          </section>
          <Controller
            name="minimizeToTray"
            control={control}
            render={({ field }) => (
              <Switch
                id="minimize-to-tray"
                checked={isDarwin ? true : field.value}
                disabled={isDarwin}
                onCheckedChange={(checked) => {
                  if (isDarwin) {
                    return;
                  }
                  field.onChange(checked);
                  onMinimizeToTrayChange(checked);
                }}
                aria-label={
                  isDarwin
                    ? "Minimize to tray on close (not applicable on macOS)"
                    : "Minimize to tray on close"
                }
              />
            )}
          />
        </section>

        <Separator />

        <section className="flex items-start justify-between gap-4 rounded-md border p-4">
          <section className="space-y-1">
            <Label htmlFor="show-panic-button">{SHOW_PANIC_BUTTON_LABEL}</Label>
            <p className="text-sm text-muted-foreground">{SHOW_PANIC_BUTTON_DESCRIPTION}</p>
          </section>
          <Controller
            name="showPanicButton"
            control={panicControl}
            render={({ field }) => (
              <Switch
                id="show-panic-button"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onShowPanicButtonChange(checked);
                }}
                aria-label={SHOW_PANIC_BUTTON_LABEL}
              />
            )}
          />
        </section>

        <Separator />

        <Form {...proxyForm}>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveProxyIfValid(onSaveProxy);
            }}
          >
            <FormField
              control={proxyForm.control}
              name="proxyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proxy URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://proxy.example.com:8080"
                      name={field.name}
                      ref={field.ref}
                      value={field.value}
                      onChange={(event) => {
                        const next = event.target.value;
                        field.onChange(next);
                        onProxyUrlChange(next);
                      }}
                      onBlur={() => {
                        field.onBlur();
                        saveProxyIfValid(onProxyBlur);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional HTTP/HTTPS proxy for requests and downloads.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <section className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="outline" size="sm">
                Save Proxy
              </Button>
              {proxyStatus === "success" ? <Badge variant="success">Saved</Badge> : null}
              {proxyStatus === "error" ? (
                <Badge variant="destructive">Save failed</Badge>
              ) : null}
            </section>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
