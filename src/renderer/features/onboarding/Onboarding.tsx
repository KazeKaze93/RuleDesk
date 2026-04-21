import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z, ZodIssueOptionalMessage, ErrorMapCtx } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import log from "electron-log/renderer";
import { Button } from "@/components/ui/button";
import { KeyRound, User } from "lucide-react";
import { credsBaseSchema, CredsFormValues } from "@/schemas/form-schemas";
import { PROVIDER_IDS, type ProviderId } from "../../../shared/constants";
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

// Parse URL parameters from pasted text
const parseCredentialsFromText = (text: string): { userId?: string; apiKey?: string } => {
  const result: { userId?: string; apiKey?: string } = {};
  
  // Try to match user_id parameter (supports both user_id and user_id)
  const userIdMatch = text.match(/[?&]user_id=([^&\s]+)/i);
  if (userIdMatch) {
    result.userId = decodeURIComponent(userIdMatch[1]);
  }
  
  // Try to match api_key parameter (supports both api_key and api_key)
  const apiKeyMatch = text.match(/[?&]api_key=([^&\s]+)/i);
  if (apiKeyMatch) {
    result.apiKey = decodeURIComponent(apiKeyMatch[1]);
  }
  
  return result;
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
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
            return { message: t("validation.userIdRequired") };
          }
          if (issue.path[0] === "apiKey") {
            return { message: t("validation.apiKeyRequired") };
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

  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-screen bg-background text-foreground">
      <div className="p-8 space-y-6 w-full max-w-md rounded-lg border shadow-xl bg-card border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">
            {t("onboarding.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("onboarding.description")}
          </p>
        </div>

        <div className="p-4 space-y-2 text-sm rounded border bg-muted/40 border-border">
          <p className="font-semibold text-foreground">
            {t("onboarding.howToGetKeys")}
          </p>
          <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
            <li>{t("onboarding.step1")}</li>
            <li>{t("onboarding.step2")}</li>
            <li>{t("onboarding.step3")}</li>
          </ol>
          <div className="pt-2 mt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {t("onboarding.settingsPageAddress")}
            </span>
            <code className="block p-2 mt-1 text-xs break-all rounded cursor-text select-all bg-muted">
              https://rule34.xxx/index.php?page=account&s=options
            </code>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="user-id-input"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              {t("onboarding.userId")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="user-id-input"
                {...register("userId")}
                onPaste={handlePaste}
                className="py-2 pr-3 pl-9 w-full rounded border outline-none bg-background border-input focus:ring-2 focus:ring-ring"
                placeholder={t("onboarding.userIdPlaceholder")}
              />
            </div>
            {errors.userId && (
              <span className="text-xs text-red-500">
                {errors.userId.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="api-key-input"
              className="block mb-1 text-sm font-medium text-muted-foreground"
            >
              {t("onboarding.apiKey")}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                id="api-key-input"
                {...register("apiKey")}
                type="password"
                onPaste={handlePaste}
                className="py-2 pr-3 pl-9 w-full rounded border outline-none bg-background border-input focus:ring-2 focus:ring-ring"
                placeholder={t("onboarding.apiKeyPlaceholder")}
              />
            </div>
            {errors.apiKey && (
              <span className="text-xs text-red-500">
                {errors.apiKey.message}
              </span>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              Verify for
            </label>
            <Select
              value={verifyProviderId}
              onValueChange={(value: ProviderId) => setVerifyProviderId(value)}
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
            aria-label={t("onboarding.saveAndLogin")}
          >
            {isSubmitting
              ? t("onboarding.saving")
              : t("onboarding.saveAndLogin")}
          </Button>
        </form>
      </div>
    </div>
  );
};




