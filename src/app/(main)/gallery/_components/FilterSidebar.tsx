"use client";

import React, { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectSearch,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectEmpty,
} from "@/components/ui/multi-select";
import {
  BrandCampaignResponse,
  EnhancedSelectedFilters,
  ProductCategory,
} from "@/types/gallery.types";

import { Checkbox } from "@/components/ui/checkbox";
import {
  ASPECT_RATIO_OPTIONS,
  ASSET_TYPE_OPTIONS,
  getActiveFiltersCount,
  MEDIA_FORMAT_OPTIONS,
  WORKFLOW_STATUS_OPTIONS,
} from "@/lib/gallery.utils";
import { ExpandableCard } from "@/components/ui/expandable-card";

interface FilterSidebarProps {
  selectedFilters: EnhancedSelectedFilters;
  onApply: (filters: EnhancedSelectedFilters) => void;
  brandsWithCampaigns: BrandCampaignResponse[];
  product_categories: ProductCategory[];
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterSidebar({
  selectedFilters,
  onApply,
  brandsWithCampaigns,
  product_categories,
  setShowFilter,
}: FilterSidebarProps) {
  const [filters, setFilters] =
    useState<EnhancedSelectedFilters>(selectedFilters);

  useEffect(() => {
    if (selectedFilters) setFilters(selectedFilters);
  }, [selectedFilters]);

  const activeFiltersCount = getActiveFiltersCount(filters);

  // Get all campaigns and filter based on selected brands
  const allCampaigns = brandsWithCampaigns.flatMap((b) => b.campaigns);
  const filteredCampaigns = allCampaigns
    .filter((c) => {
      if (filters.brands.length === 0) return true;
      return brandsWithCampaigns
        .filter((b) => filters.brands.includes(b.brand_id))
        .some((b) => b.campaigns.find((bc) => bc.id === c.id));
    })
    .filter((c, i, self) => self.findIndex((x) => x.id === c.id) === i);

  const handleApply = () => {
    onApply(filters);
  };

  const handleClearAll = () => {
    const cleared: EnhancedSelectedFilters = {
      brands: [],
      campaigns: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
      has_product: undefined,
      has_people: undefined,
      has_lifestyle_context: undefined,
      is_favourite: undefined,
      is_archived: undefined,
    };
    setFilters(cleared);
    onApply(cleared);
  };

  // Handler functions for different filter types
  const handleBrandChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, brands: values }));
  };

  const handleCampaignChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, campaigns: values }));
  };

  const handleCategoryChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, product_categories: values }));
  };

  const handleAssetTypeChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, asset_types: values }));
  };

  const handleMediaFormatChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, media_format: values }));
  };

  const handleAspectRatioChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, aspect_ratio: values }));
  };

  const handleWorkflowStatusChange = (values: string[]) => {
    setFilters((prev) => ({ ...prev, workflow_status: values }));
  };

  const handleBooleanFilterChange = (
    key: keyof Pick<
      EnhancedSelectedFilters,
      | "has_product"
      | "has_people"
      | "has_lifestyle_context"
      | "is_favourite"
      | "is_archived"
    >,
    value: boolean | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    console.log("Filters updated:", filters);
  }, [filters]);

  return (
    <div className="bg-white rounded-lg mt-3 border shadow-sm w-full max-w-xs flex flex-col h-[70vh]">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="text-lg flex justify-between font-semibold items-center gap-2">
          <div className="flex flex-row gap-x-2 items-center">
            <div className="relative">
              <Filter />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <span>FILTERS</span>
          </div>
          <div>
            <X
              size={16}
              className="cursor-pointer hover:text-gray-600"
              onClick={() => setShowFilter(false)}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Brand Section */}
        <div>
          <h3 className="font-medium mb-3">Brand</h3>
          <MultiSelect
            value={filters.brands}
            onValueChange={handleBrandChange}
            maxCount={10}
          >
            <MultiSelectTrigger className="w-full">
              <MultiSelectValue
                placeholder="Select brands..."
                maxDisplay={2}
                maxItemLength={20}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectSearch placeholder="Search brands..." />
              <MultiSelectList>
                <MultiSelectEmpty>No brands found</MultiSelectEmpty>
                {brandsWithCampaigns.map((brand) => (
                  <MultiSelectItem
                    key={brand.brand_id}
                    value={brand.brand_id}
                    label={brand.brand_name}
                  >
                    {brand.brand_name}
                  </MultiSelectItem>
                ))}
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
        </div>

        {/* Campaign Section */}
        <div>
          <h3 className="font-medium mb-3">Campaign</h3>
          <MultiSelect
            value={filters.campaigns}
            onValueChange={handleCampaignChange}
            maxCount={10}
          >
            <MultiSelectTrigger className="w-full">
              <MultiSelectValue
                placeholder="Select campaigns..."
                maxDisplay={2}
                maxItemLength={20}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectSearch placeholder="Search campaigns..." />
              <MultiSelectList>
                <MultiSelectEmpty>No campaigns found</MultiSelectEmpty>
                {filteredCampaigns.map((campaign) => (
                  <MultiSelectItem
                    key={campaign.id}
                    value={campaign.id}
                    label={campaign.title}
                  >
                    {campaign.title}
                  </MultiSelectItem>
                ))}
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
        </div>

        {/* Product Categories Section */}
        <div>
          <h3 className="font-medium mb-3">Product Line</h3>
          <MultiSelect
            value={filters.product_categories}
            onValueChange={handleCategoryChange}
            maxCount={10}
          >
            <MultiSelectTrigger className="w-full">
              <MultiSelectValue
                placeholder="Select categories..."
                maxDisplay={2}
                maxItemLength={20}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectSearch placeholder="Search categories..." />
              <MultiSelectList>
                <MultiSelectEmpty>No categories found</MultiSelectEmpty>
                {product_categories.map((category) => (
                  <MultiSelectItem
                    key={category.id}
                    value={category.name}
                    label={category.name}
                  >
                    {category.name}
                  </MultiSelectItem>
                ))}
              </MultiSelectList>
            </MultiSelectContent>
          </MultiSelect>
        </div>

        {/* Asset Source Section */}
        <div>
          <h3 className="font-medium mb-3">Asset Types</h3>
          <MultiSelect
            value={filters.asset_types}
            onValueChange={handleAssetTypeChange}
            maxCount={10}
          >
            <MultiSelectTrigger className="w-full">
              <MultiSelectValue
                placeholder="Select sources..."
                maxDisplay={2}
                maxItemLength={15}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              <MultiSelectSearch placeholder="Search sources..." />
              <MultiSelectList>
                <MultiSelectEmpty>No sources found</MultiSelectEmpty>
                {ASSET_TYPE_OPTIONS.map((option) => (
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

        {/* Content & Workflow Expandable Card */}
        <ExpandableCard title="Content & Workflow" defaultExpanded={false}>
          {/* Workflow Status Section */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-sm">Workflow Status</h4>
            <div className="space-y-3">
              {WORKFLOW_STATUS_OPTIONS.map((option) => {
                const isChecked = filters.workflow_status?.includes(
                  option.value
                );

                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`workflow-status-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newValues = filters.workflow_status
                          ? [...filters.workflow_status]
                          : [];
                        if (checked) {
                          if (!newValues.includes(option.value)) {
                            newValues.push(option.value);
                          }
                        } else {
                          newValues = newValues.filter(
                            (v) => v !== option.value
                          );
                        }
                        handleWorkflowStatusChange(newValues);
                      }}
                    />
                    <label
                      htmlFor={`workflow-status-${option.value}`}
                      className="text-sm font-medium leading-none"
                    >
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Features Section */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Content Features</h4>
            <div className="space-y-3">
              {[
                { id: "has_product", label: "Has Product" },
                { id: "has_people", label: "Has People" },
                { id: "has_lifestyle_context", label: "Lifestyle Context" },
              ].map((feature) => {
                const isChecked =
                  filters[feature.id as keyof EnhancedSelectedFilters] === true;
                return (
                  <div key={feature.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleBooleanFilterChange(
                          feature.id as
                            | "has_product"
                            | "has_people"
                            | "has_lifestyle_context",
                          checked ? true : undefined
                        )
                      }
                    />
                    <label
                      htmlFor={`feature-${feature.id}`}
                      className="text-sm font-medium leading-none"
                    >
                      {feature.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </ExpandableCard>

        {/* Technical Details Expandable Card */}
        <ExpandableCard title="Technical Details" defaultExpanded={false}>
          {/* File Format Section */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-sm">File Format</h4>
            <MultiSelect
              value={filters.media_format}
              onValueChange={handleMediaFormatChange}
              maxCount={10}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  placeholder="Select formats..."
                  maxDisplay={2}
                  maxItemLength={10}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Search formats..." />
                <MultiSelectList>
                  <MultiSelectEmpty>No formats found</MultiSelectEmpty>
                  {MEDIA_FORMAT_OPTIONS.map((option) => (
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

          {/* Aspect Ratio Section */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Aspect Ratio</h4>
            <MultiSelect
              value={filters.aspect_ratio}
              onValueChange={handleAspectRatioChange}
              maxCount={10}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue
                  placeholder="Select ratios..."
                  maxDisplay={2}
                  maxItemLength={15}
                />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Search ratios..." />
                <MultiSelectList>
                  <MultiSelectEmpty>No ratios found</MultiSelectEmpty>
                  {ASPECT_RATIO_OPTIONS.map((option) => (
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
        </ExpandableCard>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
