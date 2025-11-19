"use client";

import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBrandStore } from "@/store/brand.store";
import type { PresetsFilterRequest } from "@/types/preset.types";

interface PresetFilterPopoverProps {
  filter: PresetsFilterRequest;
  onChange: (filters: PresetsFilterRequest) => void;
}

export function PresetFilterPopover({
  filter,
  onChange,
}: PresetFilterPopoverProps) {
  const brands = useBrandStore((s) => s.brands);
  const [localFilter, setLocalFilter] = useState<PresetsFilterRequest>(
    filter || {}
  );

  useEffect(() => {
    setLocalFilter(filter || {});
  }, [filter]);

  const onBrandChange = (values: string[]) => {
    const next = { ...localFilter, brand_ids: values };
    setLocalFilter(next);
  };

  const onTypeChange = (values: Array<"generic" | "custom">) => {
    const next = { ...localFilter, type: values };
    setLocalFilter(next);
  };

  const applyFilters = () => onChange(localFilter);

  const resetFilters = () => {
    const next: PresetsFilterRequest = {};
    setLocalFilter(next);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-9">
          Filters
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px]">
        <div className="space-y-3">
          {/* Brands */}
          <div className="pb-2">
            <Label className="mb-2">Brands</Label>
            <MultiSelect
              value={localFilter.brand_ids ?? []}
              onValueChange={(v) => onBrandChange(v as string[])}
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Select brands" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectSearch placeholder="Search brands..." />
                <MultiSelectGroup>
                  {brands.map((brand) => (
                    <MultiSelectItem
                      key={brand.id}
                      value={brand.id}
                      label={brand.name}
                    >
                      {brand.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
          </div>

          {/* Type */}
          <div className="pb-2">
            <Label className="mb-2">Type</Label>

            <ToggleGroup
              type="multiple"
              value={localFilter.type ?? []}
              onValueChange={(v) =>
                onTypeChange(v as Array<"generic" | "custom">)
              }
              className="w-full"
              variant="highlight"
            >
              <ToggleGroupItem value="generic">Generic</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Buttons */}
          <div className="flex flex-row justify-end gap-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters} size="sm">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
