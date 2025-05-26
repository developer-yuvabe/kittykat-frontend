"use client";

import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { EnhancedSelectedFilters } from "./MediaLibrary";
interface SearchFiltersProps {
  onSearchChange: (query: string) => void;
  onSourceChange: (source: string) => void;
  onCreatorChange: (creator: string) => void;
  onFavoritesChange: (checked: boolean) => void;
  onToggleFilters: () => void;
  source: string;
  creator: string;
  favorites: boolean;
  showFilters: boolean;
  selectedFilters: EnhancedSelectedFilters;
}

export function SearchFilters({
  onSearchChange,
  onFavoritesChange,
  onToggleFilters,
  favorites,
  showFilters,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-6 mt-3 relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className={`pl-9 w-[${showFilters ? "400px" : "300px"}]`}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button
          variant="link"
          className="text-[#379AE6] underline underline-offset-2 whitespace-nowrap"
        >
          Image Search
        </Button>

        <div className="flex items-center gap-2">
          <Checkbox
            id="favorites"
            checked={favorites}
            onCheckedChange={(checked) => onFavoritesChange(checked as boolean)}
          />
          <label htmlFor="favorites" className="text-sm cursor-pointer">
            Favorites only
          </label>
        </div>
        <div className="mt-1">
          {!showFilters && (
            <TooltipIconButton tooltip="Show Filters" onClick={onToggleFilters}>
              <Filter size={24} />
            </TooltipIconButton>
          )}
        </div>
      </div>
    </div>
  );
}
