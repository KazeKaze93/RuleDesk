import { useEffect, useState, type ClipboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import log from "electron-log/renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { ConfirmActionDialog } from "../../components/dialogs/ConfirmActionDialog";
import { SaveSettingsSchema } from "../../../shared/schemas/settings";
import { normalizeCredentialsInput } from "@shared/utils/parse-credentials";
import { useSearchStore } from "../../store/searchStore";
import { resolveErrorMessage } from "../../utils/error-message";

const RULE34_PROVIDER_LABEL = "Rule34.xxx";
const LOG_OUT_BUTTON_LABEL = "Log Out";
const LOG_OUT_DIALOG_TITLE = "Log out?";
const LOG_OUT_DIALOG_DESCRIPTION =
  "Are you sure you want to log out? You will need to enter your API credentials again.";
const LOG_OUT_CONFIRM_LABEL = "Log out";
const LOG_OUT_CANCEL_LABEL = "Cancel";
const LOG_OUT_FAILURE_MESSAGE = "Failed to log out. Please try again.";

const CredentialsFormSchema = z
  .object({
    userId: z.string(),
    apiKey: z.string(),
  })
  .superRefine((values, ctx) => {
    const payload = {
      userId: values.userId.trim() === "" ? undefined : values.userId.trim(),
      apiKey: values.apiKey.trim() === "" ? undefined : values.apiKey.trim(),
    };
    const result = SaveSettingsSchema.pick({ userId: true, apiKey: true }).safeParse(
      payload
    );
    if (result.success) {
      return;
    }
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field !== "userId" && field !== "apiKey") {
        continue;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: [field],
      });
    }
  });

type CredentialsFormValues = z.infer<typeof CredentialsFormSchema>;

interface SettingsAccountTabProps {
  userId?: string;
  apiKey: string;
  showApiKey: boolean;
  hasApiKey: boolean;
  accountStatus: "idle" | "success" | "error";
  isDevMode: boolean;
  onApiKeyChange: (value: string) => void;
  onUserIdChange?: (value: string) => void;
  onToggleApiKeyVisibility: () => void;
  onSaveApiKey: () => void;
  onResetOnboarding: () => void;
  showUserIdField?: boolean;
}

export const SettingsAccountTab = ({
  userId = "",
  apiKey,
  showApiKey,
  hasApiKey,
  accountStatus,
  isDevMode,
  onApiKeyChange,
  onUserIdChange,
  onToggleApiKeyVisibility,
  onSaveApiKey,
  onResetOnboarding,
  showUserIdField = true,
}: SettingsAccountTabProps) => {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const clearTagChips = useSearchStore((state) => state.clearTagChips);
  const resetFilters = useSearchStore((state) => state.resetFilters);
  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(CredentialsFormSchema),
    defaultValues: { userId, apiKey },
    mode: "onSubmit",
  });
  const { reset: resetCredentialsForm } = form;

  useEffect(() => {
    resetCredentialsForm({ userId, apiKey });
  }, [userId, apiKey, resetCredentialsForm]);

  const normalizedUserId = userId.trim();

  const applyParsedCredentials = (text: string): boolean => {
    const credentials = normalizeCredentialsInput({ apiKey: text, userId });
    if (!credentials.userId && !credentials.apiKey) {
      return false;
    }
    if (credentials.userId) {
      onUserIdChange?.(credentials.userId);
      form.setValue("userId", credentials.userId, { shouldValidate: true });
    }
    if (credentials.apiKey) {
      onApiKeyChange(credentials.apiKey);
      form.setValue("apiKey", credentials.apiKey, { shouldValidate: true });
    }
    return true;
  };

  const handleCredentialsPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (!applyParsedCredentials(pastedText)) {
      return;
    }
    event.preventDefault();
  };

  const handleSave = form.handleSubmit(() => {
    onSaveApiKey();
  });

  const handleLogoutConfirm = async (): Promise<void> => {
    try {
      await window.api.logout();
      clearTagChips();
      resetFilters();
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      window.location.reload();
    } catch (error: unknown) {
      log.error("[SettingsAccountTab] Failed to logout:", error);
      // ConfirmActionDialog surfaces toast.error from the thrown error.
      throw error instanceof Error
        ? error
        : new Error(resolveErrorMessage(error, LOG_OUT_FAILURE_MESSAGE));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage Rule34.xxx credentials used for authenticated requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <section className="flex flex-wrap items-center gap-2">
            <Label>API key status</Label>
            <Badge variant={hasApiKey ? "success" : "destructive"}>
              {hasApiKey ? "Configured" : "Not configured"}
            </Badge>
          </section>

          <section className="space-y-1">
            <Label>Provider</Label>
            <p className="text-sm text-foreground">{RULE34_PROVIDER_LABEL}</p>
            <p className="text-xs text-muted-foreground">
              RuleDesk uses Rule34.xxx only.
            </p>
          </section>

          <Form {...form}>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              {showUserIdField ? (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter User ID"
                          value={field.value}
                          onBlur={field.onBlur}
                          onPaste={handleCredentialsPaste}
                          onChange={(event) => {
                            const next = event.target.value;
                            field.onChange(next);
                            onUserIdChange?.(next);
                          }}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {!showUserIdField && normalizedUserId ? (
                <p className="text-xs text-muted-foreground">
                  Detected User ID:{" "}
                  <span className="font-mono text-foreground">{normalizedUserId}</span>
                </p>
              ) : null}

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API key</FormLabel>
                    <FormControl>
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="api_key=...&user_id=... or API key only"
                        value={field.value}
                        onBlur={field.onBlur}
                        onPaste={handleCredentialsPaste}
                        onChange={(event) => {
                          const next = event.target.value;
                          if (applyParsedCredentials(next)) {
                            return;
                          }
                          field.onChange(next);
                          onApiKeyChange(next);
                        }}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Tip: paste the full account page URL into either field — both User ID and API
                      Key will be filled in automatically.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <section className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onToggleApiKeyVisibility}>
                  {showApiKey ? "Hide" : "Show"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    Boolean(form.formState.errors.userId) ||
                    (!showUserIdField &&
                      normalizedUserId.length === 0 &&
                      apiKey.trim().length > 0)
                  }
                >
                  Save API Key
                </Button>
                {accountStatus === "success" ? (
                  <Badge variant="success">Saved</Badge>
                ) : null}
                {accountStatus === "error" ? (
                  <Badge variant="destructive">Save failed</Badge>
                ) : null}
              </section>
            </form>
          </Form>

          {hasApiKey ? (
            <section className="border-t pt-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setLogoutDialogOpen(true)}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {LOG_OUT_BUTTON_LABEL}
              </Button>
            </section>
          ) : null}

          {isDevMode ? (
            <section className="border-t pt-2">
              <Button type="button" variant="destructive" size="sm" onClick={onResetOnboarding}>
                Reset onboarding
              </Button>
            </section>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title={LOG_OUT_DIALOG_TITLE}
        description={LOG_OUT_DIALOG_DESCRIPTION}
        confirmLabel={LOG_OUT_CONFIRM_LABEL}
        cancelLabel={LOG_OUT_CANCEL_LABEL}
        variant="destructive"
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};
