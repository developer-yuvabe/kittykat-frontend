"use client";

import React, { useState } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterSidebarProps {
  selectedFilters: {
    brands: string[];
    categories: string[];
    campaigns: string[];
  };
  onApply: (filters: any) => void;
}

export function FilterSidebar({
  selectedFilters,
  onApply,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState(selectedFilters);
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    category: true,
    campaign: true,
  });

  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");

  const brands = ["Tods", "Birkenstock", "Nike", "Adidas", "Puma"].filter(
    (brand) => brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const categories = [
    {
      name: "Shoes",
      count: null,
      subcategories: [
        { name: "Sandals", count: 2784 },
        { name: "Sneaker", count: 18367 },
      ],
    },
    {
      name: "Bottoms",
      count: null,
      subcategories: [
        { name: "Jeans", count: 837 },
        { name: "Skirts", count: 239 },
      ],
    },
    {
      name: "Tops",
      count: null,
      subcategories: [{ name: "T-Shirts", count: 54 }],
    },
  ];

  const campaigns = [
    "Valentines Day",
    "Summer Jam",
    "Mothers Day",
    "Winter Parade",
    "Sales Campaign 2025",
  ].filter((campaign) =>
    campaign.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const toggleSection = (section: "brand" | "category" | "campaign") => {
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

  const toggleCategory = (category: string) => {
    setFilters((prev) => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category],
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
      categories: [],
      campaigns: [],
    });
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-lg font-semibold mb-4 flex items-center">
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
            <div className="relative mb-3">
              <div className="flex gap-1 mb-2">
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
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search brands"
                className="pl-8 text-sm"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                    className="text-purple-600"
                  />
                  <label
                    htmlFor={`brand-${brand}`}
                    className={`text-sm cursor-pointer ${
                      filters.brands.includes(brand) ? "text-purple-600" : ""
                    }`}
                  >
                    {brand}
                  </label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Category Section */}
      <div className="border-b pb-4 mb-4">
        <div
          className="flex justify-between items-center mb-3 cursor-pointer"
          onClick={() => toggleSection("category")}
        >
          <h3 className="font-medium">Product Category</h3>
          {expandedSections.category ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </div>

        {expandedSections.category && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories"
                className="pl-8 text-sm"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs text-purple-600 cursor-pointer">
                      more
                    </span>
                  </div>
                  <div className="ml-2 mt-1 space-y-1">
                    {category.subcategories.map((subcat) => (
                      <div
                        key={subcat.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${subcat.name}`}
                            checked={filters.categories.includes(subcat.name)}
                            onCheckedChange={() => toggleCategory(subcat.name)}
                            className="text-purple-600"
                          />
                          <label
                            htmlFor={`category-${subcat.name}`}
                            className={`text-sm cursor-pointer ${
                              filters.categories.includes(subcat.name)
                                ? "text-purple-600"
                                : ""
                            }`}
                          >
                            {subcat.name}
                          </label>
                        </div>
                        <span className="text-xs text-gray-500">
                          {subcat.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
            <div className="relative mb-3">
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
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns"
                className="pl-8 text-sm"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {campaigns.map((campaign) => (
                <div key={campaign} className="flex items-center space-x-2">
                  <Checkbox
                    id={`campaign-${campaign}`}
                    checked={filters.campaigns.includes(campaign)}
                    onCheckedChange={() => toggleCampaign(campaign)}
                    className="text-purple-600"
                  />
                  <label
                    htmlFor={`campaign-${campaign}`}
                    className={`text-sm cursor-pointer ${
                      filters.campaigns.includes(campaign)
                        ? "text-purple-600"
                        : ""
                    }`}
                  >
                    {campaign}
                  </label>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handleApply}
        >
          Apply
        </Button>
        <Button variant="outline" className="w-full" onClick={handleClearAll}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
