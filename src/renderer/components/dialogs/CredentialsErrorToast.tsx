import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { RENDERER_WINDOW_EVENTS } from "@shared/constants";

const CREDENTIALS_KEYWORD = "credentials";

export const CredentialsErrorToast = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = window.api.onSyncError((syncErrorMessage) => {
      if (!syncErrorMessage.toLowerCase().includes(CREDENTIALS_KEYWORD)) {
        return;
      }
      setMessage(syncErrorMessage);
      setVisible(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = () => setVisible(false);

  const handleOpenOnboarding = () => {
    window.dispatchEvent(new Event(RENDERER_WINDOW_EVENTS.OPEN_ONBOARDING));
    setVisible(false);
  };

  const handleOpenSettings = () => {
    navigate("/settings");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 p-4 w-96 rounded-lg border shadow-xl bg-slate-900 border-slate-700 animate-in slide-in-from-bottom-5 text-slate-100"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-start">
          <AlertCircle className="mt-0.5 w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold">Credentials issue detected</h4>
            <p className="mt-1 text-xs text-slate-300">{message}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Close credentials notification"
          className="w-7 h-7 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleOpenOnboarding}
          className="w-full bg-amber-600 hover:bg-amber-500"
        >
          Re-enter credentials
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenSettings}
          className="w-full border-slate-700 hover:bg-slate-800"
        >
          Open settings
        </Button>
      </div>
    </div>
  );
};
