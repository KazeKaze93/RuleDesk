import type { ClipboardEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PROVIDER_IDS, type ProviderId } from "../../../shared/constants";
import { normalizeCredentialsInput } from "../../lib/parseCredentialsFromText";
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
  const normalizedUserId = userId.trim();
  const isUserIdInvalid =
    normalizedUserId.length > 0 && !/^\d+$/.test(normalizedUserId);

  const applyParsedCredentials = (text: string): boolean => {
    const credentials = normalizeCredentialsInput({ apiKey: text, userId });
    if (!credentials.userId && !credentials.apiKey) {
      return false;
    }
    if (credentials.userId) {
      onUserIdChange?.(credentials.userId);
    }
    if (credentials.apiKey) {
      onApiKeyChange(credentials.apiKey);
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

  const handleApiKeyChange = (value: string) => {
    if (applyParsedCredentials(value)) {
      return;
    }
    onApiKeyChange(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage credentials used for authenticated provider requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <section className="flex flex-wrap items-center gap-2">
          <Label>API key status</Label>
          <Badge
            className={
              hasApiKey
                ? "border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300"
                : "border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300"
            }
          >
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

        {showUserIdField ? (
          <section className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              type="text"
              value={userId}
              onChange={(event) => onUserIdChange?.(event.target.value)}
              onPaste={handleCredentialsPaste}
              placeholder="Enter User ID"
            />
            {isUserIdInvalid ? (
              <p className="text-xs text-red-500">User ID must contain digits only.</p>
            ) : null}
          </section>
        ) : null}
        {!showUserIdField && normalizedUserId ? (
          <p className="text-xs text-muted-foreground">
            Detected User ID: <span className="font-mono text-foreground">{normalizedUserId}</span>
          </p>
        ) : null}

        <section className="space-y-2">
          <Label htmlFor="api-key">API key</Label>
          <Input
            id="api-key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => handleApiKeyChange(event.target.value)}
            onPaste={handleCredentialsPaste}
            placeholder="api_key=...&user_id=... or API key only"
          />
          <p className="text-xs text-muted-foreground">
            Tip: paste the full account page URL into either field — both User ID and API Key will be filled in automatically.
          </p>
          <section className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onToggleApiKeyVisibility}>
              {showApiKey ? "Hide" : "Show"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSaveApiKey}
              disabled={
                isUserIdInvalid ||
                (!showUserIdField && normalizedUserId.length === 0 && apiKey.trim().length > 0)
              }
            >
              Save API Key
            </Button>
            {accountStatus === "success" ? (
              <Badge className="border-green-600/30 bg-green-600/15 text-green-700 dark:text-green-300">
                Saved
              </Badge>
            ) : null}
            {accountStatus === "error" ? (
              <Badge className="border-red-600/30 bg-red-600/15 text-red-700 dark:text-red-300">
                Save failed
              </Badge>
            ) : null}
          </section>
        </section>
        {isDevMode ? (
          <section className="pt-2 border-t">
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
