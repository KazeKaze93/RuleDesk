import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { KeyRound, User } from "lucide-react";

const credsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  apiKey: z.string().min(5, "API Key is too short"),
});

type CredsFormValues = z.infer<typeof credsSchema>;

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredsFormValues>({
    resolver: zodResolver(credsSchema),
  });

  const onSubmit = async (data: CredsFormValues) => {
    try {
      await window.api.saveSettings(data);
      onComplete();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown save error.";
      alert(`Authorization error: ${message}`);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 min-h-screen text-white bg-slate-950">
      <div className="p-8 space-y-6 w-full max-w-md rounded-lg border shadow-xl bg-slate-900 border-slate-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-500">
            Rule34 Authorization
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            API keys are required for the parser to work.
          </p>
        </div>

        <div className="p-4 space-y-2 text-sm rounded border bg-slate-950 border-slate-800">
          <p className="font-semibold text-slate-300">How to get keys:</p>
          <ol className="space-y-1 list-decimal list-inside text-slate-400">
            <li>
              Log into your account on <b>rule34.xxx</b>
            </li>
            <li>
              Go to <b>My Account &rarr; Options</b>
            </li>
            <li>
              Find the <b>API Access</b> section
            </li>
          </ol>
          <div className="pt-2 mt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Settings page address (copy):
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
              User ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="user-id-input"
                {...register("userId")}
                className="py-2 pr-3 pl-9 w-full text-white rounded border outline-none bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500"
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
            <label
              htmlFor="api-key-input"
              className="block mb-1 text-sm font-medium text-slate-400"
            >
              API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="api-key-input"
                {...register("apiKey")}
                type="password"
                className="py-2 pr-3 pl-9 w-full text-white rounded border outline-none bg-slate-950 border-slate-700 focus:ring-2 focus:ring-blue-500"
                placeholder="Your secret key"
              />
            </div>
            {errors.apiKey && (
              <span className="text-xs text-red-500">
                {errors.apiKey.message}
              </span>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save and Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};
