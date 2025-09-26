// Active Filters Component

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TASKLIST_STATUS_OPTIONS } from "@/lib/tasklist.service";
import { TasklistFilters } from "@/types/tasklist.types";
import { X } from "lucide-react";
import { format } from "date-fns";

interface TaskListActiveFiltersProps {
  filters: TasklistFilters;
  onRemoveFilter: (key: keyof TasklistFilters, value?: string) => void;
  availableBrands: Array<{ id: string; name: string }>;
  availableCampaigns: Array<{ id: string; name: string }>;
}

export const TaskListActiveFilters = ({
  filters,
  onRemoveFilter,
  availableBrands,
  availableCampaigns,
}: TaskListActiveFiltersProps) => {
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

  if (activeFiltersCount === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.search && (
        <Badge variant="outline" className="gap-1">
          Search: {filters.search}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter("search")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {filters.asset_expert_statuses?.map((status) => {
        const statusOption = TASKLIST_STATUS_OPTIONS.find(
          (s) => s.value === status
        );
        return (
          <Badge key={status} variant="outline" className="gap-1">
            Status: {statusOption?.label || status}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemoveFilter("asset_expert_statuses", status)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}

      {filters.brand_ids?.map((brandId) => {
        const brand = availableBrands.find((b) => b.id === brandId);
        return (
          <Badge key={brandId} variant="outline" className="gap-1">
            Brand: {brand?.name || brandId}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemoveFilter("brand_ids", brandId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}

      {filters.campaign_ids?.map((campaignId) => {
        const campaign = availableCampaigns.find((c) => c.id === campaignId);
        return (
          <Badge key={campaignId} variant="outline" className="gap-1">
            Campaign: {campaign?.name || campaignId}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemoveFilter("campaign_ids", campaignId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}

      {filters.submitted_by && (
        <Badge variant="outline" className="gap-1">
          Submitted By: {filters.submitted_by}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter("submitted_by")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {filters.date_from && (
        <Badge variant="outline" className="gap-1">
          From: {format(new Date(filters.date_from), "MMM dd, yyyy")}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter("date_from")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {filters.date_to && (
        <Badge variant="outline" className="gap-1">
          To: {format(new Date(filters.date_to), "MMM dd, yyyy")}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter("date_to")}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
};
