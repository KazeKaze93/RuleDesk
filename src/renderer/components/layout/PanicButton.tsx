import { ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
import { useSafeModeStore } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";

export const PanicButton = () => {
  const { panicMode, setSafeMode, enablePanicMode, disablePanicMode } = useSafeModeStore();

  const handleToggle = () => {
    if (panicMode) {
      // Disable both panic mode and safe mode together
      disablePanicMode();
      setSafeMode(false);
    } else {
      // Enable both panic mode and safe mode together (merged Safe Mode functionality)
      enablePanicMode();
    }
  };

  return (
    <Button
      variant={panicMode ? "destructive" : "outline"}
      size="icon"
      onClick={handleToggle}
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all",
        panicMode && "animate-pulse"
      )}
      aria-label={panicMode ? "Disable safe mode" : "Enable safe mode"}
      title={
        panicMode
          ? "Disable Safe Mode (blur previews)"
          : "Enable Safe Mode (blur previews)"
      }
    >
      <ShieldAlert className="w-5 h-5" />
    </Button>
  );
};

