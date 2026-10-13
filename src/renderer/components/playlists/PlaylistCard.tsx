import { List, Sparkles } from "lucide-react";
import type { PlaylistWithStats } from "@shared/types/bridge";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface PlaylistCardProps {
  playlist: PlaylistWithStats;
  onOpen: (playlist: PlaylistWithStats) => void;
  /** Wider when manual + 4 hover actions; narrower for smart (3 actions). */
  actionPaddingClassName?: string;
}

/**
 * Title area only — PlaylistsPage places Export / Edit / (Clear) / Delete in a shared
 * absolute action row; pr reserves space so the name does not run under the icons.
 */
export const PlaylistCard = ({
  playlist,
  onOpen,
  actionPaddingClassName = "pr-32",
}: PlaylistCardProps) => {
  const updatedAtMs =
    playlist.updatedAt instanceof Date
      ? playlist.updatedAt.getTime()
      : playlist.updatedAt;
  const subtitle =
    playlist.postCount === 0
      ? "Empty"
      : `${playlist.postCount} posts · Updated ${formatRelativeTime(updatedAtMs)}`;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onOpen(playlist)}
      className={cn(
        "flex h-auto w-full min-w-0 flex-col items-start gap-2 px-0 py-0 text-left hover:bg-transparent",
        actionPaddingClassName
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        {playlist.isSmart ? (
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        ) : (
          <List className="h-5 w-5 shrink-0 text-primary" />
        )}
        <h3 className="min-w-0 flex-1 truncate font-semibold">{playlist.name}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {playlist.isSmart && (
        <span className="text-xs font-medium text-primary">Smart Collection</span>
      )}
    </Button>
  );
};
