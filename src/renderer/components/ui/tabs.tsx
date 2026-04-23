import * as React from "react";
import { cn } from "../../lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export const TabsList = ({ className, ...props }: TabsListProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border bg-muted/40 p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = ({ value, className, children, ...props }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used inside Tabs");
  }

  const isActive = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = ({ value, className, children, ...props }: TabsContentProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used inside Tabs");
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn("mt-4 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
};
