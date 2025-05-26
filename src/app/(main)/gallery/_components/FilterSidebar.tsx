"use client";

import React, { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { ProductCategory } from "@/types/gallery.types";

interface Campaign {
  id: string;
  title: string;
}

interface BrandCampaignResponse {
  brand_id: string;
  brand_name: string;
  campaigns: Campaign[];
}

interface FilterSidebarProps {
  selectedFilters: {
    brands: string[]; // brand_ids
    campaigns: string[]; // campaign_ids
  };
  onApply: (filters: { brands: string[]; campaigns: string[] }) => void;
  brandsWithCampaigns: BrandCampaignResponse[];
  product_categories: ProductCategory[];
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterSidebar({
  selectedFilters,
  onApply,
  brandsWithCampaigns,
  setShowFilter,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState(selectedFilters);

  useEffect(() => {
    if (selectedFilters) setFilters(selectedFilters);
  }, [selectedFilters]);

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
    const cleared = { brands: [], campaigns: [] };
    setFilters(cleared);
    onApply(cleared); // apply immediately with cleared filters
  };

  const handleBrandChange = (values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      brands: values,
    }));
  };

  const handleCampaignChange = (values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      campaigns: values,
    }));
  };

  return (
    <div className="bg-white rounded-lg mt-3 border shadow-sm p-4 w-full max-w-xs">
      <div className="text-lg flex justify-between font-semibold mb-4 items-center gap-2">
        <div className="flex flex-row gap-x-2">
          <Filter />
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

      <Separator className="w-full mb-4" />

      {/* Brand Section */}
      <div className="mb-6">
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
                  value={`${brand.brand_id}`}
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
      <div className="mb-6">
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

      <div className="space-y-2 mt-auto">
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleApply}
        >
          Apply
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
  );
}
