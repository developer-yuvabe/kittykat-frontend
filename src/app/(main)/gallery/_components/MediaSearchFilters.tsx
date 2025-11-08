"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Options } from "nuqs";

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
  setInitialWorkflowStatus: (
    value: string[] | ((old: string[]) => string[] | null) | null,
    options?: Options
  ) => Promise<URLSearchParams>;
  isMediaSelectDialog?: boolean; // Add this prop
}

export function MediaSearchFilters({
  onSearchChange,
  showFilters,
  selectedFilters,
  setSelectedFilters,
  setInitialWorkflowStatus,
  isMediaSelectDialog = false, // Default to false
}: MediaSearchFiltersProps) {
  const { favorites, setFavorites } = useGalleryFilterStore();
  const handleWorkflowStatusChange = (values: string[]) => {
    // Handle empty selection (when user unselects all) or "__all__" selection
    if (values.length === 0 || values.includes("__all__")) {
      setInitialWorkflowStatus([]);
      // Also update the selectedFilters to reflect the change immediately
      setSelectedFilters({
        ...selectedFilters,
        workflow_status: [],
      });
    } else {
      setInitialWorkflowStatus(values);
      // Also update the selectedFilters to reflect the change immediately
      setSelectedFilters({
        ...selectedFilters,
        workflow_status: values,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-1 mt-3 relative">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            className={`pl-9 w-[${showFilters ? "400px" : "300px"}]`}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

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

        {/* Only show workflow status when NOT in media select dialog */}
        {!isMediaSelectDialog && (
          <div className="flex flex-col gap-1 mb-4">
            <Label
              htmlFor="workflow-status-select"
              className="flex items-center mb-1 justify-center "
            >
              Kittykat Expert Status
            </Label>
            <MultiSelect
              value={selectedFilters.workflow_status ?? []}
              onValueChange={handleWorkflowStatusChange}
              maxCount={WORKFLOW_STATUS_OPTIONS.length}
            >
              <MultiSelectTrigger className="min-w-30 max-w-96">
                <MultiSelectValue
                  placeholder="Select workflow status"
                  maxDisplay={1}
                  maxItemLength={16}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Select status..." />
                <MultiSelectList>
                  <MultiSelectEmpty>All Status</MultiSelectEmpty>
                  {WORKFLOW_STATUS_OPTIONS.map((option) => (
                    <MultiSelectItem
                      key={option.value}
                      value={option.value}
                      label={option.label}
                    >
                      {option.label}
                    </MultiSelectItem>
                  ))}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        )}
      </div>
    </div>
  );
}
