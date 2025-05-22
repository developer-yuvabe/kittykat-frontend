"use client";

import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
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
  selectedFilters: {
    brands: string[];
    categories: string[];
    campaigns: string[];
  };
}

export function SearchFilters({
  onSearchChange,
  onSourceChange,
  onCreatorChange,
  onFavoritesChange,
  onToggleFilters,
  source,
  creator,
  favorites,
  showFilters,
  selectedFilters,
}: SearchFiltersProps) {
  const hasActiveFilters =
    selectedFilters.brands.length > 0 ||
    selectedFilters.categories.length > 0 ||
    selectedFilters.campaigns.length > 0;

  return (
    <div className="flex flex-col gap-3 mb-6 relative">
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

        {/* <div className="flex flex-col mb-5">
          <p className="text-sm font-semibold mb-1">Source</p>
          <Select value={source} onValueChange={onSourceChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Uploaded">Uploaded</SelectItem>
              <SelectItem value="a2iimages">a2iimages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col mb-5">
          <p className="text-sm font-semibold mb-1">Creator</p>
          <Select value={creator} onValueChange={onCreatorChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Anyone">Anyone</SelectItem>
              <SelectItem value="Me">Me</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
        <div className="mt-1">
          {showFilters ? (
            <TooltipIconButton tooltip="Hide Filters" onClick={onToggleFilters}>
              <X size={24} />
            </TooltipIconButton>
          ) : (
            <TooltipIconButton tooltip="Show Filters" onClick={onToggleFilters}>
              <Filter size={24} />
            </TooltipIconButton>
          )}
        </div>
      </div>

      {/* {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedFilters.brands.map((brand) => (
            <Badge
              key={brand}
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              {brand} <X className="h-3 w-3 ml-1 cursor-pointer" />
            </Badge>
          ))}
          {selectedFilters.campaigns.map((campaign) => (
            <Badge
              key={campaign}
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              {campaign} <X className="h-3 w-3 ml-1 cursor-pointer" />
            </Badge>
          ))}
        </div>
      )} */}
    </div>
  );
}
