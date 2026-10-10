import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import log from "electron-log/renderer";
import { ArtistListRow } from "./components/ArtistListRow";
import { AddArtistModal } from "../../components/dialogs/AddArtistModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { TooltipProvider } from "../../components/ui/tooltip";
import type { TrackedArtist } from "@shared/types/bridge";
import type { ProviderId } from "../../../shared/constants";

const PAGE_TITLE = "Tracked artists";
const PAGE_SUBTITLE =
  "Tracking syncs all posts, enables full download, and fills the Updates feed.";
const ADD_ARTIST_LABEL = "Add Artist";
const ADD_ARTIST_ARIA_LABEL = "Add a tracked artist";
const EMPTY_TITLE = "No tracked artists yet";
const EMPTY_DESCRIPTION =
  "Track an artist to sync all of their posts, download everything, and see new work in Updates. Click Add Artist to get started.";
const EMPTY_CTA_LABEL = "Add your first artist";
const SEARCH_PLACEHOLDER = "Search artists...";
const SEARCH_ARIA_LABEL = "Search artists by name";
const NO_MATCH_MESSAGE = "No artists match";
const LOADING_MESSAGE = "Loading artists...";
const ERROR_MESSAGE = "Error loading artists";

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
      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((error: unknown) => {
          log.error("[Tracked] Failed to invalidate artists:", error);
        });
      setIsAddModalOpen(false);
    } catch (err) {
      log.error("[Tracked] Failed to add artist:", err);
    }
  };

  // Handler for clicking a card
  const handleSelectArtist = (artist: TrackedArtist) => {
    void Promise.resolve(navigate(`/artist/${artist.id}`)).catch(
      (error: unknown) => {
        log.error("[Tracked] Navigation to artist failed:", error);
      }
    );
  };

  const openAddModal = (trigger: HTMLElement) => {
    addModalReturnFocusRef.current = trigger;
    setIsAddModalOpen(true);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredArtists =
    artists?.filter((artist) =>
      artist.name.toLowerCase().includes(normalizedQuery)
    ) ?? [];

  if (isLoading)
    return <div className="p-8 text-muted-foreground">{LOADING_MESSAGE}</div>;

  if (error)
    return <div className="p-8 text-destructive">{ERROR_MESSAGE}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="flex gap-2 items-center text-2xl font-bold tracking-tight">
            <Users className="w-6 h-6 text-primary" aria-hidden="true" />
            {PAGE_TITLE}
          </h1>
          <p className="text-sm text-muted-foreground">{PAGE_SUBTITLE}</p>
        </div>
        <Button
          onClick={(e) => {
            openAddModal(e.currentTarget);
          }}
          variant="default"
          className="gap-2 shrink-0"
          aria-label={ADD_ARTIST_ARIA_LABEL}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {ADD_ARTIST_LABEL}
        </Button>
      </div>

      {!artists || artists.length === 0 ? (
        <div
          className="flex flex-col gap-4 justify-center items-center h-64 px-6 rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground"
          role="status"
        >
          <Users className="w-16 h-16 opacity-50" aria-hidden="true" />
          <div className="max-w-md space-y-2 text-center">
            <p className="text-lg font-semibold text-foreground">{EMPTY_TITLE}</p>
            <p className="text-sm">{EMPTY_DESCRIPTION}</p>
          </div>
          <Button
            variant="default"
            className="gap-2"
            onClick={(e) => {
              openAddModal(e.currentTarget);
            }}
            aria-label={ADD_ARTIST_ARIA_LABEL}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {EMPTY_CTA_LABEL}
          </Button>
        </div>
      ) : (
        <>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            aria-label={SEARCH_ARIA_LABEL}
            className="max-w-sm"
          />
          {filteredArtists.length === 0 ? (
            <div
              className="flex flex-col justify-center items-center h-64 rounded-lg border-2 border-dashed bg-muted/10 text-muted-foreground"
              role="status"
            >
              <p>{NO_MATCH_MESSAGE}</p>
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <div
                className="w-full max-w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
                role="list"
                aria-label={PAGE_TITLE}
              >
                {filteredArtists.map((artist) => (
                  <ArtistListRow
                    key={artist.id}
                    artist={artist}
                    onSelect={handleSelectArtist}
                  />
                ))}
              </div>
            </TooltipProvider>
          )}
        </>
      )}

      <AddArtistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(name, tag, type, provider) => {
          void handleAddArtist(name, tag, type, provider);
        }}
        returnFocusToRef={addModalReturnFocusRef}
      />
    </div>
  );
};
