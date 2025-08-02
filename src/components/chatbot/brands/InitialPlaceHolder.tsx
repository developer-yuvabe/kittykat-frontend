"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty } from "@/components/ui/command";
import { CirclePlus, ChevronDown, X, ChevronRight } from "lucide-react";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import BrandSelector from "./BrandSelector";
import { SubSectionCard } from "./SubSectionCard";
import { useBrandStore } from "@/store/brand.store";
import { SearchIcon } from "@/components/ui/custom-icon";

// Skeleton CSS styles
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .skeleton-text {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400px 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
    height: 1em;
  }
`;

const brandFields = [
  "Brand Overview",
  "Brand Purpose",
  "Brand Colors",
  "Brand Typography",
  "Photography",
  "Lighting",
  "Styling",
  "Casting",
  "Setting",
  "Products",
  "Target Audience",
  "Media",
];
export const campaignFields = [
  "Campaign Overview",
  "Campaign Colors",
  "Target Audience",
  "Visual Style",
  "Moodboard",
];

export const moodboardFields = [
  "Campaign Concept",
  "Choose your Visual Aesthetic",
];
interface PlaceholderSectionProps {
  title: string;
  avatarSrc?: string;
  avatarFallback: string;
  avatarBgColor: string;
  fields: string[];
  customSelector?: React.ReactNode;
  searchPlaceholder?: string;
  newButtonTooltip: string;
  onNewClick?: () => void;
  renderFieldContent?: (field: string) => React.ReactNode;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isLoading?: boolean;
  isCreatingNewBrand?: boolean;
  isCreatingNewCampaign?: boolean;
}

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({
  title,
  avatarSrc = "",
  avatarFallback,
  avatarBgColor,
  fields,
  customSelector,
  searchPlaceholder,
  newButtonTooltip,
  onNewClick,
  renderFieldContent,
  isExpanded = true,
  onToggleExpanded,
  isLoading = false,
  isCreatingNewBrand = false,
  isCreatingNewCampaign = false,
}) => {
  const [openPopover, setOpenPopover] = useState(false);

  const { setIsCreatingBrand, setIsCampaignCreating } = useBrandStore();

  return (
    <>
      <style>{skeletonStyles}</style>
      <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
        <CardHeader className="py-1">
          <div
            className="flex items-center justify-between cursor-pointer "
            onClick={onToggleExpanded}
          >
            <div className="flex items-center">
              {isExpanded && !isLoading ? (
                <ChevronDown className="text-[#6e7787] mr-2" size={20} />
              ) : (
                <ChevronRight className="text-[#6e7787] mr-2" size={20} />
              )}

              {isLoading || isCreatingNewBrand ? (
                <Avatar className="w-10 h-10 mr-2 overflow-hidden">
                  <div className="skeleton w-full h-full rounded-full"></div>
                </Avatar>
              ) : (
                <Avatar className="w-10 h-10 mr-2 overflow-hidden">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className={avatarBgColor}>
                    <span className="text-white font-bold">
                      {avatarFallback}
                    </span>
                  </AvatarFallback>
                </Avatar>
              )}

              {isLoading ? (
                <div className="skeleton-text w-32 h-6"></div>
              ) : isCreatingNewBrand ? (
                <span className="text-lg font-semibold">
                  Creating new brand...
                </span>
              ) : (
                <span className="text-lg font-semibold">
                  {title || "No brand selected"}
                </span>
              )}
            </div>
            <div className="absolute right-3 top-8 ">
              <div className="flex justify-between gap-x-2">
                <div>
                  {isLoading ? (
                    <div className="skeleton w-60 h-10 rounded-md"></div>
                  ) : (
                    customSelector || (
                      <Popover open={openPopover} onOpenChange={setOpenPopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SearchIcon size={10} className="text-black" />
                            {searchPlaceholder || `Select ${title}`}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandEmpty>No Existing {title}</CommandEmpty>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )
                  )}
                </div>
                {isLoading ? (
                  <div className="skeleton w-12 h-12 rounded-md"></div>
                ) : isCreatingNewBrand ? (
                  <TooltipIconButton
                    size="lg"
                    className="p-4"
                    tooltip="Cancel creating brand"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreatingBrand(false);
                    }}
                  >
                    <X className="size-5" />
                  </TooltipIconButton>
                ) : isCreatingNewCampaign ? (
                  <TooltipIconButton
                    size="lg"
                    className="p-4"
                    tooltip="Cancel creating campaign"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCampaignCreating(false);
                    }}
                  >
                    <X className="size-5" />
                  </TooltipIconButton>
                ) : (
                  <TooltipIconButton
                    size="lg"
                    className="p-4"
                    tooltip={newButtonTooltip}
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewClick?.();
                    }}
                  >
                    <CirclePlus className="size-5" />
                  </TooltipIconButton>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Fields */}
        {isExpanded && (
          <CardContent>
            {fields.map((field) => (
              <SubSectionCard key={field} label={field} isLoading={isLoading}>
                {!isLoading && renderFieldContent?.(field)}
              </SubSectionCard>
            ))}
          </CardContent>
        )}
      </Card>
    </>
  );
};

// Media Field Custom Tags
const MediaPlatformTags: React.FC<{ isLoading?: boolean }> = ({
  isLoading = false,
}) => {
  const platforms = [
    { name: "Website", bgColor: "bg-gray-200", textColor: "text-gray-700" },
    { name: "Facebook", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    { name: "Instagram", bgColor: "bg-pink-100", textColor: "text-pink-700" },
    { name: "Tiktok", bgColor: "bg-green-100", textColor: "text-green-700" },
  ];

  if (isLoading) {
    return (
      <div className="flex gap-2 pt-3 flex-wrap">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="skeleton w-16 h-6 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-3 flex-wrap">
      {platforms.map((p) => (
        <span
          key={p.name}
          className={`text-xs px-3 py-1 rounded-full font-medium ${p.bgColor} ${p.textColor}`}
        >
          {p.name}
        </span>
      ))}
    </div>
  );
};

// Main Exported Component
export const InitialPlaceHolder: React.FC<{
  isLoading?: boolean;
  isCreatingNewBrand?: boolean;
}> = ({ isLoading = false, isCreatingNewBrand = false }) => {
  const [brandExpanded, setBrandExpanded] = useState(true);

  const renderBrandFieldContent = (field: string) => {
    if (field === "Media") {
      return <MediaPlatformTags isLoading={isLoading} />;
    }
    return null;
  };

  return (
    <div>
      <PlaceholderSection
        title={isLoading ? "Loading..." : "Your Brand Name"}
        isCreatingNewBrand={isCreatingNewBrand}
        avatarFallback="B"
        avatarBgColor="bg-blue-500"
        fields={brandFields}
        customSelector={!isLoading ? <BrandSelector /> : undefined}
        newButtonTooltip="New Brand"
        onNewClick={() => {}}
        renderFieldContent={renderBrandFieldContent}
        isExpanded={brandExpanded}
        onToggleExpanded={() => setBrandExpanded(!brandExpanded)}
        isLoading={isLoading}
      />
    </div>
  );
};
