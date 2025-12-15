import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const GlobalTopBar = () => {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Search */}
      <div className="flex flex-1 gap-2 items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8 border-none bg-muted/50 focus-visible:bg-background focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex gap-2 items-center">
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
