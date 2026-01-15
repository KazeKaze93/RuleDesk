import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "../../ui/toggle-group";
import { cn } from "../../../lib/utils";

interface FilterToggleGroupOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface FilterToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterToggleGroupOption[];
  size?: "sm" | "default" | "lg";
}

export const FilterToggleGroup: React.FC<FilterToggleGroupProps> = ({
  value,
  onValueChange,
  options,
  size = "sm",
}) => {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        const stringVal = typeof val === "string" ? val : val[0] || "";
        if (stringVal) onValueChange(stringVal);
      }}
      size={size}
      variant="outline"
      className="w-full justify-start"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={cn(
            "flex-1 gap-1.5",
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
          title={option.disabled ? "Coming soon" : undefined}
        >
          {option.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{option.icon}</span>}
          <span className="text-xs">{option.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
