import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { useSearchStore } from "../../store/searchStore";

export const GlobalTopBar = () => {
  const { searchQuery, setSearchQuery } = useSearchStore();

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex flex-1 gap-2 items-center max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2 items-center">
        {/* Placeholder for right actions */}
      </div>
    </header>
  );
};
