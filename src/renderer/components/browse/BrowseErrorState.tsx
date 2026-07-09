import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  KeyRound,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProviderErrorKind } from "@shared/schemas/provider-errors";
import { getBrowseSearchErrorPresentation } from "../../utils/provider-search-error";
import { Button } from "../ui/button";

export type BrowseErrorKind = ProviderErrorKind | "generic";

type BrowseErrorKindConfig = {
  icon: LucideIcon;
};

const BROWSE_ERROR_KIND_CONFIG: Record<BrowseErrorKind, BrowseErrorKindConfig> =
  {
    auth: { icon: KeyRound },
    rate_limit: { icon: AlertCircle },
    network: { icon: WifiOff },
    parse: { icon: AlertCircle },
    generic: { icon: AlertCircle },
  };

export type BrowseErrorStateProps = {
  kind: BrowseErrorKind;
  retryAfterMs?: number;
  onRetry: () => void;
  genericTitle?: string;
  genericDescription?: string;
};

export function BrowseErrorState({
  kind,
  retryAfterMs,
  onRetry,
  genericTitle = "Could not load Browse",
  genericDescription = "Failed to load posts.",
}: BrowseErrorStateProps) {
  const navigate = useNavigate();
  const { icon: Icon } = BROWSE_ERROR_KIND_CONFIG[kind];

  const presentation =
    kind === "generic"
      ? {
          title: genericTitle,
          description: genericDescription,
          showRetry: true,
        }
      : getBrowseSearchErrorPresentation(kind, retryAfterMs);

  const showOpenSettings = kind === "auth";

  return (
    <div
      className="flex flex-col gap-4 justify-center items-center h-full px-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex justify-center items-center rounded-full border border-destructive/25 p-4">
        <Icon
          className="w-12 h-12 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-2 items-center max-w-md text-center">
        <p className="text-lg font-semibold text-foreground">
          {presentation.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {presentation.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {showOpenSettings ? (
          <Button
            type="button"
            onClick={() => navigate("/settings")}
          >
            Open Settings
          </Button>
        ) : null}
        {presentation.showRetry ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
