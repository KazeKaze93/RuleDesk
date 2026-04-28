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
            <Label
              htmlFor="user-id-input"
              className="block mb-1 text-muted-foreground"
            >
              {t("onboarding.userId")}
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
            <Label
              htmlFor="api-key-input"
              className="block mb-1 text-muted-foreground"
            >
              {t("onboarding.apiKey")}
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
            aria-label={t("onboarding.saveAndLogin")}
          >
            {isSubmitting
              ? t("onboarding.saving")
              : t("onboarding.saveAndLogin")}
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




