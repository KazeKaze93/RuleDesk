import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import log from "electron-log/renderer";
import { toast } from "sonner";
import { ArtistListRow } from "./components/ArtistListRow";
import { AddArtistModal } from "../../components/dialogs/AddArtistModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { PageHeader } from "../../components/layout/PageHeader";
import { TooltipProvider } from "../../components/ui/tooltip";
import type { TrackedArtist } from "@shared/types/bridge";
import type { ProviderId } from "../../../shared/constants";
import { resolveErrorMessage } from "../../utils/error-message";

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
const ERROR_TITLE = "Could not load artists";
const RETRY_LABEL = "Retry";
const ADD_FAILED_TOAST = "Failed to add artist";

export const Tracked = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const addModalReturnFocusRef = useRef<HTMLElement | null>(null);

  const {
    data: artists,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

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

      void queryClient
        .invalidateQueries({ queryKey: ["artists"] })
        .catch((invalidateError: unknown) => {
          log.error("[Tracked] Failed to invalidate artists:", invalidateError);
        });
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      log.error("[Tracked] Failed to add artist:", err);
      toast.error(resolveErrorMessage(err, ADD_FAILED_TOAST));
    }
  };

  const handleSelectArtist = (artist: TrackedArtist) => {
    void Promise.resolve(navigate(`/artist/${artist.id}`)).catch(
      (navError: unknown) => {
        log.error("[Tracked] Navigation to artist failed:", navError);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_SUBTITLE}
          icon={Users}
        />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={PAGE_TITLE}
          description={PAGE_SUBTITLE}
          icon={Users}
        />
        <Alert variant="destructive">
          <AlertTitle>{ERROR_TITLE}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{resolveErrorMessage(error, "Failed to load tracked artists.")}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              {RETRY_LABEL}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_TITLE}
        description={PAGE_SUBTITLE}
        icon={Users}
        actions={
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
        }
      />

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
