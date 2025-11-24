"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { EnhancedSelectedFilters } from "@/types/gallery.types";

import { useGalleryFilterStore } from "@/store/gallery-filter.store";

interface MediaSearchFiltersProps {
  onSearchChange: (query: string) => void;
  onSourceChange: (source: string) => void;
  onCreatorChange: (creator: string) => void;
  onToggleFilters: () => void;
  source: string;
  creator: string;
  showFilters: boolean;
  selectedFilters: EnhancedSelectedFilters;
  setSelectedFilters: (filters: EnhancedSelectedFilters) => void;
  isMediaSelectDialog?: boolean; // Add this prop
}

export function MediaSearchFilters({
  onSearchChange,
  showFilters,
  isMediaSelectDialog = false, // Default to false
}: MediaSearchFiltersProps) {
  const { favorites, setFavorites } = useGalleryFilterStore();
  return (
    <div className="flex flex-col gap-3 mb-3 mt-3 relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className={`pl-9 w-[${showFilters ? "400px" : "300px"}]`}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {isMediaSelectDialog && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="favorites"
              checked={favorites}
              onCheckedChange={(checked) => setFavorites(checked as boolean)}
            />
            <label htmlFor="favorites" className="text-sm cursor-pointer">
              Favorites only
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
