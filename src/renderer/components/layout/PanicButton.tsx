import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../ui/button";
import { useSafeModeStore } from "../../store/safeModeStore";
import { cn } from "../../lib/utils";

const PANIC_PULSE_DURATION_MS = 3000;

export const PanicButton = () => {
  const { panicMode, setSafeMode, enablePanicMode, disablePanicMode } = useSafeModeStore(
    useShallow((s) => ({
      panicMode: s.panicMode,
      setSafeMode: s.setSafeMode,
      enablePanicMode: s.enablePanicMode,
      disablePanicMode: s.disablePanicMode,
    })),
  );
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
    };
  }, []);

  const clearPulseTimer = () => {
    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
  };

  const handleToggle = () => {
    if (panicMode) {
      disablePanicMode();
      setSafeMode(false);
      setIsPulsing(false);
      clearPulseTimer();
      return;
    }

    enablePanicMode();
    setIsPulsing(true);
    clearPulseTimer();
    pulseTimerRef.current = window.setTimeout(() => {
      setIsPulsing(false);
      pulseTimerRef.current = null;
    }, PANIC_PULSE_DURATION_MS);
  };

  return (
    <Button
      variant={panicMode ? "destructive" : "outline"}
      size="icon"
      onClick={handleToggle}
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all",
        isPulsing && "animate-pulse"
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
