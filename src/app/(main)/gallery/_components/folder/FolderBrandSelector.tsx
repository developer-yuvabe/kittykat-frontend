"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandCampaignListResponse } from "@/types/gallery.types";

interface FolderBrandSelectorProps {
  selectedBrand: BrandCampaignListResponse["brands"][number] | null;
  onBrandChange: (
    brand: BrandCampaignListResponse["brands"][number] | null
  ) => void;
  brands: BrandCampaignListResponse["brands"];
  brandsLoading: boolean;
}

export function FolderBrandSelector({
  selectedBrand,
  onBrandChange,
  brands,
  brandsLoading,
}: FolderBrandSelectorProps) {
  const [open, setOpen] = useState(false);

  // Auto-select first brand when brands are loaded
  useEffect(() => {
    if (!brandsLoading && brands.length > 0 && !selectedBrand) {
      onBrandChange(brands[0]);
    }
  }, [brands, brandsLoading, selectedBrand, onBrandChange]);

  const handleBrandSelect = (
    brand: BrandCampaignListResponse["brands"][number] | null
  ) => {
    onBrandChange(brand);
    setOpen(false);
  };

  return (
    <div className="mb-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Select Brand
        </h3>
        <div className="w-full max-w-xs">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              {brandsLoading ? (
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-500">
                    Loading brands...
                  </span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between text-sm bg-transparent"
                  disabled={!selectedBrand}
                >
                  {selectedBrand ? selectedBrand.brand_name : "Select brand..."}
                  {open ? (
                    <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Command>
                <CommandInput placeholder="Search brands..." />
                <CommandList>
                  <CommandEmpty>No brand found.</CommandEmpty>
                  <CommandGroup className="max-h-44 overflow-y-scroll">
                    {brands.map((brand) => (
                      <CommandItem
                        key={brand.brand_id}
                        value={`${brand.brand_name} - ${brand.brand_id}`}
                        onSelect={() => handleBrandSelect(brand)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBrand?.brand_id === brand.brand_id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {brand.brand_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
