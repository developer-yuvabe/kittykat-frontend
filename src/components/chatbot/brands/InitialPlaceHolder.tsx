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
import { Search, Copy, CirclePlus, ChevronDown, ChevronUp } from "lucide-react";
import { TooltipIconButton } from "../../thread/tooltip-icon-button";
import { PinIcon } from "@/components/ui/custom-icon";
import BrandSelector from "./BrandSelector";

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

// Reusable SubSection Card Component
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

interface SubSectionCardProps {
  label: string;
  children?: React.ReactNode;
  isLoading?: boolean;
}

const SubSectionCard: React.FC<SubSectionCardProps> = ({
  label,
  children,
  isLoading = false,
}) => {
  return (
    <Card className="my-4 border border-gray-300">
      <CardHeader className="flex flex-row items-center justify-between">
        {isLoading ? (
          <div className="skeleton-text w-24 h-4"></div>
        ) : (
          <h4 className="font-medium text-sm">{label}</h4>
        )}
        {!isLoading && (
          <div className="flex justify-center">
            <TooltipIconButton tooltip="Copy" side="top">
              <Copy size={16} />
            </TooltipIconButton>
            <TooltipIconButton tooltip="Pin" side="top">
              <PinIcon size={16} />
            </TooltipIconButton>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4">
        {isLoading ? (
          <div className="skeleton h-10 rounded-md" />
        ) : (
          <div className="bg-gray-100 h-10 rounded-md px-3 py-2 text-sm text-gray-600 flex items-center" />
        )}
        {children}
      </CardContent>
    </Card>
  );
};

// Reusable Placeholder Section Component
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
}) => {
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <>
      <style>{skeletonStyles}</style>
      <div className="bg-white rounded-2xl relative shadow-sm mb-4">
        <Card className="p-5" onClick={onToggleExpanded}>
          {/* Header Section */}
          <div className="flex items-center justify-between my-4">
            <div className="flex items-center gap-1">
              {onToggleExpanded && !isLoading && (
                <Button variant="ghost" size="sm" className="ml-2 p-1">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              {isLoading && (
                <div className="ml-2 p-1 w-8 h-8">
                  <div className="skeleton w-4 h-4 rounded"></div>
                </div>
              )}
              <Avatar className="w-10 h-10 rounded-full flex items-center justify-center mr-2 overflow-hidden">
                {isLoading ? (
                  <div className="skeleton w-full h-full rounded-full"></div>
                ) : (
                  <>
                    <AvatarImage
                      src={avatarSrc}
                      alt={`@${title.toLowerCase()}`}
                    />
                    <AvatarFallback className={avatarBgColor}>
                      <span className="text-white font-bold">
                        {avatarFallback}
                      </span>
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              {isLoading ? (
                <div className="skeleton-text w-32 h-6"></div>
              ) : (
                <span className="text-lg font-semibold">{title}</span>
              )}
            </div>
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
                          aria-expanded={openPopover}
                          className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
                        >
                          <Search size={10} className="text-black" />
                          {searchPlaceholder || `Load existing ${title}`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] relative p-0">
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
              ) : (
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip={newButtonTooltip}
                  variant="ghost"
                  onClick={onNewClick}
                >
                  <CirclePlus className="size-5" />
                </TooltipIconButton>
              )}
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div>
              {fields.map((field) => (
                <SubSectionCard key={field} label={field} isLoading={isLoading}>
                  {!isLoading && renderFieldContent?.(field)}
                </SubSectionCard>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

// Media Platform Tags Component
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
        {[...Array(4)].map((_, index) => (
          <div key={index} className="skeleton w-16 h-6 rounded-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-3 flex-wrap">
      {platforms.map((platform) => (
        <span
          key={platform.name}
          className={`text-xs px-3 py-1 rounded-full font-medium ${platform.bgColor} ${platform.textColor}`}
        >
          {platform.name}
        </span>
      ))}
    </div>
  );
};

// Main Component
export const InitialPlaceHolder: React.FC<{ isLoading?: boolean }> = ({
  isLoading = false,
}) => {
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
        avatarFallback="B"
        avatarBgColor="bg-blue-500"
        fields={brandFields}
        customSelector={!isLoading ? <BrandSelector /> : undefined}
        newButtonTooltip="New Brand"
        onNewClick={() => {
          console.log("New Brand clicked");
        }}
        renderFieldContent={renderBrandFieldContent}
        isExpanded={brandExpanded}
        onToggleExpanded={() => setBrandExpanded(!brandExpanded)}
        isLoading={isLoading}
      />
    </div>
  );
};
