"use client";

import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { GalleryItemResponse, GalleryFilters, BulkMoveRequest } from "@/types/gallery.types";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { RoleProtectedComponent } from "@/components/shared/RoleProtectedComponent";
import { GalleryActions } from "@/hooks/useGallery";
import { UserRoleId } from "@/types/user.types";
import { LibraryIcon } from "@/components/ui/custom-icon";
import { useBrandStore } from "@/store/brand.store";
import { useBulkGalleryOperations } from "@/hooks/useBulkGalleryOperations";

type MoveAction = "brand" | "campaign" | "source";

interface MediaBulkMoveSectionProps {
  selectedItems: GalleryItemResponse[];
  selectAllMode: "none" | "visible" | "all";
  excludedItems: string[];
  galleryFilters: GalleryFilters;
  totalItems: number;
  fetchedItemsCount: number;
  onUnselectAll: () => void;
  galleryActions: GalleryActions;
}

export function MediaBulkMoveSection({
  selectedItems,
  selectAllMode,
  excludedItems,
  galleryFilters,
  totalItems,
  fetchedItemsCount,
  onUnselectAll,
  galleryActions,
}: MediaBulkMoveSectionProps) {
  const { brands, selectedBrandId, setSelectedBrandId, setSelectedCampaignId } = useBrandStore();
  const bulkOps = useBulkGalleryOperations();

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveAction, setMoveAction] = useState<MoveAction>("brand");
  const [targetBrandId, setTargetBrandId] = useState<string>("");
  const [targetCampaignId, setTargetCampaignId] = useState<string>("");
  const [targetSource, setTargetSource] = useState<string>("");
  const [brandSearch, setBrandSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false);
  const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);

  const selectedCount =
    selectAllMode === "all"
      ? totalItems - excludedItems.length
      : selectAllMode === "visible"
      ? fetchedItemsCount - excludedItems.length
      : selectedItems.length;

  const uniqueBrands = [...new Set(selectedItems.map((item) => item.brand_id))];
  const uniqueCampaigns = [
    ...new Set(selectedItems.map((item) => item.campaign_id).filter(Boolean)),
  ];
  const uniqueSources = [...new Set(selectedItems.map((item) => item.asset_source))];

  const handleMoveAction = (action: MoveAction) => {
    setMoveAction(action);
    setIsMoveDialogOpen(true);
    setTargetBrandId("");
    setTargetCampaignId("");
    setTargetSource("");
  };

  const handleConfirmMove = async () => {
    try {
      const options: any = {};

      if (moveAction === "brand" && targetBrandId) {
        options.targetBrandId = targetBrandId;
        if (targetCampaignId && targetCampaignId !== "none") {
          options.targetCampaignId = targetCampaignId;
        }
      } else if (moveAction === "campaign") {
        options.targetCampaignId =
          targetCampaignId === "none" ? null : targetCampaignId;
      } else if (moveAction === "source" && targetSource) {
        options.targetSource = targetSource;
      }

      const request = {
        ...bulkOps.buildBulkRequest(
          galleryFilters,
          selectAllMode !== "none",
          selectedItems.map((item) => item.id),
          excludedItems
        ),
        target_brand_id: options.targetBrandId,
        target_campaign_id: options.targetCampaignId,
        target_source: options.targetSource,
      } satisfies BulkMoveRequest;

      await bulkOps.bulkMove.mutateAsync(request);

      if (moveAction === "brand" && options.targetBrandId) {
        setSelectedBrandId(options.targetBrandId);
        if (options.targetCampaignId) {
          setSelectedCampaignId(options.targetCampaignId);
        }
      } else if (moveAction === "campaign") {
        if (options.targetCampaignId) {
          const campaignBrand = brands.find((b) =>
            b.campaigns.some((c) => c.id === options.targetCampaignId)
          );
          if (campaignBrand && campaignBrand.id !== selectedBrandId) {
            setSelectedBrandId(campaignBrand.id);
          }
          setSelectedCampaignId(options.targetCampaignId);
        } else {
          setSelectedCampaignId(null);
        }
      }

      onUnselectAll();
      setIsMoveDialogOpen(false);
      galleryActions.refetchGalleryItems();
    } catch (error) {
      console.log("Bulk move error:", error);
    }
  };

  const getAvailableCampaigns = () => {
    if (moveAction === "campaign") {
      const fromSameBrand = uniqueBrands.length === 1;
      if (fromSameBrand) {
        const currentBrandId = uniqueBrands[0];
        const currentBrand = brands.find((brand) => brand.id === currentBrandId);
        return (
          currentBrand?.campaigns.map((campaign) => ({
            ...campaign,
            brand_name: currentBrand.name,
            brand_id: currentBrand.id,
          })) || []
        );
      } else {
        return (
          brands.flatMap((brand) =>
            brand.campaigns.map((campaign) => ({
              ...campaign,
              brand_name: brand.name,
              brand_id: brand.id,
            }))
          ) || []
        );
      }
    }
    return [];
  };

  const getAvailableSources = () => {
    const allSources = [
      { value: "brand-uploads", label: "Brand Uploads" },
      { value: "showboard-media", label: "Concept Visuals" },
      { value: "a2i-media", label: "A2I Media" },
      { value: "moodboard", label: "Moodboard" },
    ];
    return allSources.filter((source) => !uniqueSources.includes(source.value));
  };

  const isValidMove = () => {
    return (
      (moveAction === "brand" && targetBrandId) ||
      (moveAction === "campaign" && targetCampaignId) ||
      (moveAction === "source" && targetSource && getAvailableSources().length > 0)
    );
  };

  const getMoveDialogContent = () => {
    const currentInfo = {
      brands: uniqueBrands.length,
      campaigns: uniqueCampaigns.length,
      sources: uniqueSources.length,
    };

    const availableCampaigns = getAvailableCampaigns();
    const fromSameBrand = uniqueBrands.length === 1;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Current Selection</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span>Items:</span>
              <Badge variant="secondary">{selectedCount}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>
                From {currentInfo.brands} brand(s), {currentInfo.campaigns}{" "}
                campaign(s), {currentInfo.sources} source(s)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {moveAction === "brand" && "Move to Brand"}
            {moveAction === "campaign" && "Move to Campaign"}
            {moveAction === "source" && "Move to Source"}
          </Label>

          {moveAction === "brand" && (
            <div className="space-y-3">
              <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {targetBrandId
                      ? brands.find((b) => b.id === targetBrandId)?.name
                      : "Select target brand"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command shouldFilter={false} className="overflow-visible">
                    <div className="flex items-center border-b px-3">
                      <Input
                        placeholder="Search brands..."
                        className="h-9 border-0 outline-none focus-visible:ring-0"
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                      />
                    </div>
                    <CommandList onWheel={(e) => e.stopPropagation()}>
                      <CommandEmpty>No brands found.</CommandEmpty>
                      <CommandGroup>
                        {brands
                          .filter((b) => b.name?.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map((brand) => (
                            <CommandItem
                              key={brand.id}
                              value={brand.id}
                              onSelect={() => {
                                setTargetBrandId(brand.id);
                                setTargetCampaignId("");
                                setBrandSearch("");
                                setBrandPopoverOpen(false);
                              }}
                            >
                              {brand.name}
                              {targetBrandId === brand.id && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {targetBrandId && (() => {
                const targetBrand = brands.find((b) => b.id === targetBrandId);
                const brandCampaigns = targetBrand?.campaigns ?? [];
                return (
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-500">Campaign (Optional)</Label>
                    <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {targetCampaignId && targetCampaignId !== "none"
                            ? brandCampaigns.find((c) => c.id === targetCampaignId)?.title ?? "No campaign"
                            : "No campaign"}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command shouldFilter={false} className="overflow-visible">
                          <div className="flex items-center border-b px-3">
                            <Input
                              placeholder="Search campaigns..."
                              className="h-9 border-0 outline-none focus-visible:ring-0"
                              value={campaignSearch}
                              onChange={(e) => setCampaignSearch(e.target.value)}
                            />
                          </div>
                          <CommandList onWheel={(e) => e.stopPropagation()}>
                            <CommandEmpty>No campaigns found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setTargetCampaignId("none");
                                  setCampaignSearch("");
                                  setCampaignPopoverOpen(false);
                                }}
                              >
                                No campaign
                                {(targetCampaignId === "none" || !targetCampaignId) && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                              {brandCampaigns
                                .filter((c) => c.title.toLowerCase().includes(campaignSearch.toLowerCase()))
                                .map((campaign) => (
                                  <CommandItem
                                    key={campaign.id}
                                    value={campaign.id}
                                    onSelect={() => {
                                      setTargetCampaignId(campaign.id);
                                      setCampaignSearch("");
                                      setCampaignPopoverOpen(false);
                                    }}
                                  >
                                    {campaign.title}
                                    {targetCampaignId === campaign.id && (
                                      <Check className="ml-auto h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })()}
            </div>
          )}

          {moveAction === "campaign" && (
            <div className="space-y-2">
              {!fromSameBrand && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Moving between brands: Campaign selection will also update the brand.
                  </p>
                </div>
              )}
              <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {targetCampaignId === "none"
                      ? "Remove from Campaign"
                      : targetCampaignId
                        ? availableCampaigns.find((c) => c.id === targetCampaignId)?.title ?? "Select target campaign"
                        : "Select target campaign"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command shouldFilter={false} className="overflow-visible">
                    <div className="flex items-center border-b px-3">
                      <Input
                        placeholder="Search campaigns..."
                        className="h-9 border-0 outline-none focus-visible:ring-0"
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                      />
                    </div>
                    <CommandList onWheel={(e) => e.stopPropagation()}>
                      <CommandEmpty>No campaigns found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setTargetCampaignId("none");
                            setCampaignSearch("");
                            setCampaignPopoverOpen(false);
                          }}
                        >
                          Remove from Campaign
                          {targetCampaignId === "none" && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {availableCampaigns
                          .filter((c) => c.title.toLowerCase().includes(campaignSearch.toLowerCase()))
                          .map((campaign) => (
                            <CommandItem
                              key={campaign.id}
                              value={campaign.id}
                              onSelect={() => {
                                setTargetCampaignId(campaign.id);
                                setCampaignSearch("");
                                setCampaignPopoverOpen(false);
                              }}
                            >
                              {campaign.title}
                              {!fromSameBrand && (
                                <span className="text-gray-500 ml-2">({campaign.brand_name})</span>
                              )}
                              {targetCampaignId === campaign.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {moveAction === "source" && (
            <div className="space-y-2">
              {uniqueSources.length === 1 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    Moving from:{" "}
                    {(() => {
                      const allSources = [
                        { value: "brand-uploads", label: "Brand Uploads" },
                        { value: "showboard-media", label: "Concept Visuals" },
                        { value: "a2i-media", label: "A2I Media" },
                        { value: "moodboard", label: "Moodboard" },
                      ];
                      const currentSource = allSources.find((s) => s.value === uniqueSources[0]);
                      return currentSource?.label || uniqueSources[0];
                    })()}
                  </p>
                </div>
              )}
              <Select value={targetSource} onValueChange={setTargetSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target source" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSources().length > 0 ? (
                    getAvailableSources().map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No other tabs available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {getAvailableSources().length === 0 && (
                <p className="text-sm text-gray-500">
                  All selected items are already in different tabs, or no other tabs are available.
                </p>
              )}
            </div>
          )}
        </div>

        {((moveAction === "brand" && targetBrandId) ||
          (moveAction === "campaign" && targetCampaignId) ||
          (moveAction === "source" && targetSource)) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-sm mb-2 text-blue-800">Move Summary</h4>
            <p className="text-sm text-blue-700">
              Moving {selectedCount} item(s) to{" "}
              {moveAction === "brand" && (
                <>
                  {brands.find((b) => b.id === targetBrandId)?.name}
                  {targetCampaignId && targetCampaignId !== "none" ? (
                    <span className="block text-xs mt-1 text-blue-600">
                      Campaign:{" "}
                      {brands
                        .find((b) => b.id === targetBrandId)
                        ?.campaigns.find((c) => c.id === targetCampaignId)?.title}
                    </span>
                  ) : (
                    <span className="block text-xs mt-1 text-blue-600">
                      Note: Items will be removed from their current campaigns
                    </span>
                  )}
                </>
              )}
              {moveAction === "campaign" && targetCampaignId === "none" && "No Campaign"}
              {moveAction === "campaign" && targetCampaignId !== "none" && (
                <>
                  {availableCampaigns.find((c) => c.id === targetCampaignId)?.title}
                  {!fromSameBrand && (
                    <span className="block text-xs mt-1 text-blue-600">
                      Brand will be updated to:{" "}
                      {availableCampaigns.find((c) => c.id === targetCampaignId)?.brand_name}
                    </span>
                  )}
                </>
              )}
              {moveAction === "source" && targetSource}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Move Asset Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            disabled={!brands?.length}
            className="bg-[#9095A0] hover:bg-[#9095A0] text-white hover:text-white"
          >
            Move to... <LibraryIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1 m-0">
          <div className="space-y-2">
            <RoleProtectedComponent allowedRoles={[UserRoleId.ADMIN]}>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => handleMoveAction("brand")}
              >
                Move to another Brand
              </Button>
            </RoleProtectedComponent>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleMoveAction("campaign")}
            >
              Move to another Campaign
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleMoveAction("source")}
              disabled={(() => {
                const allSources = [
                  { value: "brand-uploads", label: "Brand Uploads" },
                  { value: "showboard-media", label: "Concept Visuals" },
                  { value: "a2i-media", label: "A2I Media" },
                  { value: "moodboard", label: "Moodboard" },
                ];
                const availableSources = allSources.filter(
                  (source) => !uniqueSources.includes(source.value)
                );
                return availableSources.length === 0;
              })()}
            >
              Move to another Tab
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Move Assets Dialog */}
      <ReusableAlertDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        title={`Move Assets - ${
          moveAction === "brand" ? "Brand" : moveAction === "campaign" ? "Campaign" : "Source"
        }`}
        description={getMoveDialogContent()}
        confirmLabel="Move"
        cancelLabel="Cancel"
        onConfirm={handleConfirmMove}
        isLoading={bulkOps.isMoving}
        confirmDisabled={!isValidMove()}
      />
    </>
  );
}
