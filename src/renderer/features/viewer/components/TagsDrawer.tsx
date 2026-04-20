import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { Virtuoso } from "react-virtuoso";
import log from "electron-log/renderer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription as SheetDesc,
} from "../../../components/ui/sheet";
import { Button } from "../../../components/ui/button";
import type { Post, Artist } from "../../../../main/db/schema";
import { EXTERNAL_ARTIST_ID } from "../../../../shared/constants";
import { useSearchStore } from "../../../store/searchStore";
import { useViewerStore } from "../../../store/viewerStore";
import type { ViewerQueue } from "../../../store/viewerStore";

type TagsDrawerProps = {
  post: Post;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isFromBrowse?: boolean;
  queue: ViewerQueue | null;
};

export function TagsDrawer({
  post,
  isOpen,
  onOpenChange,
  isFromBrowse: _isFromBrowse = false,
  queue: _queue,
}: TagsDrawerProps) {
  const navigate = useNavigate();
  const setQuery = useSearchStore((state) => state.setQuery);

  const { data: artists } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => window.api.getTrackedArtists(),
    enabled: isOpen,
  });

  const artist = useMemo(() => {
    if (!artists || !post.artistId || post.artistId === EXTERNAL_ARTIST_ID) {
      return null;
    }
    const found = artists.find((a) => a.id === post.artistId);
    if (post.artistId && post.artistId !== EXTERNAL_ARTIST_ID && !found) {
      log.warn(`[TagsDrawer] Artist not found for post.artistId: ${post.artistId}`);
    }
    return found || null;
  }, [artists, post.artistId]);

  const tagsString = typeof post?.tags === "string" ? post.tags : "";
  const hasKnownArtist = !!artist;

  const { data: resolvedArtistTags = [] } = useQuery<string[]>({
    queryKey: ["resolve-tags-ipc", tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(" ").filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];
      return await window.api.resolveTags(tagsToAsk);
    },
    enabled: !!post && !hasKnownArtist && tagsString.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  const { data: resolvedCharacterTags = [] } = useQuery<string[]>({
    queryKey: ["resolve-character-tags-ipc", tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(" ").filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];
      return await window.api.resolveCharacterTags(tagsToAsk);
    },
    enabled: !!post && tagsString.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  const { data: resolvedCopyrightTags = [] } = useQuery<string[]>({
    queryKey: ["resolve-copyright-tags-ipc", tagsString],
    queryFn: async () => {
      if (!tagsString) return [];
      const tagsToAsk = tagsString.split(" ").filter((t: string) => t.length > 0);
      if (tagsToAsk.length === 0) return [];
      return await window.api.resolveCopyrightTags(tagsToAsk);
    },
    enabled: !!post && tagsString.length > 0,
    staleTime: Infinity,
    retry: false,
  });

  const groupedTags = useMemo(() => {
    const allTags: string[] = post?.tags
      ? typeof post.tags === "string"
        ? post.tags.split(" ").filter((t) => t.length > 0)
        : Array.isArray(post.tags)
          ? post.tags
          : []
      : [];

    const copyright: string[] =
      resolvedCopyrightTags.length > 0
        ? allTags.filter((t) =>
            resolvedCopyrightTags.some((r) => r.toLowerCase() === t.toLowerCase())
          )
        : [];

    const character: string[] =
      resolvedCharacterTags.length > 0
        ? allTags.filter((t) =>
            resolvedCharacterTags.some((r) => r.toLowerCase() === t.toLowerCase())
          )
        : [];

    const artistTags: string[] = [];
    if (artist?.tag) {
      artistTags.push(artist.tag);
    }
    if (resolvedArtistTags.length > 0) {
      const apiTags = allTags.filter((t) =>
        resolvedArtistTags.some((r) => r.toLowerCase() === t.toLowerCase())
      );
      artistTags.push(...apiTags);
    }
    const uniqueArtist = [...new Set(artistTags)];

    const specialTags = new Set([
      ...copyright.map((t) => t.toLowerCase()),
      ...character.map((t) => t.toLowerCase()),
      ...uniqueArtist.map((t) => t.toLowerCase()),
    ]);
    const general = allTags.filter((t) => !specialTags.has(t.toLowerCase()));

    return {
      artist: uniqueArtist,
      character,
      copyright,
      general,
    };
  }, [
    post.tags,
    artist,
    resolvedArtistTags,
    resolvedCharacterTags,
    resolvedCopyrightTags,
  ]);

  const {
    artist: artistTags,
    character: characterTags,
    copyright: copyrightTags,
    general: generalTags,
  } = groupedTags;

  const { close: closeViewer } = useViewerStore(
    useShallow((state) => ({
      close: state.close,
    }))
  );

  const handleTagClick = (tag: string) => {
    closeViewer();
    onOpenChange(false);
    setQuery(tag);
    navigate("/browse");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Post Metadata</SheetTitle>
          <SheetDesc>Post ID: {post.postId}</SheetDesc>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {post.publishedAt && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Published</h3>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  let date: Date;
                  if (post.publishedAt instanceof Date) {
                    date = post.publishedAt;
                  } else if (typeof post.publishedAt === "number") {
                    date = new Date(post.publishedAt);
                  } else if (typeof post.publishedAt === "string") {
                    date = new Date(post.publishedAt);
                  } else {
                    return "Unknown";
                  }
                  if (isNaN(date.getTime())) return "Unknown";
                  return date.toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                })()}
              </p>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Copyright</h3>
            {copyrightTags.length > 0 ? (
              <div className="space-y-1">
                {copyrightTags.map((tag, index) => (
                  <Button
                    key={`copyright-${tag}-${index}`}
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-purple-600"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No copyright detected</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Character</h3>
            {characterTags.length > 0 ? (
              <div className="space-y-1">
                {characterTags.map((tag, index) => (
                  <Button
                    key={`character-${tag}-${index}`}
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-green-600"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No character detected</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Artist</h3>
            {artistTags.length > 0 ? (
              <div className="space-y-1">
                {artistTags.map((tag, index) => (
                  <Button
                    key={`artist-${tag}-${index}`}
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-red-600"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No artist detected</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Tags ({generalTags.length})</h3>
            <div className="max-h-[400px] h-[400px] overflow-hidden rounded-md border">
              <Virtuoso
                className="h-full"
                data={generalTags}
                components={{
                  Header: undefined,
                }}
                itemContent={(_index, tag) => {
                  return (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-auto justify-start rounded-none px-3 py-2 text-sm font-normal border-b last:border-b-0"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Button>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
