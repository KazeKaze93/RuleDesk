import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z, ZodIssueOptionalMessage, ErrorMapCtx } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import log from "electron-log/renderer";
import { Button } from "@/components/ui/button";
import { KeyRound, User } from "lucide-react";
import { credsBaseSchema, CredsFormValues } from "@/schemas/form-schemas";
import { PROVIDER_IDS, type ProviderId } from "../../../shared/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCredentialsFromText } from "@/lib/parseCredentialsFromText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [verifyProviderId, setVerifyProviderId] = useState<ProviderId>("rule34");
  const [verificationError, setVerificationError] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CredsFormValues>({
    resolver: zodResolver(credsBaseSchema, {
      path: [],
      async: false,
      errorMap: (issue: ZodIssueOptionalMessage, ctx: ErrorMapCtx) => {
        if (issue.code === z.ZodIssueCode.too_small) {
          if (issue.path[0] === "userId") {
            return { message: "User ID is required" };
          }
          if (issue.path[0] === "apiKey") {
            return { message: "API key is required" };
          }
        }
        return { message: ctx.defaultError };
      },
    }),
  });

  // Handle paste event for auto-fill
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const credentials = parseCredentialsFromText(pastedText);
    
    if (credentials.userId || credentials.apiKey) {
      e.preventDefault();
      
      if (credentials.userId) {
        setValue("userId", credentials.userId, { shouldValidate: true });
      }
      if (credentials.apiKey) {
        setValue("apiKey", credentials.apiKey, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: CredsFormValues) => {
    try {
      setVerificationError("");
      await window.api.saveSettings(data);
      const isValid = await window.api.verifyCredentials(verifyProviderId);
      if (!isValid) {
        setVerificationError(
          "Credentials are invalid for the selected provider. Check your User ID/API key and try again."
        );
        return;
      }
      onComplete();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown save error.";
      log.error(`[Onboarding] Authorization error: ${message}`);
    }
  };

  const handleSkip = async () => {
    try {
      setVerificationError("");
      await window.api.saveSettings({
        provider: verifyProviderId,
        userId: "",
      });
      onComplete();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown save error.";
      log.error(`[Onboarding] Skip authorization error: ${message}`);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-screen bg-background text-foreground">
      <div className="p-8 space-y-6 w-full max-w-md rounded-lg border shadow-xl bg-card border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">
            Rule34 Authorization
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            API keys are required for the parser to work.
          </p>
        </div>

        <div className="p-4 space-y-2 text-sm rounded border bg-muted/40 border-border">
          <p className="font-semibold text-foreground">
            How to get keys:
          </p>
          <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Log into your account on rule34.xxx</li>
            <li>Go to My Account → Options</li>
            <li>Find the API Access section</li>
          </ol>
          <div className="pt-2 mt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Settings page address (copy):
            </span>
            <code className="block p-2 mt-1 text-xs break-all rounded cursor-text select-all bg-muted">
              https://rule34.xxx/index.php?page=account&s=options
            </code>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label
              htmlFor="user-id-input"
              className="block mb-1 text-muted-foreground"
            >
              User ID
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-id-input"
                {...register("userId", {
                  onChange: () => setVerificationError(""),
                })}
                onPaste={handlePaste}
                className="pl-9"
                placeholder="For example: 123456"
              />
            </div>
            {errors.userId && (
              <span className="text-xs text-red-500">
                {errors.userId.message}
              </span>
            )}
          </div>

          <div>
            <Label
              htmlFor="api-key-input"
              className="block mb-1 text-muted-foreground"
            >
              API Key
            </Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Optional — skip to use Browse only. API key enables Updates, Favorites, Playlists, and Artists.
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="api-key-input"
                {...register("apiKey", {
                  onChange: () => setVerificationError(""),
                })}
                type="password"
                onPaste={handlePaste}
                className="pl-9"
                placeholder="Your secret key"
              />
            </div>
            {errors.apiKey && (
              <span className="text-xs text-red-500">
                {errors.apiKey.message}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: paste the full account page URL into either field — both User ID and API Key will be filled in automatically.
          </p>

          <div>
            <Label className="block mb-1 text-muted-foreground">
              Verify for
            </Label>
            <Select
              value={verifyProviderId}
              onValueChange={(value: ProviderId) => {
                setVerifyProviderId(value);
                setVerificationError("");
              }}
            >
              <SelectTrigger className="w-full">
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
          </div>

          {verificationError && (
            <div className="text-xs text-red-500">{verificationError}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-label="Save and Login"
          >
            {isSubmitting ? "Saving..." : "Save and Login"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              void handleSkip();
            }}
            disabled={isSubmitting}
            aria-label="Skip onboarding for now"
          >
            Skip for now
          </Button>
        </form>
      </div>
    </div>
  );
};
