import { useEffect, type ClipboardEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PROVIDER_IDS, type ProviderId } from "../../../shared/constants";
import { SaveSettingsSchema } from "../../../shared/schemas/settings";
import { normalizeCredentialsInput } from "@shared/utils/parse-credentials";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

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
  provider: ProviderId;
  pendingProvider: ProviderId | null;
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
  onProviderSelect: (value: ProviderId) => void;
  onProviderChangeConfirm: () => void;
  onProviderChangeCancel: () => void;
  onResetOnboarding: () => void;
  showUserIdField?: boolean;
}

export const SettingsAccountTab = ({
  provider,
  pendingProvider,
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
  onProviderSelect,
  onProviderChangeConfirm,
  onProviderChangeCancel,
  onResetOnboarding,
  showUserIdField = true,
}: SettingsAccountTabProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage credentials used for authenticated provider requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <section className="flex flex-wrap items-center gap-2">
          <Label>API key status</Label>
          <Badge variant={hasApiKey ? "success" : "destructive"}>
            {hasApiKey ? "Configured" : "Not configured"}
          </Badge>
        </section>

        <section className="space-y-2">
          <Label htmlFor="provider-select">Provider</Label>
          <Select
            value={provider}
            onValueChange={(value: ProviderId) => onProviderSelect(value)}
          >
            <SelectTrigger id="provider-select">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_IDS.map((providerId) => (
                <SelectItem key={providerId} value={providerId}>
                  {providerId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        {isDevMode ? (
          <section className="border-t pt-2">
            <Button type="button" variant="destructive" size="sm" onClick={onResetOnboarding}>
              Reset onboarding
            </Button>
          </section>
        ) : null}
      </CardContent>
      <AlertDialog open={pendingProvider !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch provider?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching provider will clear all cached data. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onProviderChangeCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onProviderChangeConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
