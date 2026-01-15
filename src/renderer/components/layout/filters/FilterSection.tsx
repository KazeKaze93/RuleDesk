import * as React from "react";
import { Separator } from "../../ui/separator";

interface FilterSectionProps {
  label: string;
  children: React.ReactNode;
  showSeparator?: boolean;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  label,
  children,
  showSeparator = true,
}) => {
  return (
    <>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 opacity-50">
          {label}
        </label>
        {children}
      </div>
      {showSeparator && <Separator className="my-3" />}
    </>
  );
};
