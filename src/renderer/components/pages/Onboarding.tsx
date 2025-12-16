import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../ui/card";
import { KeyRound, Loader2, Info, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export const Onboarding = ({
  onLoginSuccess,
}: {
  onLoginSuccess: () => void;
}) => {
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!userId || !apiKey) {
      setError("Both fields are required");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      // 1. Сохраняем настройки
      await window.api.saveSettings({ userId, apiKey });

      // 2. Проверяем валидность (делаем реальный тестовый запрос)
      const isValid = await window.api.verifyCredentials();

      if (isValid) {
        onLoginSuccess();
      } else {
        setError(
          "Connection failed. Please check your User ID and API Key and try again."
        );
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Умная вставка. Если юзер копирует всю строку с сайта, мы сами достаем данные.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("api_key=") || text.includes("user_id=")) {
      e.preventDefault();
      try {
        const cleanText = text.startsWith("&") ? text.slice(1) : text;
        const params = new URLSearchParams(cleanText);

        const pastedId = params.get("user_id");
        const pastedKey = params.get("api_key");

        if (pastedId) setUserId(pastedId);
        if (pastedKey) setApiKey(pastedKey);
      } catch (err) {
        console.warn("Failed to parse paste", err);
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-screen duration-500 bg-background animate-in fade-in zoom-in-95">
      <Card className="w-full max-w-lg shadow-2xl border-border/50 bg-card">
        <CardHeader className="pb-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full ring-1 bg-primary/10 ring-primary/20">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Connect Account
          </CardTitle>
          <CardDescription className="text-base">
            Link your Rule34 account to enable synchronization.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Инструкция */}
          <Alert className="bg-muted/50 border-border/50">
            <Info className="w-4 h-4 text-muted-foreground" />
            <AlertTitle className="mb-2 font-semibold text-foreground">
              Where to find your credentials?
            </AlertTitle>
            <AlertDescription className="space-y-2 text-sm text-muted-foreground">
              <ol className="ml-1 space-y-1 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <span className="font-medium text-foreground">
                    My Account
                  </span>{" "}
                  &rarr;{" "}
                  <span className="font-medium text-foreground">Options</span>.
                </li>
                <li>
                  Scroll down to the{" "}
                  <span className="font-medium text-foreground">
                    "API Access Credentials"
                  </span>{" "}
                  section.
                </li>
                <li>
                  If the field is empty, click{" "}
                  <span className="font-medium text-foreground">
                    "Generate New Key?"
                  </span>
                  .
                </li>
                <li>
                  Copy the{" "}
                  <code className="bg-background px-1 py-0.5 rounded border border-border/50 text-xs">
                    user_id
                  </code>{" "}
                  and{" "}
                  <code className="bg-background px-1 py-0.5 rounded border border-border/50 text-xs">
                    api_key
                  </code>{" "}
                  values.
                </li>
              </ol>
              <div className="mt-2 text-xs italic text-primary/80">
                💡 Pro Tip: You can paste the entire string (e.g.{" "}
                <span className="opacity-70">&api_key=...&user_id=...</span>)
                into any field below.
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="user-id-input" className="text-sm font-medium">
                User ID
              </label>
              <Input
                id="user-id-input"
                placeholder="e.g. 479099"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onPaste={handlePaste}
                className="font-mono"
                aria-label="Rule 34 User ID"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="api-key-input" className="text-sm font-medium">
                API Key
              </label>
              <Input
                id="api-key-input"
                type="password"
                placeholder="Paste your API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onPaste={handlePaste}
                className="font-mono"
                aria-label="Rule 34 API Key"
                autoComplete="off"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-center text-red-500 rounded-md border bg-red-500/10 border-red-500/20">
              {error}
            </div>
          )}

          <Button
            className="w-full font-semibold"
            size="lg"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Connect & Start Sync"
            )}
          </Button>
        </CardContent>

        <CardFooter className="justify-center pt-6 pb-6 border-t">
          <Button
            variant="link"
            className="p-0 h-auto text-xs text-muted-foreground"
            onClick={() =>
              window.api.openExternal(
                "https://rule34.xxx/index.php?page=account&s=options"
              )
            }
          >
            Open Rule34 Options Page <ExternalLink className="ml-1 w-3 h-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
