import { FilterX, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import {
  UPDATES_FEED_EMPTY_KIND,
  type UpdatesFeedEmptyKind,
} from "../../lib/updates-feed-empty";

const EMPTY_COPY: Record<
  UpdatesFeedEmptyKind,
  { title: string; description: string }
> = {
  [UPDATES_FEED_EMPTY_KIND.NO_ARTISTS]: {
    title: "No tracked artists",
    description: "Track some artists to see updates here.",
  },
  [UPDATES_FEED_EMPTY_KIND.NEVER_SYNCED]: {
    title: "Sync has not run yet",
    description: "Run Sync now to fetch new posts from your tracked artists.",
  },
  [UPDATES_FEED_EMPTY_KIND.NO_NEW_POSTS]: {
    title: "No new posts",
    description: "There are no posts published since you started tracking.",
  },
  [UPDATES_FEED_EMPTY_KIND.FILTERED]: {
    title: "Everything was filtered out",
    description: "No posts match the current tag filter on the Updates feed.",
  },
};

type UpdatesFeedEmptyStateProps = {
  kind: UpdatesFeedEmptyKind;
  onClearFilter?: () => void;
};

export function UpdatesFeedEmptyState({
  kind,
  onClearFilter,
}: UpdatesFeedEmptyStateProps) {
  const copy = EMPTY_COPY[kind];
  const Icon =
    kind === UPDATES_FEED_EMPTY_KIND.NO_ARTISTS
      ? UserPlus
      : kind === UPDATES_FEED_EMPTY_KIND.FILTERED
        ? FilterX
        : RefreshCw;

  return (
    <div className="flex flex-col gap-4 justify-center items-center h-full text-muted-foreground">
      <Icon className="w-16 h-16 opacity-50" aria-hidden="true" />
      <div className="text-center">
        <p className="mb-2 text-lg font-semibold">{copy.title}</p>
        <p className="text-sm">{copy.description}</p>
      </div>
      {kind === UPDATES_FEED_EMPTY_KIND.FILTERED && onClearFilter ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearFilter}
          aria-label="Clear tag filter"
        >
          <FilterX className="mr-2 w-4 h-4" />
          Clear filter
        </Button>
      ) : null}
    </div>
  );
}
