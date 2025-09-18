"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import {
  BrandCampaignListResponse,
  EnhancedSelectedFilters,
} from "@/types/gallery.types";
import { useBrandStore } from "@/store/brand.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { Options } from "nuqs";

interface BrandSelectorProps {
  selectedBrand?: BrandCampaignListResponse["brands"][number] | null;
  setSelectedBrand?: React.Dispatch<
    React.SetStateAction<BrandCampaignListResponse["brands"][number] | null>
  >;
  brands: BrandCampaignListResponse["brands"];
  brandsLoading: boolean;
  setSelectedCampaignId: Dispatch<SetStateAction<string | undefined>>;
  selectedCampaignId?: string;
  selectedFilters: EnhancedSelectedFilters;
  setSelectedFilters: Dispatch<SetStateAction<EnhancedSelectedFilters>>;
  preSelectedBrandId: string | null;
  setInitialWorkflowStatus: (
    value: string[] | ((old: string[]) => string[] | null) | null,
    options?: Options
  ) => Promise<URLSearchParams>;
  setInitialBrandId: (
    value: string | ((old: string | null) => string | null) | null,
    options?: Options
  ) => Promise<URLSearchParams>;
}

export function MediaUploadBrandSelector({
  selectedBrand,
  setSelectedBrand,
  brands,
  brandsLoading,
  setSelectedCampaignId,
  selectedCampaignId,
  setSelectedFilters,
  preSelectedBrandId,
  setInitialBrandId,
  setInitialWorkflowStatus,
}: BrandSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { setSelectedBrandId, isBrandsFetched } = useBrandStore();
  const { user } = useUserStore();
  const stream = useStreamContext();

  useEffect(() => {
    if (brandsLoading || brands.length === 0) return;

    // Only auto-select if no brand is currently selected
    if (selectedBrand) return;

    const brandToSelect = preSelectedBrandId
      ? brands.find((brand) => brand.brand_id === preSelectedBrandId)
      : brands[0];

    if (brandToSelect) {
      setSelectedBrand?.(brandToSelect);
      // Apply the brand filter immediately
      setSelectedFilters((prev) => ({
        ...prev,
        brands: [brandToSelect.brand_id],
        campaigns: [],
      }));
      setSelectedCampaignId(undefined);
    }
  }, [brands, brandsLoading, preSelectedBrandId]);

  const handleBrandSelect = (
    brand: BrandCampaignListResponse["brands"][number]
  ) => {
    // Set the selected brand
    setInitialBrandId(null);
    setInitialWorkflowStatus(null);
    setSelectedBrand?.(brand);

    // Clear campaign selection
    setSelectedCampaignId(undefined);

    // Update filters
    setSelectedFilters((prev) => ({
      ...prev,
      brands: [brand.brand_id],
      campaigns: [],
    }));

    // Update the brand store to keep it in sync
    setSelectedBrandId(brand.brand_id);
    if (user?.thread_id) {
      stream.client.threads.updateState(user.thread_id, {
        values: {
          currentBrandContextId: brand.brand_id,
        },
      });
    }

    setOpen(false);
    setSearchTerm("");
  };
  const handleCampaignSelect = (
    brand: BrandCampaignListResponse["brands"][number],
    campaignId: string
  ) => {
    // Always set the correct brand (whether switching or not)
    setInitialBrandId(null);
    setInitialWorkflowStatus(null);
    setSelectedBrand?.(brand);

    // Set the selected campaign
    setSelectedCampaignId(campaignId);

    // Apply filters - ensure both brand and campaign are selected
    setSelectedFilters((prev) => {
      const newFilters = {
        ...prev,
        brands: [brand.brand_id],
        campaigns: [campaignId],
      };

      return newFilters;
    });

    // Update the brand store to keep it in sync (same as brand selection)
    setSelectedBrandId(brand.brand_id);

    // Update thread context if available (same as brand selection)
    if (user?.thread_id) {
      stream.client.threads.updateState(user.thread_id, {
        values: {
          currentBrandContextId: brand.brand_id,
        },
      });
    }

    setOpen(false);
    setSearchTerm("");
  };
  // Filter brands and campaigns based on search
  const filteredBrands = brands.filter(
    (brand) =>
      brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.campaigns.some((campaign) =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Get selected campaign object
  const getSelectedCampaign = () => {
    if (!selectedBrand || !selectedCampaignId) return null;
    return (
      selectedBrand.campaigns.find((c) => c.id === selectedCampaignId) || null
    );
  };

  const selectedCampaign = getSelectedCampaign();

  const getDisplayText = () => {
    if (selectedBrand && selectedCampaign) {
      return (
        <div className="flex gap-2 min-w-0">
          <span className="truncate font-medium">
            {selectedBrand.brand_name}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="truncate text-muted-foreground">
            {selectedCampaign.title}
          </span>
        </div>
      );
    }
    if (selectedBrand) {
      return (
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {selectedBrand.brand_name}
          </span>
          <Badge variant="secondary" className="text-xs">
            No campaign selected
          </Badge>
        </div>
      );
    }
    return "Select brand & campaign...";
  };

  return (
    <div className="" onClick={(e) => e.stopPropagation()}>
      <div className="w-80">
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative inline-block w-full">
            {/* Label positioned above the selector */}
            <span
              className="absolute -top-2 left-3 bg-[#F3F4F6FF] px-1 text-xs font-medium text-gray-700 z-10"
              style={{ lineHeight: 1 }}
            >
              Brand
            </span>

            <PopoverTrigger asChild>
              {brandsLoading ? (
                <Skeleton className="w-full h-10 rounded-md" />
              ) : (
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between text-sm h-10 hover:bg-white bg-[#F3F4F6FF] shadow-sm"
                  disabled={!isBrandsFetched}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {getDisplayText()}
                  </div>
                  {open ? (
                    <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              )}
            </PopoverTrigger>
          </div>

          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search brands or campaigns..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandEmpty>No brands or campaigns found.</CommandEmpty>

              <div className="max-h-80 overflow-y-auto">
                {filteredBrands.map((brand, brandIndex) => (
                  <div key={`${brand.brand_id}-${brandIndex}`}>
                    <CommandGroup>
                      {/* Brand Header */}
                      <CommandItem
                        value={`${brand.brand_name}-${brandIndex}`}
                        onSelect={() => handleBrandSelect(brand)}
                        className="flex items-center gap-3 py-3 cursor-pointer"
                      >
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {brand.brand_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {brand.campaigns.length} campaign
                            {brand.campaigns.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedBrand?.brand_id === brand.brand_id
                              ? "opacity-100 text-blue-600"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>

                      {/* Campaigns for this brand */}
                      {brand.campaigns.length > 0 && (
                        <>
                          {brand.campaigns.map((campaign, campaignIndex) => (
                            <CommandItem
                              key={`${brand.brand_id}-${campaign.id}-${campaignIndex}`}
                              value={`campaign-${campaign.title}-${brand.brand_name}`}
                              onSelect={() =>
                                handleCampaignSelect(brand, campaign.id)
                              }
                              className="flex items-center gap-3 py-2 pl-10 cursor-pointer"
                            >
                              <Megaphone className="h-3 w-3" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">
                                  {campaign.title}
                                </div>
                                {selectedBrand?.brand_id !== brand.brand_id && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    in {brand.brand_name}
                                  </div>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedCampaignId === campaign.id &&
                                    selectedBrand?.brand_id === brand.brand_id
                                    ? "opacity-100 text-green-600"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </>
                      )}
                    </CommandGroup>
                    {/* Separator between brands */}
                    {filteredBrands.indexOf(brand) <
                      filteredBrands.length - 1 && <CommandSeparator />}
                  </div>
                ))}
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
