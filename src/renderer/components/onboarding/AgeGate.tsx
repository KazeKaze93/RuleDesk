import React, { useState } from "react";
import log from "electron-log/renderer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { IpcSettings } from "@/main/types/ipc";

interface AgeGateProps {
  onComplete: (settings: IpcSettings) => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onComplete }) => {
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [isTosAccepted, setIsTosAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!isAdultConfirmed || !isTosAccepted) {
      return;
    }

    setIsLoading(true);
    try {
      const settings = await window.api.confirmLegal();
      onComplete(settings);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.error(`[AgeGate] Failed to confirm legal: ${message}`);
      // TODO: Show error toast/notification to user
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !isAdultConfirmed || !isTosAccepted || isLoading;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Age Verification & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: NSFW Content</AlertTitle>
            <AlertDescription>
              This application contains explicit adult content. You must be at least 18 years old to proceed.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="age-confirm"
                checked={isAdultConfirmed}
                onCheckedChange={(checked) => setIsAdultConfirmed(checked === true)}
                aria-label="I confirm that I am at least 18 years old"
              />
              <Label
                htmlFor="age-confirm"
                className="text-sm font-normal leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that I am at least 18 years old.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="tos-accept"
                checked={isTosAccepted}
                onCheckedChange={(checked) => setIsTosAccepted(checked === true)}
                aria-label="I accept the Terms of Service and assume full responsibility for the content viewed"
              />
              <Label
                htmlFor="tos-accept"
                className="text-sm font-normal leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept the Terms of Service and assume full responsibility for the content viewed.
              </Label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleConfirm}
            disabled={isButtonDisabled}
            className="w-full"
            aria-label="Enter RuleDesk"
          >
            {isLoading ? "Processing..." : "Enter RuleDesk"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

