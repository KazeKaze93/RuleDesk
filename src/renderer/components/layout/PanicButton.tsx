import { ShieldAlert } from "lucide-react";
import { Button } from "../ui/button";
import { useSafeModeStore } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";

export const PanicButton = () => {
  const { panicMode, togglePanicMode } = useSafeModeStore();

  return (
    <Button
      variant={panicMode ? "destructive" : "outline"}
      size="icon"
      onClick={togglePanicMode}
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all",
        panicMode && "animate-pulse"
      )}
      aria-label={panicMode ? "Disable panic mode" : "Enable panic mode"}
      title={panicMode ? "Disable Safe Mode" : "Enable Safe Mode (Panic Button)"}
    >
      <ShieldAlert className="w-5 h-5" />
    </Button>
  );
};

