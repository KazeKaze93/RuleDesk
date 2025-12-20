import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArtistGallery } from "../gallery/ArtistGallery";
import { Button } from "../ui/button";

export const ArtistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const artistId = Number(id);

  const { data: artists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
  });

  const artist = artists?.find((a) => a.id === artistId);

  if (!artist) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <div className="text-destructive">Artist not found (ID: {id})</div>
        <Button variant="outline" onClick={() => navigate("/tracked")}>
          Back to Sources
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <ArtistGallery
        artist={artist}
        activeTab="source"
        onBack={() => navigate("/tracked")}
      />
    </div>
  );
};
