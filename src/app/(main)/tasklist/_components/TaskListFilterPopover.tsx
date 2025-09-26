import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PopoverContent } from "@/components/ui/popover";
import { TASKLIST_STATUS_OPTIONS } from "@/lib/tasklist.service";
import { TasklistFilters, TasklistStatus } from "@/types/tasklist.types";
import { TaskListDateRange } from "./TaskListDateRange";

interface TaskListFilterPopoverProps {
  filters: TasklistFilters;
  tempFilters: TasklistFilters;
  setTempFilters: (filters: TasklistFilters) => void;
  onApply: () => void;
  onCancel: () => void;
  onClearAll: () => void;
  isAdmin: boolean;
  availableBrands: Array<{ id: string; name: string }>;
  availableCampaigns: Array<{ id: string; name: string; brand_id: string }>;
}

export const TaskListFilterPopover = ({
  tempFilters,
  setTempFilters,
  onApply,
  onCancel,
  onClearAll,
  isAdmin,
  availableBrands,
  availableCampaigns,
}: TaskListFilterPopoverProps) => {
  // Filter campaigns based on selected brands in temp filters
  const filteredCampaigns = availableCampaigns.filter(
    (campaign) =>
      !tempFilters.brand_ids?.length ||
      tempFilters.brand_ids.includes(campaign.brand_id)
  );

  const handleBrandChange = (brandIds: string[]) => {
    setTempFilters({
      ...tempFilters,
      brand_ids: brandIds.length > 0 ? brandIds : undefined,
      campaign_ids: undefined, // Clear campaign filter when brand changes
    });
  };

  const handleCampaignChange = (campaignIds: string[]) => {
    setTempFilters({
      ...tempFilters,
      campaign_ids: campaignIds.length > 0 ? campaignIds : undefined,
    });
  };

  const handleStatusChange = (statuses: string[]) => {
    setTempFilters({
      ...tempFilters,
      asset_expert_statuses:
        statuses.length > 0 ? (statuses as TasklistStatus[]) : undefined,
    });
  };

  const handleSubmittedByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFilters({
      ...tempFilters,
      submitted_by: e.target.value || undefined,
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setTempFilters({
      ...tempFilters,
      date_from: date ? date.toISOString() : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setTempFilters({
      ...tempFilters,
      date_to: date ? date.toISOString() : undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (tempFilters.asset_expert_statuses?.length) count++;
    if (tempFilters.brand_ids?.length) count++;
    if (tempFilters.campaign_ids?.length) count++;
    if (tempFilters.submitted_by) count++;
    if (tempFilters.date_from) count++;
    if (tempFilters.date_to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <PopoverContent className="w-[450px] p-0" align="end">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Filters</h4>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <MultiSelect
            value={tempFilters.asset_expert_statuses || []}
            onValueChange={handleStatusChange}
            maxCount={TASKLIST_STATUS_OPTIONS.length}
          >
            <MultiSelectTrigger className="w-full">
              <MultiSelectValue
                placeholder="Select statuses"
                maxDisplay={2}
                maxItemLength={16}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectSearch placeholder="Search statuses..." />
              <MultiSelectList>
                <MultiSelectEmpty>No statuses found</MultiSelectEmpty>
                {TASKLIST_STATUS_OPTIONS.map((status, index) => (
                  <MultiSelectItem
                    key={`status-${status.value}-${index}`}
                    value={status.value}
                    label={status.label}
                  >
                    <div>
                      <div className="font-medium">{status.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {status.description}
                      </div>
                    </div>
                  </MultiSelectItem>
                ))}
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
        </div>

        {/* Brand Filter (Admin only or if brands available) */}
        {(isAdmin || availableBrands.length > 0) && (
          <div className="space-y-2">
            <Label>Brands</Label>
            <MultiSelect
              value={tempFilters.brand_ids || []}
              onValueChange={handleBrandChange}
              maxCount={availableBrands.length}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  placeholder="Select brands"
                  maxDisplay={2}
                  maxItemLength={16}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Search brands..." />
                <MultiSelectList>
                  <MultiSelectEmpty>No brands found</MultiSelectEmpty>
                  {availableBrands.map((brand) => (
                    <MultiSelectItem
                      key={brand.id}
                      value={brand.id}
                      label={brand.name}
                    >
                      {brand.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        )}

        {/* Campaign Filter */}
        {filteredCampaigns.length > 0 && (
          <div className="space-y-2">
            <Label>Campaigns</Label>
            <MultiSelect
              value={tempFilters.campaign_ids || []}
              onValueChange={handleCampaignChange}
              maxCount={filteredCampaigns.length}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  placeholder="Select campaigns"
                  maxDisplay={2}
                  maxItemLength={16}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Search campaigns..." />
                <MultiSelectList>
                  <MultiSelectEmpty>No campaigns found</MultiSelectEmpty>
                  {filteredCampaigns.map((campaign, index) => (
                    <MultiSelectItem
                      key={`campaign-${campaign.id}-${index}`}
                      value={campaign.id}
                      label={campaign.name}
                    >
                      {campaign.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        )}

        {/* Submitted By Filter (Admin only) */}
        {isAdmin && (
          <div className="space-y-2">
            <Label>Submitted By</Label>
            <Input
              placeholder="User ID or name"
              value={tempFilters.submitted_by || ""}
              onChange={handleSubmittedByChange}
            />
          </div>
        )}

        {/* Date Range Filters */}
        <TaskListDateRange
          dateFrom={tempFilters.date_from}
          dateTo={tempFilters.date_to}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />
      </div>

      {/* Apply/Cancel Buttons */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancel
          </Button>
          <Button onClick={onApply} className="w-full">
            Apply
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
};
