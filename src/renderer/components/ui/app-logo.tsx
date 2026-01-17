import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

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
      console.log("[AppLogo] Already loading, skipping...");
      return;
    }

    // Get icon path via IPC from main process
    const loadIconPath = async () => {
      isLoadingRef.current = true;
      try {
        console.log("[AppLogo] Attempting to load icon via IPC...");
        console.log("[AppLogo] window.api exists:", !!window.api);
        console.log("[AppLogo] window.api.getIconPath exists:", !!window.api?.getIconPath);
        
        // Check if method exists
        if (!window.api) {
          console.error("[AppLogo] window.api is not available");
          setIconPath("");
          return;
        }
        
        if (!window.api.getIconPath) {
          console.error("[AppLogo] window.api.getIconPath is not available");
          setIconPath("");
          return;
        }
        
        console.log("[AppLogo] Calling window.api.getIconPath()...");
        const path = await window.api.getIconPath();
        console.log("[AppLogo] Received response, type:", typeof path, "length:", path?.length || 0);
        console.log("[AppLogo] Response preview:", path?.substring(0, 100) || "null/undefined");
        
        if (path && typeof path === "string" && path.startsWith("data:image")) {
          console.log("[AppLogo] Valid data URL received, setting icon");
          setIconPath(path);
        } else {
          console.warn("[AppLogo] Invalid icon path received:", path?.substring(0, 50) || "null/undefined");
          setIconPath("");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error("[AppLogo] Failed to get icon path:", {
          message: errorMessage,
          stack: errorStack,
          error: String(error),
        });
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
        console.error("[AppLogo] Image load error");
        // Hide broken image
        e.currentTarget.style.display = "none";
      }}
      {...props}
    />
  );
};
