import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import log from "electron-log/renderer";

export interface AppLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

/**
 * AppLogo component - renders the RuleDesk application logo from resources/icons/icon.png.
 * Uses the actual icon image file instead of SVG.
 */
export const AppLogo = ({ className, ...props }: AppLogoProps) => {
  const [iconPath, setIconPath] = useState<string>("");
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }

    // Get icon path via IPC from main process
    const loadIconPath = async () => {
      isLoadingRef.current = true;
      try {
        // Check if method exists
        if (!window.api) {
          log.error("[AppLogo] window.api is not available");
          setIconPath("");
          return;
        }
        
        if (!window.api.getIconPath) {
          log.error("[AppLogo] window.api.getIconPath is not available");
          setIconPath("");
          return;
        }
        
        const path = await window.api.getIconPath();
        
        if (path && typeof path === "string" && path.startsWith("data:image")) {
          setIconPath(path);
        } else {
          log.warn("[AppLogo] Invalid icon path received:", path?.substring(0, 50) || "null/undefined");
          setIconPath("");
        }
      } catch (error) {
        log.error("[AppLogo] Failed to get icon path:", error);
        // Fallback to empty string (will show broken image, but won't crash)
        setIconPath("");
      } finally {
        isLoadingRef.current = false;
      }
    };

    // Call immediately - no delay needed
    loadIconPath();
  }, []);

  // Show placeholder while loading or if failed
  if (!iconPath) {
    // Return a placeholder div with same dimensions to prevent layout shift
    return (
      <div
        className={cn("flex items-center justify-center bg-muted/20 rounded", className)}
        aria-label="Loading logo"
      >
        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={iconPath}
      alt="RuleDesk"
      className={cn(
        "object-contain",
        "select-none",
        "pointer-events-none",
        "drop-shadow-sm",
        className
      )}
      style={{
        imageRendering: "auto",
        WebkitImageRendering: "-webkit-optimize-contrast",
        msImageRendering: "auto",
      } as React.CSSProperties}
      onError={(e) => {
        log.error("[AppLogo] Image load error");
        // Hide broken image
        e.currentTarget.style.display = "none";
      }}
      {...props}
    />
  );
};
