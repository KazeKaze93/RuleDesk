import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";

interface SettingsAccountTabProps {
  apiKey: string;
  showApiKey: boolean;
  hasApiKey: boolean;
  accountStatus: "idle" | "success" | "error";
  onApiKeyChange: (value: string) => void;
  onToggleApiKeyVisibility: () => void;
  onSaveApiKey: () => void;
}

export const SettingsAccountTab = ({
  apiKey,
  showApiKey,
  hasApiKey,
  accountStatus,
  onApiKeyChange,
  onToggleApiKeyVisibility,
  onSaveApiKey,
}: SettingsAccountTabProps) => {
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
          <Label htmlFor="api-key">API key</Label>
          <Input
            id="api-key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            placeholder="Enter new API key"
          />
          <section className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onToggleApiKeyVisibility}>
              {showApiKey ? "Hide" : "Show"}
            </Button>
            <Button type="button" size="sm" onClick={onSaveApiKey}>
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
      </CardContent>
    </Card>
  );
};
