"use client";

import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Command, CommandEmpty } from "@/components/ui/command";
import { SearchIcon } from "@/components/ui/custom-icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  ChevronRight,
  CirclePlus,
  Megaphone,
  Presentation,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { SubSectionCard } from "./SubSectionCard";
import { useBrandStore } from "@/store/brand.store";
import { popVariants } from "@/lib/motion.utils";
import { AnimatePresence, motion } from "framer-motion";

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

export const brandFields = [
  "Brand Overview",
  "Brand Purpose",
  "Brand Colors",
  "Brand Typography",
  "Products",
  "Target Audience",
  "Media",
];
export const campaignFields = [
  "Campaign Overview",
  "Campaign Colors",
  "Target Audience",
  "Visual Style",
];

export const moodboardFields = [
  "Campaign Concept",
  "Build Your Campaign Moodboard",
];
interface PlaceholderSectionProps {
  title: string;
  type: "brand" | "campaign" | "moodboard";
  fields: string[];
  customSelector?: React.ReactNode;
  searchPlaceholder?: string;
  newButtonTooltip: string;
  onNewClick?: (e: any) => void;
  renderFieldContent?: (field: string) => React.ReactNode;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isLoading?: boolean;
  isCreatingNewBrand?: boolean;
  isCreatingNewCampaign?: boolean;
  clearPinnedItems?: () => void;
}

export const PlaceholderSection: React.FC<PlaceholderSectionProps> = ({
  title,
  fields,
  type,
  customSelector,
  searchPlaceholder,
  newButtonTooltip,
  onNewClick,
  renderFieldContent,
  isExpanded = true,
  onToggleExpanded,
  isLoading = false,
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const {
    isCreatingBrand,
    isCampaignCreating,
    setIsCampaignCreating,
    setIsCreatingBrand,
  } = useBrandStore();

  return (
    <>
      <style>{skeletonStyles}</style>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-x-4 items-center">
            <Button
              variant="outline"
              size="icon"
              className={
                isExpanded
                  ? "rotate-90 transition-transform"
                  : "transition-transform"
              }
              onClick={onToggleExpanded}
            >
              {<ChevronRight />}
            </Button>
            <div className="w-14 h-14 rounded-lg bg-brand-gradient text-white flex items-center justify-center">
              {type === "brand" ? (
                <Building2 />
              ) : type === "campaign" ? (
                <Megaphone />
              ) : (
                <Presentation />
              )}
            </div>
            <div>
              <h4 className="font-light text-sm capitalize">{title}</h4>
              <p className="font-bold text-2xl italic">
                Your {type} name will appear here
              </p>
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            <div>
              {customSelector || (
                <Popover open={openPopover} onOpenChange={setOpenPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SearchIcon size={10} className="text-black" />
                      {searchPlaceholder || `Select ${type}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandEmpty>No Existing {type}</CommandEmpty>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <TooltipIconButton
              size="lg"
              className="p-4"
              tooltip={newButtonTooltip}
              variant="ghost"
              onClick={(e) => {
                if (isCampaignCreating) setIsCampaignCreating(false);
                else if (isCreatingBrand) setIsCreatingBrand(false);
                else if (onNewClick) onNewClick(e);
              }} // Use enhanced function
            >
              {(type == "campaign" && isCampaignCreating) ||
              (type == "brand" && isCreatingBrand) ? (
                <X className="size-5" />
              ) : (
                <CirclePlus className="size-5" />
              )}
            </TooltipIconButton>
          </div>
        </div>

        {/* Expandable Fields */}
        {isExpanded && (
          <AnimatePresence>
            <motion.div
              initial="collapsed"
              animate="open"
              className="overflow-hidden"
              exit="collapsed"
              variants={popVariants}
            >
              <CardContent className="grid grid-cols-2 gap-6">
                {fields.map((field) => (
                  <SubSectionCard
                    key={field}
                    label={field}
                    isLoading={isLoading}
                  >
                    {!isLoading && renderFieldContent?.(field)}
                  </SubSectionCard>
                ))}
              </CardContent>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
};
