"use client";

import { useState, useCallback } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { TasklistFilters } from "@/types/tasklist.types";
import { TaskListActiveFilters } from "./TaskListActiveFilters";
import { TaskListFilterPopover } from "./TaskListFilterPopover";

interface TaskListFiltersProps {
  filters: TasklistFilters;
  onFiltersChange: (filters: TasklistFilters) => void;
  isAdmin: boolean;
  availableBrands?: Array<{ id: string; name: string }>;
  availableCampaigns?: Array<{ id: string; name: string; brand_id: string }>;
  className?: string;
}

// Filter Popover Component

// Main Component
export const TaskListFilters = ({
  filters,
  onFiltersChange,
  isAdmin,
  availableBrands = [],
  availableCampaigns = [],
  className,
}: TaskListFiltersProps) => {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<TasklistFilters>(filters);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onFiltersChange({
        ...filters,
        search: value || undefined,
        page: 1, // Reset to first page when searching
      });
    }, 300),
    [filters, onFiltersChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleApplyFilters = () => {
    onFiltersChange({
      ...tempFilters,
      search: searchValue || undefined,
      page: 1,
    });
    setIsFilterOpen(false);
  };

  const handleCancelFilters = () => {
    setTempFilters(filters);
    setIsFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    const clearedFilters = { page: 1, page_size: filters.page_size };
    setTempFilters(clearedFilters);
  };

  const clearAllFilters = () => {
    setSearchValue("");
    onFiltersChange({ page: 1, page_size: filters.page_size });
  };

  const removeFilter = (key: keyof TasklistFilters, value?: string) => {
    const newFilters = { ...filters };

    if (key === "search") {
      setSearchValue("");
    } else if (key === "asset_expert_statuses" && value) {
      const newStatuses = filters.asset_expert_statuses?.filter(
        (s) => s !== value
      );
      newFilters.asset_expert_statuses = newStatuses?.length
        ? newStatuses
        : undefined;
    } else if (key === "brand_ids" && value) {
      const newBrandIds = filters.brand_ids?.filter((id) => id !== value);
      newFilters.brand_ids = newBrandIds?.length ? newBrandIds : undefined;
      newFilters.campaign_ids = undefined; // Clear campaigns when removing a brand
    } else if (key === "campaign_ids" && value) {
      const newCampaignIds = filters.campaign_ids?.filter((id) => id !== value);
      newFilters.campaign_ids = newCampaignIds?.length
        ? newCampaignIds
        : undefined;
    } else {
      delete newFilters[key];
    }

    onFiltersChange({ ...newFilters, page: 1 });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.asset_expert_statuses?.length) count++;
    if (filters.brand_ids?.length) count++;
    if (filters.campaign_ids?.length) count++;
    if (filters.submitted_by) count++;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Update temp filters when the popover opens
  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setTempFilters(filters);
    }
    setIsFilterOpen(open);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Search and Filter Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasklists, assets, or requesters..."
            className="pl-9"
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}

          <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs px-1.5 py-0.5"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <TaskListFilterPopover
              filters={filters}
              tempFilters={tempFilters}
              setTempFilters={setTempFilters}
              onApply={handleApplyFilters}
              onCancel={handleCancelFilters}
              onClearAll={handleClearAllFilters}
              isAdmin={isAdmin}
              availableBrands={availableBrands}
              availableCampaigns={availableCampaigns}
            />
          </Popover>
        </div>
      </div>

      {/* Active Filters Preview */}
      <TaskListActiveFilters
        filters={filters}
        onRemoveFilter={removeFilter}
        availableBrands={availableBrands}
        availableCampaigns={availableCampaigns}
      />
    </div>
  );
};
