import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Filter,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSafeModeStore } from "../../store/safeModeStore";
import { useSearchStore } from "../../store/searchStore";
import { TagAutocomplete } from "../inputs/TagAutocomplete";
import { cn } from "../../lib/utils";
import log from "electron-log/renderer";

export const GlobalTopBar = () => {
  const location = useLocation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { safeMode, setSafeMode } = useSafeModeStore();
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const setActiveTab = useSearchStore((state) => state.setActiveTab);

  // Determine current tab from location
  useEffect(() => {
    const path = location.pathname;
    if (path === "/browse" || path === "/") {
      setActiveTab("browse");
    } else if (path === "/updates") {
      setActiveTab("updates");
    } else if (path === "/favorites") {
      setActiveTab("favorites");
    } else if (path === "/tracked" || path.startsWith("/artist/")) {
      setActiveTab("tracked");
    } else if (path === "/settings") {
      setActiveTab("settings");
    } else {
      setActiveTab(null);
    }
  }, [location.pathname, setActiveTab]);

  // Handle sync status
  useEffect(() => {
    const unsubscribeStart = window.api.onSyncStart(() => {
      setIsSyncing(true);
      setSyncMessage("Syncing...");
    });

    const unsubscribeEnd = window.api.onSyncEnd(() => {
      setIsSyncing(false);
      setSyncMessage(null);
    });

    const unsubscribeProgress = window.api.onSyncProgress((message) => {
      setSyncMessage(message);
    });

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
      unsubscribeProgress();
    };
  }, []);

  const handleSearch = () => {
    // Trigger search update - pages will react to query change via useEffect
    // The search query is already in the store, pages will refetch automatically
    // No need to navigate - search works in context of current tab
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    clearSearch();
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      log.info("[GlobalTopBar] Triggering Sync...");
      await window.api.syncAll();
    } catch (error) {
      log.error("[GlobalTopBar] Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Search */}
      <div className="flex flex-1 gap-2 items-center max-w-md">
        <TagAutocomplete
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          onTagSelect={handleSearch}
          onClear={handleClear}
          showClearButton={true}
          placeholder="Search posts by tags..."
          className="w-full"
        />
        <Button
          onClick={handleSearch}
          size="sm"
          variant="outline"
          className="h-9 text-xs"
        >
          Search
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2 items-center">
        {/* Safe Mode Toggle */}
        <Button
          variant={safeMode ? "default" : "outline"}
          size="sm"
          onClick={() => setSafeMode(!safeMode)}
          className={cn(
            "gap-2 h-9 text-xs",
            safeMode && "bg-primary text-primary-foreground"
          )}
          title={safeMode ? "Disable Safe Mode" : "Enable Safe Mode"}
        >
          <Shield className="w-3.5 h-3.5" />
          Safe
        </Button>

        <div className="mx-1 w-px h-4 bg-border" />

        {/* Sync Status */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="gap-2 h-9 text-xs"
          title={syncMessage || "Sync all artists"}
        >
          <RefreshCw
            className={cn(
              "w-3.5 h-3.5",
              isSyncing && "animate-spin"
            )}
          />
          {syncMessage ? (
            <span className="max-w-[100px] truncate text-xs">
              {syncMessage}
            </span>
          ) : (
            <span className="text-xs">Sync</span>
          )}
        </Button>

        <div className="mx-1 w-px h-4 bg-border" />

        {/* Sort Dropdown */}
        <Select defaultValue="date_desc">
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 opacity-70" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Date Added</SelectItem>
            <SelectItem value="id_desc">Post ID</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters Trigger */}
        <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </Button>

        <div className="mx-1 w-px h-4 bg-border" />

        {/* View Toggle */}
        <div className="flex items-center border rounded-md p-0.5 bg-muted/50">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-sm shadow-sm bg-background"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-sm hover:bg-background/50"
          >
            <LayoutList className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
};
