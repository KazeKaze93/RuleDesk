import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import log from "electron-log/renderer";
import { ArtistCard } from "./components/ArtistCard";
import { AddArtistModal } from "../../components/dialogs/AddArtistModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import type { TrackedArtist } from "../../../main/bridge";
import type { ProviderId } from "../../../shared/constants";

export const Tracked = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const addModalReturnFocusRef = useRef<HTMLElement | null>(null);

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
    type: "tag" | "uploader" | "query",
    provider: ProviderId
  ) => {
    try {
      await window.api.addArtist({
        name,
        tag,
        type,
        provider,
      });

      // Invalidate cache to refresh list
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      setIsAddModalOpen(false);
    } catch (err) {
      log.error("[Tracked] Failed to add artist:", err);
    }
  };

  // Handler for clicking a card
  const handleSelectArtist = (artist: TrackedArtist) => {
    navigate(`/artist/${artist.id}`);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredArtists =
    artists?.filter((artist) =>
      artist.name.toLowerCase().includes(normalizedQuery)
    ) ?? [];

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading artists...</div>;

  if (error)
    return <div className="p-8 text-destructive">Error loading artists</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="flex gap-2 items-center text-2xl font-bold tracking-tight">
          <Users className="w-6 h-6 text-primary" />
          Artists
        </h1>
        <Button
          onClick={(e) => {
            addModalReturnFocusRef.current = e.currentTarget;
            setIsAddModalOpen(true);
          }}
          variant="default"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Artist
        </Button>
      </div>

      {!artists || artists.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground">
          <p>No tracked sources yet.</p>
          <Button
            variant="link"
            onClick={(e) => {
              addModalReturnFocusRef.current = e.currentTarget;
              setIsAddModalOpen(true);
            }}
          >
            Add your first one
          </Button>
        </div>
      ) : (
        <>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search artists..."
            aria-label="Search artists by name"
            className="max-w-sm"
          />
          {filteredArtists.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground">
              <p>No artists match</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredArtists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onSelect={handleSelectArtist}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AddArtistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddArtist}
        returnFocusToRef={addModalReturnFocusRef}
      />
    </div>
  );
};
