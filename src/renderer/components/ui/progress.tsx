import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_PROGRESS_MAX = 100;

export type ProgressProps = Omit<
  React.ComponentPropsWithoutRef<"progress">,
  "value" | "max"
> & {
  value?: number;
  max?: number;
};

/**
 * Native progress element wrapper — no inline style (project UI rules).
 * Uses the element’s built-in accessibility value attributes.
 */
const Progress = React.forwardRef<HTMLProgressElement, ProgressProps>(
  (
    { className, value = 0, max = DEFAULT_PROGRESS_MAX, ...props },
    ref
  ) => {
    return (
      <progress
        ref={ref}
        value={value}
        max={max}
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-primary/20",
          "[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-primary/20",
          "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary",
          "[&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary",
          className
        )}
        {...props}
      />
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
