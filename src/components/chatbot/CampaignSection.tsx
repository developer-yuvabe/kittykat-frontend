import { useEffect, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
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
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface TransformedCampaign {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string;
  raw: Campaign;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  setSelectedCampaignIndex: (index: number) => void;
  selectedCampaignIndex: number;
}

interface CampaignOverviewProps {
  concept?: string;
  tagline?: string;
  values?: string[];
}

export const CampaignOverview: React.FC<CampaignOverviewProps> = ({
  concept,
  tagline,
  values = [],
}) => {
  return (
    <ContentSection
      title={`Campaign Concept: “${concept}”`}
      content={
        <div className="space-y-3">
          {/* Tagline */}
          {tagline && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-700">{tagline}</span>
            </div>
          )}

          {/* Values */}
          {values.length > 0 && (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-1 mt-1">
                {values.map((value, index) => (
                  <Badge
                    key={index}
                    variant={"outline"}
                    className="text-xs bg-purple-50 text-purple-700 border-purple-100"
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      context={{ concept, tagline, values }}
    />
  );
};

interface CampaignColorsProps {
  colors: string[];
}

export const CampaignColors: React.FC<CampaignColorsProps> = ({ colors }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Filter valid colors
  const validColors = colors.filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color));

  // Skip rendering if no valid colors
  if (validColors.length === 0) return null;

  const copyToClipboard = (colorHex: string) => {
    navigator.clipboard.writeText(colorHex);
    setCopiedColor(colorHex);
    toast.success(`Color ${colorHex} copied to clipboard!`, {
      position: "top-right",
    });
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <ContentSection
      title="Campaign Colors"
      content={
        <div className="flex flex-wrap gap-4">
          {validColors.map((color, idx) => (
            <div key={idx} className="relative group">
              <div
                className="h-24 w-24 rounded shadow-md transition-transform duration-200 group-hover:scale-95"
                style={{ backgroundColor: color }}
              >
                {/* Copy Button */}
                <TooltipIconButton
                  tooltip="Copy color"
                  side="top"
                  onClick={() => copyToClipboard(color)}
                  className="absolute -top-3 -right-3 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                >
                  <Copy size={16} />
                </TooltipIconButton>

                {/* Color Info on Hover */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-transparent bg-opacity-40 transition-opacity rounded`}
                  style={{ color: getFontColorForBackground(color) }}
                >
                  <div className="text-base text-[10px]">{color}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
      context={{ colors }}
    />
  );
};

import { Expand, Pin, RotateCw } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MoodboardItem {
  prompt: string;
  status: string;
  url: string;
}

interface CampaignMoodboardProps {
  moodboards: MoodboardItem[];
}

export const CampaignMoodboard: React.FC<CampaignMoodboardProps> = ({
  moodboards,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [pinnedImages, setPinnedImages] = useState<string[]>([]);

  // Skip rendering if no moodboards
  if (!moodboards || moodboards.length === 0) return null;

  const handleExpand = (url: string) => {
    setExpandedImage(expandedImage === url ? null : url);
  };

  const handlePin = (url: string) => {
    setPinnedImages((prev) =>
      prev.includes(url) ? prev.filter((img) => img !== url) : [...prev, url]
    );
    toast.success(
      pinnedImages.includes(url)
        ? "Image unpinned"
        : "Image pinned to collection",
      { position: "top-right" }
    );
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard!", { position: "top-right" });
  };

  const handleRegenerate = (index: number) => {
    toast.success(`Regenerating moodboard image ${index + 1}...`, {
      position: "top-right",
    });
    // Actual regeneration logic would go here
  };

  return (
    <ContentSection
      title="Campaign Moodboards"
      content={
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {moodboards.map((moodboard, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    {/* Action Buttons Container */}
                    <div className="absolute top-2 right-2 z-10 flex space-x-1">
                      <TooltipIconButton
                        tooltip="Expand"
                        side="top"
                        onClick={() => handleExpand(moodboard.url)}
                        className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                      >
                        <Expand size={16} />
                      </TooltipIconButton>

                      <Popover>
                        <PopoverTrigger asChild>
                          <TooltipIconButton
                            tooltip="Copy prompt"
                            side="top"
                            className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                          >
                            <Copy size={16} />
                          </TooltipIconButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Image Prompt</h4>
                            <p className="text-sm text-gray-700">
                              {moodboard.prompt}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => handleCopyPrompt(moodboard.prompt)}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <TooltipIconButton
                        tooltip={
                          pinnedImages.includes(moodboard.url) ? "Unpin" : "Pin"
                        }
                        side="top"
                        onClick={() => handlePin(moodboard.url)}
                        className={`p-1 rounded-full shadow ${
                          pinnedImages.includes(moodboard.url)
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-white hover:bg-gray-100"
                        }`}
                      >
                        <BsPinAngle size={16} />
                      </TooltipIconButton>
                    </div>

                    {/* Image Container */}
                    <div className="relative mt-10  aspect-square flex items-center justify-center">
                      <img
                        src={moodboard.url || "/api/placeholder/600/600"}
                        alt={`Moodboard ${index + 1}`}
                        className="w-full h-full object-contain"
                        onClick={() => handleExpand(moodboard.url)}
                      />
                    </div>

                    {/* Status Badge */}
                    {moodboard.status && (
                      <span
                        className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                          moodboard.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : moodboard.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {moodboard.status.charAt(0).toUpperCase() +
                          moodboard.status.slice(1)}
                      </span>
                    )}

                    {/* Regenerate Button */}
                    <div className="p-4 flex justify-end">
                      <Button
                        variant="default"
                        onClick={() => handleRegenerate(index)}
                      >
                        Regenerate <RotateCw size={6} />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative transform-none mx-2" />
              <CarouselNext className="relative transform-none mx-2" />
            </div>
          </Carousel>

          {/* Expanded image modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/50 bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  src={expandedImage}
                  alt="Expanded moodboard"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <Button
                  variant="outline"
                  className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 p-0"
                  onClick={() => setExpandedImage(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      }
      context={{ moodboards }}
    />
  );
};

export default function CampaignSelector({
  campaigns,
  setSelectedCampaignIndex,
  selectedCampaignIndex,
}: CampaignSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedCampaigns, setTransformedCampaigns] = useState<
    TransformedCampaign[]
  >([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<
    TransformedCampaign[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Transform campaigns on initial load
  useEffect(() => {
    if (campaigns.length > 0) {
      const transformed = campaigns.map((campaign) => {
        const displayName = campaign.name || "Unnamed Campaign";
        return {
          id: campaign.id,
          displayName,
          initial: displayName.charAt(0).toUpperCase(),
          searchKey: `${displayName}::${campaign.id}`,
          raw: campaign,
        };
      });

      setTransformedCampaigns(transformed);
      setFilteredCampaigns(transformed);
    }
  }, [campaigns]);

  // Update filtered campaigns when search query changes
  useEffect(() => {
    if (transformedCampaigns.length === 0) return;

    if (searchQuery.trim() === "") {
      setFilteredCampaigns(transformedCampaigns);
    } else {
      const filtered = transformedCampaigns.filter((campaign) =>
        campaign.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  }, [searchQuery, transformedCampaigns]);

  const handleCampaignSelect = (campaignId: string) => {
    const index = campaigns.findIndex((campaign) => campaign.id === campaignId);
    if (index !== -1) {
      setSelectedCampaignIndex(index);
      setOpen(false);
      toast.success(`Campaign '${campaigns[index].name}' selected`, {
        position: "top-right",
      });
    }
  };

  // Custom filtering implementation
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
  };

  const selectedCampaignId = campaigns[selectedCampaignIndex]?.id;

  return (
    <div className="">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={10} className="text-black" />
            Select Campaign
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="Search campaigns..."
                className="h-9 border-0 outline-none focus-visible:ring-0"
                value={searchQuery}
                onValueChange={handleInputChange}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading..." : "No campaigns found."}
              </CommandEmpty>
              <CommandGroup>
                {filteredCampaigns.map((campaign) => (
                  <CommandItem
                    key={campaign.id}
                    value={campaign.searchKey}
                    onSelect={() => {
                      handleCampaignSelect(campaign.id);
                    }}
                    className="flex items-center justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {campaign.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{campaign.displayName}</span>
                    </div>
                    {selectedCampaignId === campaign.id && (
                      <Check className="h-4 w-4" />
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
}

import { ChevronDown, ChevronRight, CirclePlus } from "lucide-react";
import { MdOutlineCampaign } from "react-icons/md";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TooltipIconButton } from "../thread/tooltip-icon-button";
import { ContentSection } from "../shared/ContentSection";
import { Badge } from "../ui/badge";
import { getFontColorForBackground } from "@/lib/langgraph.utils";
import { BsPinAngle } from "react-icons/bs";
import { DynamicContentSection } from "./DynamicSection";

interface Campaign {
  id: string;
  name: string;
  concept: string;
  tagline: string;
  attributes: string[];
  targetAudience: string;
  visualStyleReferences: string[];
  campaignColors: string[];
  moodboards: {
    prompt: string;
    status: string;
    url: string;
  }[];
}

export const CampaignSection: React.FC<{
  campaignInfo: Campaign[];
  setThreadId: (id: string | null) => void;
}> = ({ campaignInfo, setThreadId }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(0);

  if (!campaignInfo.length) return null;

  const currentCampaign = campaignInfo[selectedCampaignIndex] || {};
  console.log("Current Campaign Moodboard:", currentCampaign.moodboards);

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            {expanded ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            {!expanded ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MdOutlineCampaign size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Campaigns</div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your brand campaigns
                  </div>
                </div>
              </div>
            ) : (
              <div className="">
                <div className="font-bold">
                  Campaign: {currentCampaign.name || "Unnamed Campaign"}
                </div>
              </div>
            )}
          </div>
          {expanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              <CampaignSelector
                campaigns={campaignInfo}
                selectedCampaignIndex={selectedCampaignIndex}
                setSelectedCampaignIndex={setSelectedCampaignIndex}
              />
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New Campaign"
                variant="ghost"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  // Handle creating a new campaign
                  // This could involve opening a modal or navigating to a new campaign page
                }}
              >
                <CirclePlus className="size-5" />
              </TooltipIconButton>
            </div>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-6">
          <div className="mt-1 space-y-6">
            <CampaignOverview
              concept={currentCampaign.concept}
              tagline={currentCampaign.tagline}
              values={currentCampaign.attributes}
            />
            <CampaignColors colors={currentCampaign.campaignColors} />

            <DynamicContentSection
              dynamicData={Object.fromEntries(
                Object.entries(currentCampaign || {}).filter(
                  ([key]) =>
                    ![
                      "id",
                      "name",
                      "concept",
                      "tagline",
                      "attributes",
                      "campaignColors",
                      "moodboards",
                    ].includes(key)
                )
              )}
            />
            <CampaignMoodboard moodboards={currentCampaign.moodboards || []} />
          </div>
        </CardContent>
      )}
    </Card>
  );
};
