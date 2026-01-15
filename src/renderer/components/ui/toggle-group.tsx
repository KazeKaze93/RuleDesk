import * as React from "react";
import { cn } from "../../lib/utils";

interface ToggleGroupContextValue {
  type: "single" | "multiple";
  value: string | string[] | undefined;
  onValueChange: (value: string | string[]) => void;
  size: "sm" | "default" | "lg";
  variant: "outline" | "ghost";
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "ghost";
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = "single", value, onValueChange, size = "sm", variant = "outline", children, ...props }, ref) => {
    const handleValueChange = React.useCallback((newValue: string | string[]) => {
      onValueChange?.(newValue);
    }, [onValueChange]);

    const contextValue = React.useMemo<ToggleGroupContextValue>(() => ({
      type,
      value,
      onValueChange: handleValueChange,
      size,
      variant,
    }), [type, value, handleValueChange, size, variant]);

    return (
      <ToggleGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("inline-flex items-center gap-1 w-full", className)}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, children, disabled, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    
    if (!context) {
      throw new Error("ToggleGroupItem must be used within ToggleGroup");
    }

    const { type, value: groupValue, onValueChange, size, variant } = context;
    
    const isSelected = type === "single"
      ? groupValue === value
      : Array.isArray(groupValue) && groupValue.includes(value);

    const handleClick = () => {
      if (disabled) return;
      
      if (type === "single") {
        onValueChange(isSelected ? "" : value);
      } else {
        const current = Array.isArray(groupValue) ? groupValue : [];
        const newValue = isSelected
          ? current.filter((v) => v !== value)
          : [...current, value];
        onValueChange(newValue);
      }
    };

    const sizeClasses = {
      sm: "h-7 px-3 text-xs",
      default: "h-9 px-3 text-sm",
      lg: "h-11 px-4 text-base",
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-primary/10 text-primary border-primary/40",
          sizeClasses[size],
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isSelected}
        data-state={isSelected ? "on" : "off"}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
