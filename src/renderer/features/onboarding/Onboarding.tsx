import React from "react";
import { useForm } from "react-hook-form";
import { z, ZodIssueOptionalMessage, ErrorMapCtx } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { KeyRound, User } from "lucide-react";
import { credsBaseSchema, CredsFormValues } from "@/schemas/form-schemas";

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
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, fieldName: "userId" | "apiKey") => {
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
      await window.api.saveSettings(data);
      onComplete();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown save error.";
      console.error(`Authorization error: ${message}`);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-screen text-white bg-slate-950">
      <div className="p-8 space-y-6 w-full max-w-md rounded-lg border shadow-xl bg-slate-900 border-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-500">
            {t("onboarding.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {t("onboarding.description")}
          </p>
        </div>

        <div className="p-4 space-y-2 text-sm rounded border bg-slate-950 border-slate-800">
          <p className="font-semibold text-slate-300">
            {t("onboarding.howToGetKeys")}
          </p>
          <ol className="space-y-1 list-decimal list-inside text-slate-400">
            <li>{t("onboarding.step1")}</li>
            <li>{t("onboarding.step2")}</li>
            <li>{t("onboarding.step3")}</li>
          </ol>
          <div className="pt-2 mt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              {t("onboarding.settingsPageAddress")}
            </span>
            <code className="block p-2 mt-1 text-xs break-all rounded cursor-text select-all bg-slate-900">
              https://rule34.xxx/index.php?page=account&s=options
            </code>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="user-id-input"
              className="block mb-1 text-sm font-medium text-slate-400"
            >
              {t("onboarding.userId")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="user-id-input"
                {...register("userId")}
                onPaste={(e) => handlePaste(e, "userId")}
                className="py-2 pr-3 pl-9 w-full text-white rounded border outline-none bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500"
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
              className="block mb-1 text-sm font-medium text-slate-400"
            >
              {t("onboarding.apiKey")}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="api-key-input"
                {...register("apiKey")}
                type="password"
                onPaste={(e) => handlePaste(e, "apiKey")}
                className="py-2 pr-3 pl-9 w-full text-white rounded border outline-none bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500"
                placeholder={t("onboarding.apiKeyPlaceholder")}
              />
            </div>
            {errors.apiKey && (
              <span className="text-xs text-red-500">
                {errors.apiKey.message}
              </span>
            )}
          </div>

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




