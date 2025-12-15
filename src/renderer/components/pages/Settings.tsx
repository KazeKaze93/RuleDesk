import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Loader2, Save } from "lucide-react";

interface SettingsResponse {
  userId: string;
  apiKey: string;
}

export const Settings = () => {
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.getSettings();
        if (settings) {
          const s = settings as unknown as SettingsResponse;
          setUserId(s.userId || "");
          setApiKey(s.apiKey || "");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setStatus("idle");

    try {
      await window.api.saveSettings({ userId, apiKey });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 space-y-8 max-w-2xl duration-500 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your API credentials and application preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rule34 API Configuration</CardTitle>
          <CardDescription>
            Required for syncing posts. To get api_key and user_id, go to My
            Account &gt; Options. In the "API Access Credentials" field,
            generate a new key. (the "Generate New Key" checkbox))
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">User ID</label>
            <Input
              placeholder="e.g. 123456"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Your numeric user ID found in the URL of your profile page or in
              the "My Account" &gt; "API Access Credentials" field.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">API Key</label>
            <Input
              type="password"
              placeholder="Paste your API key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Generated in "My Account" &gt; "API Access Credentials".
            </p>
          </div>

          <div className="flex gap-4 items-center pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>

            {status === "success" && (
              <span className="text-sm font-medium text-green-500">Saved!</span>
            )}
            {status === "error" && (
              <span className="text-sm font-medium text-red-500">
                Error saving.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
