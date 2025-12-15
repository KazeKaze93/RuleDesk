import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { ArtistCard } from "../gallery/ArtistCard";
import { AddArtistModal } from "../dialogs/AddArtistModal";
import { Button } from "../ui/button";
import type { Artist } from "../../../main/db/schema";

export const Tracked = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch artists
  const {
    data: artists,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  // Handler for adding artist
  const handleAddArtist = async (
    name: string,
    tag: string,
    type: "tag" | "uploader" | "query"
  ) => {
    try {
      await window.api.addArtist({
        name,
        tag,
        type,
        apiEndpoint:
          "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index",
      });
      // Invalidate cache to refresh list
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to add artist:", err);
    }
  };

  // Handler for clicking a card
  const handleSelectArtist = (artist: Artist) => {
    navigate(`/artist/${artist.id}`);
  };

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading artists...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error loading artists</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Tracked Sources</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Source
        </Button>
      </div>

      {!artists || artists.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground">
          <p>No tracked artists yet.</p>
          <Button variant="link" onClick={() => setIsAddModalOpen(true)}>
            Add your first one
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onSelect={handleSelectArtist}
            />
          ))}
        </div>
      )}

      <AddArtistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddArtist}
      />
    </div>
  );
};
