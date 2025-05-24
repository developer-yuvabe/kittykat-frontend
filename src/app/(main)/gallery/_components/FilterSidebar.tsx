"use client";

import React, { useState, useEffect } from "react";
import { Filter, Search, ChevronUp, ChevronDown, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BrandCampaignResponse, ProductCategory } from "@/types/gallery.types";
import { Separator } from "@/components/ui/separator";

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
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    campaign: true,
  });

  const [brandSearch, setBrandSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");

  useEffect(() => {
    if (selectedFilters) setFilters(selectedFilters);
  }, [selectedFilters]);

  const filteredBrands = brandsWithCampaigns.filter((brand) =>
    brand.brand_name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const allCampaigns = brandsWithCampaigns.flatMap((b) => b.campaigns);

  const filteredCampaigns = allCampaigns
    .filter((c) => c.title.toLowerCase().includes(campaignSearch.toLowerCase()))
    .filter((c) => {
      if (filters.brands.length === 0) return true;
      return brandsWithCampaigns
        .filter((b) => filters.brands.includes(b.brand_id))
        .some((b) => b.campaigns.find((bc) => bc.id === c.id));
    })
    .filter((c, i, self) => self.findIndex((x) => x.id === c.id) === i);

  const toggleSection = (section: "brand" | "campaign") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleBrand = (brand_id: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand_id)
        ? prev.brands.filter((b) => b !== brand_id)
        : [...prev.brands, brand_id],
    }));
  };

  const toggleCampaign = (campaign_id: string) => {
    setFilters((prev) => ({
      ...prev,
      campaigns: prev.campaigns.includes(campaign_id)
        ? prev.campaigns.filter((c) => c !== campaign_id)
        : [...prev.campaigns, campaign_id],
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClearAll = () => {
    setFilters({ brands: [], campaigns: [] });
    setBrandSearch("");
    setCampaignSearch("");
  };

  return (
    <div className="bg-white rounded-lg mt-3 border shadow-sm p-4 w-full max-w-xs">
      <div className="text-lg flex justify-between font-semibold mb-4  items-center gap-2">
        <div className="flex flex-row gap-x-2">
          <Filter />
          <span>FILTERS</span>
        </div>
        <div>
          <X size={16} onClick={() => setShowFilter(false)} />
        </div>
      </div>

      <Separator className="w-full" />

      {/* Brand Section */}
      <div className="border-b py-4 mb-4">
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
                {filters.brands.map((brand_id) => {
                  const brand = brandsWithCampaigns.find(
                    (b) => b.brand_id === brand_id
                  );
                  return (
                    brand && (
                      <div
                        key={brand.brand_id}
                        className="bg-purple-100 text-purple-700 text-xs rounded-full px-2 py-1 flex items-center"
                      >
                        {brand.brand_name}
                        <X
                          size={12}
                          className="ml-1 cursor-pointer"
                          onClick={() => toggleBrand(brand.brand_id)}
                        />
                      </div>
                    )
                  );
                })}
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
                    key={brand.brand_id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.brand_id}`}
                        checked={filters.brands.includes(brand.brand_id)}
                        onCheckedChange={() => toggleBrand(brand.brand_id)}
                        className="text-purple-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`brand-${brand.brand_id}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          filters.brands.includes(brand.brand_id)
                            ? "text-purple-600 font-medium"
                            : ""
                        )}
                      >
                        {brand.brand_name}
                      </label>
                    </div>
                    {filters.brands.includes(brand.brand_id) && (
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
                {filters.campaigns.map((campaign_id) => {
                  const campaign = allCampaigns.find(
                    (c) => c.id === campaign_id
                  );
                  return (
                    campaign && (
                      <div
                        key={campaign.id}
                        className="bg-purple-100 text-purple-700 text-xs rounded-full px-2 py-1 flex items-center"
                      >
                        {campaign.title}
                        <X
                          size={12}
                          className="ml-1 cursor-pointer"
                          onClick={() => toggleCampaign(campaign.id)}
                        />
                      </div>
                    )
                  );
                })}
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
                    key={campaign.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`campaign-${campaign.id}`}
                        checked={filters.campaigns.includes(campaign.id)}
                        onCheckedChange={() => toggleCampaign(campaign.id)}
                        className="text-purple-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <label
                        htmlFor={`campaign-${campaign.id}`}
                        className={cn(
                          "text-sm cursor-pointer",
                          filters.campaigns.includes(campaign.id)
                            ? "text-purple-600 font-medium"
                            : ""
                        )}
                      >
                        {campaign.title}
                      </label>
                    </div>
                    {filters.campaigns.includes(campaign.id) && (
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
