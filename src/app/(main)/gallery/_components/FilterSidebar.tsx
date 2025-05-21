"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search, ChevronUp, ChevronDown, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Define the types for our data
interface BrandCampaignResponse {
  brand_name: string;
  campaigns: string[];
}

interface FilterSidebarProps {
  selectedFilters: {
    brands: string[];
    campaigns: string[];
  };
  onApply: (filters: any) => void;
  brandsWithCampaigns: BrandCampaignResponse[];
}

export default function FilterSidebar({
  selectedFilters,
  onApply,
  brandsWithCampaigns,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState(
    selectedFilters || { brands: [], campaigns: [] }
  );
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    campaign: true,
  });

  const [brandSearch, setBrandSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");

  // Update local state when props change
  useEffect(() => {
    if (selectedFilters) {
      setFilters(selectedFilters);
    }
  }, [selectedFilters]);

  // Filter brands based on search
  const filteredBrands = brandsWithCampaigns
    .map((brand) => brand.brand_name)
    .filter((brand) => brand.toLowerCase().includes(brandSearch.toLowerCase()));

  // Get all campaigns from all brands
  const allCampaigns = brandsWithCampaigns.flatMap((brand) => brand.campaigns);

  // Filter campaigns based on search and selected brands
  const filteredCampaigns = allCampaigns
    .filter((campaign) =>
      campaign.toLowerCase().includes(campaignSearch.toLowerCase())
    )
    // If brands are selected, only show campaigns from those brands
    .filter((campaign) => {
      if (filters.brands.length === 0) return true;
      return brandsWithCampaigns
        .filter((brand) => filters.brands.includes(brand.brand_name))
        .some((brand) => brand.campaigns.includes(campaign));
    })
    // Remove duplicates
    .filter((campaign, index, self) => self.indexOf(campaign) === index);

  const toggleSection = (section: "brand" | "campaign") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleBrand = (brand: string) => {
    setFilters((prev) => {
      if (prev.brands.includes(brand)) {
        return {
          ...prev,
          brands: prev.brands.filter((b) => b !== brand),
        };
      } else {
        return {
          ...prev,
          brands: [...prev.brands, brand],
        };
      }
    });
  };

  const toggleCampaign = (campaign: string) => {
    setFilters((prev) => {
      if (prev.campaigns.includes(campaign)) {
        return {
          ...prev,
          campaigns: prev.campaigns.filter((c) => c !== campaign),
        };
      } else {
        return {
          ...prev,
          campaigns: [...prev.campaigns, campaign],
        };
      }
    });
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClearAll = () => {
    setFilters({
      brands: [],
      campaigns: [],
    });
    setBrandSearch("");
    setCampaignSearch("");
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 w-full max-w-xs">
      <div className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5" />
        <span>FILTERS</span>
      </div>

      {/* Brand Section */}
      <div className="border-b pb-4 mb-4">
        <div
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection("brand")}
        >
          <h3 className="font-medium">Brand</h3>
          {expandedSections.brand ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>

        {expandedSections.brand && (
          <>
            <div className="mb-3">
              <div className="flex gap-1 mb-2 flex-wrap">
                {filters.brands.map((brand) => (
                  <div
                    key={brand}
                    className="bg-purple-100 text-purple-700 text-xs rounded-full px-2 py-1 flex items-center"
                  >
                    {brand}
                    <X
                      size={12}
                      className="ml-1 cursor-pointer"
                      onClick={() => toggleBrand(brand)}
                    />
                  </div>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search brands"
                  className="pl-8 text-sm"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={filters.brands.includes(brand)}
                        onCheckedChange={() => toggleBrand(brand)}
                        className="text-purple-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`brand-${brand}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          filters.brands.includes(brand)
                            ? "text-purple-600 font-medium"
                            : ""
                        )}
                      >
                        {brand}
                      </label>
                    </div>
                    {filters.brands.includes(brand) && (
                      <Check size={16} className="text-purple-600" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Campaign Section */}
      <div className="pb-4 mb-4">
        <div
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection("campaign")}
        >
          <h3 className="font-medium">Campaign</h3>
          {expandedSections.campaign ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>

        {expandedSections.campaign && (
          <>
            <div className="mb-3">
              <div className="flex gap-1 mb-2 flex-wrap">
                {filters.campaigns.map((campaign) => (
                  <div
                    key={campaign}
                    className="bg-purple-100 text-purple-700 text-xs rounded-full px-2 py-1 flex items-center"
                  >
                    {campaign}
                    <X
                      size={12}
                      className="ml-1 cursor-pointer"
                      onClick={() => toggleCampaign(campaign)}
                    />
                  </div>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns"
                  className="pl-8 text-sm"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-40">
              <div className="space-y-2 pr-4">
                {filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`campaign-${campaign}`}
                        checked={filters.campaigns.includes(campaign)}
                        onCheckedChange={() => toggleCampaign(campaign)}
                        className="text-purple-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`campaign-${campaign}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          filters.campaigns.includes(campaign)
                            ? "text-purple-600 font-medium"
                            : ""
                        )}
                      >
                        {campaign}
                      </label>
                    </div>
                    {filters.campaigns.includes(campaign) && (
                      <Check size={16} className="text-purple-600" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
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
