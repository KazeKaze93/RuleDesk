import { List, Sparkles } from "lucide-react";
import type { PlaylistWithStats } from "../../../main/bridge";
import { formatRelativeTime } from "../../lib/formatRelativeTime";

interface PlaylistCardProps {
  playlist: PlaylistWithStats;
  onOpen: (playlist: PlaylistWithStats) => void;
}

export const PlaylistCard = ({ playlist, onOpen }: PlaylistCardProps) => {
  const updatedAtMs =
    playlist.updatedAt instanceof Date
      ? playlist.updatedAt.getTime()
      : playlist.updatedAt;
  const subtitle =
    playlist.postCount === 0
      ? "Empty"
      : `${playlist.postCount} posts · Updated ${formatRelativeTime(updatedAtMs)}`;

  return (
    <button
      onClick={() => onOpen(playlist)}
      className="flex flex-col items-start gap-2 w-full text-left"
    >
      <div className="flex items-center gap-2 w-full">
        {playlist.isSmart ? (
          <Sparkles className="w-5 h-5 text-primary" />
        ) : (
          <List className="w-5 h-5 text-primary" />
        )}
        <h3 className="font-semibold flex-1 truncate">{playlist.name}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {playlist.isSmart && (
        <span className="text-xs text-primary font-medium">Smart Collection</span>
      )}
    </button>
  );
};
