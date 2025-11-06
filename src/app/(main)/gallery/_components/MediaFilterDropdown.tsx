"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Funnel } from "lucide-react";
import { format } from "date-fns";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectSearch,
  MultiSelectEmpty,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { EnhancedSelectedFilters } from "@/types/gallery.types";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/gallery.utils";
import { Options } from "nuqs";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";

interface MediaFilterDropdownProps {
  selectedFilters: EnhancedSelectedFilters;
  setSelectedFilters: (filters: EnhancedSelectedFilters) => void;
  setInitialWorkflowStatus: (
    value: string[] | ((old: string[]) => string[] | null) | null,
    options?: Options
  ) => Promise<URLSearchParams>;
}

export function MediaFilterDropdown({
  selectedFilters,
  setSelectedFilters,
  setInitialWorkflowStatus,
}: MediaFilterDropdownProps) {
  const {
    favorites,
    hasComments,
    mediaTypes,
    workflowStatus,
    dateFrom,
    dateTo,
    setFavorites,
    setHasComments,
    setMediaTypes,
    setWorkflowStatus,
    setDateFrom,
    setDateTo,
    resetFilters,
  } = useGalleryFilterStore();
  const handleWorkflowStatusChange = (values: string[]) => {
    if (values.length === 0 || values.includes("__all__")) {
      setInitialWorkflowStatus([]);
      setWorkflowStatus([]);
      setSelectedFilters({
        ...selectedFilters,
        workflow_status: [],
      });
    } else {
      setInitialWorkflowStatus(values);
      setWorkflowStatus(values);
      setSelectedFilters({
        ...selectedFilters,
        workflow_status: values,
      });
    }
  };

  const handleMediaTypeChange = (type: string, checked: boolean) => {
    const updated = checked
      ? [...mediaTypes, type]
      : mediaTypes.filter((t) => t !== type);
    setMediaTypes(updated);
  };

  const handleResetFilters = () => {
    resetFilters();
    setInitialWorkflowStatus([]);
  };

  // Calculate active filters count from store
  const activeFiltersCount = Object.values({
    favorites,
    hasComments,
    mediaTypes,
    workflowStatus,
    dateFrom,
    dateTo,
  }).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value === true;
    if (value instanceof Date) return !!value;
    return false;
  }).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-md px-3 py-1.5 mr-2 relative">
          <Funnel className="w-4 h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-white border rounded-lg shadow-lg"
      >
        {/* Header */}
        <div className="border-b px-4 py-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Filters</h2>
          <button
            onClick={handleResetFilters}
            className="text-sm text-gray-500 hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Accordion Sections */}
        <Accordion
          type="multiple"
          defaultValue={["tags", "media", "status", "range"]}
          className="divide-y"
        >
          {/* Tags */}
          <AccordionItem value="tags">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Tags
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorites"
                  checked={favorites}
                  onCheckedChange={(checked) =>
                    setFavorites(checked as boolean)
                  }
                />
                <Label htmlFor="favorites" className="text-sm text-gray-700">
                  Favorites only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={hasComments}
                  onCheckedChange={(checked) =>
                    setHasComments(checked as boolean)
                  }
                />
                <Label htmlFor="comments" className="text-sm text-gray-700">
                  Has Comments only
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Media Type */}
          <AccordionItem value="media">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Media Type
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="images"
                  checked={mediaTypes.includes("image")}
                  onCheckedChange={(checked) =>
                    handleMediaTypeChange("image", checked as boolean)
                  }
                />
                <Label htmlFor="images" className="text-sm text-gray-700">
                  Images
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="videos"
                  checked={mediaTypes.includes("video")}
                  onCheckedChange={(checked) =>
                    handleMediaTypeChange("video", checked as boolean)
                  }
                />
                <Label htmlFor="videos" className="text-sm text-gray-700">
                  Videos
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Expert Status */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              KittyKat Expert Status
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <MultiSelect
                value={workflowStatus ?? []}
                onValueChange={handleWorkflowStatusChange}
                maxCount={WORKFLOW_STATUS_OPTIONS.length}
              >
                <MultiSelectTrigger className="w-full h-9 text-sm">
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
            </AccordionContent>
          </AccordionItem>

          {/* Created Range */}
          <AccordionItem value="range">
            <AccordionTrigger className="text-sm font-medium text-gray-800 px-4 hover:no-underline">
              Created range
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom && dateTo
                      ? `${format(dateFrom, "d MMM yyyy")} - ${format(
                          dateTo,
                          "d MMM yyyy"
                        )}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto " align="end" side="left">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    defaultMonth={dateFrom ?? new Date()}
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      setDateFrom(range?.from);
                      setDateTo(range?.to);
                    }}
                    className="rounded-lg border shadow-sm"
                  />
                </PopoverContent>
              </Popover>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
