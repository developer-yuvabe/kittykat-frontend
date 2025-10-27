import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Megaphone, Pencil, Save, Trash2, X } from "lucide-react";
import { SearchIcon } from "@/components/ui/custom-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoodboardInformation } from "@/types/types";
import {
  deleteMoodboard,
  patchMoodboard,
} from "@/services/api/moodboard.service";
import { useBrandStore } from "@/store/brand.store";
import { Input } from "@/components/ui/input";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface TransformedMoodboard {
  id: string;
  displayName: string;
  initial: string;
  searchKey: string;
  raw: MoodboardInformation;
}

interface CampaignWithMoodboards {
  id: string;
  title: string;
  moodboards: MoodboardInformation[];
}

interface MoodboardSelectorProps {
  moodboards: MoodboardInformation[];
  selectedMoodboard: MoodboardInformation | null;
  setSelectedMoodboard: (mb: MoodboardInformation | null) => void;
  campaignId: string;
  onNewMoodboard: () => void;
  isCreatingNew: boolean;
  variant?: "combobox" | "select";
  showAllCampaigns?: boolean;
}

export default function MoodboardSelector({
  moodboards,
  selectedMoodboard,
  setSelectedMoodboard,
  campaignId,
  variant = "combobox",
  showAllCampaigns = false,
}: MoodboardSelectorProps) {
  const { selectedBrandId, setSelectedMoodboardId, campaigns } =
    useBrandStore();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transformedMoodboards, setTransformedMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [filteredMoodboards, setFilteredMoodboards] = useState<
    TransformedMoodboard[]
  >([]);
  const [loading] = useState(false);
  const [selectMoodboards, setSelectMoodboards] = useState<
    MoodboardInformation[]
  >([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(selectedMoodboard?.title || "");

  const [, setCampaignIdFromUrl] = useQueryState("campaignId");
  const [, setMoodboardIdFromUrl] = useQueryState("moodboardId");

  // Group moodboards by campaign when showAllCampaigns is true
  const campaignsWithMoodboards = useMemo(() => {
    if (!showAllCampaigns) return [];

    const campaignMap = new Map<string, CampaignWithMoodboards>();

    // Initialize all campaigns
    campaigns.forEach((campaign) => {
      campaignMap.set(campaign.id, {
        id: campaign.id,
        title: campaign.title,
        moodboards: [],
      });
    });

    // Group moodboards by campaign
    moodboards.forEach((mb) => {
      const campaign = campaignMap.get(mb.campaign_id);
      if (campaign) {
        campaign.moodboards.push(mb);
      }
    });

    // Filter and apply search query
    const result = Array.from(campaignMap.values());

    if (!searchQuery.trim()) {
      return result.filter((c) => c.moodboards.length > 0);
    }

    const query = searchQuery.toLowerCase();
    return result.reduce<CampaignWithMoodboards[]>((acc, campaign) => {
      const campaignMatch = campaign.title.toLowerCase().includes(query);
      const moodboardMatches = campaign.moodboards.filter((mb) =>
        (mb.title || "Unnamed Moodboard").toLowerCase().includes(query)
      );

      if (campaignMatch || moodboardMatches.length > 0) {
        acc.push({
          ...campaign,
          moodboards: campaignMatch ? campaign.moodboards : moodboardMatches,
        });
      }

      return acc;
    }, []);
  }, [moodboards, campaigns, showAllCampaigns, searchQuery]);

  // Transform moodboards (filtered by campaignId) - for combobox variant
  useEffect(() => {
    if (variant !== "combobox") return;

    const filtered = showAllCampaigns
      ? moodboards
      : moodboards.filter((mb) => mb.campaign_id === campaignId);

    const transformed = filtered.map((mb) => {
      const displayName = mb.title || "Unnamed Moodboard";
      return {
        id: mb.id,
        displayName,
        initial: displayName.charAt(0).toUpperCase(),
        searchKey: `${displayName}::${mb.id}`,
        raw: mb,
      };
    });

    setTransformedMoodboards(transformed);
    setFilteredMoodboards(transformed);
  }, [moodboards, campaignId, variant, showAllCampaigns]);

  // Filter moodboards for select variant
  useEffect(() => {
    if (variant !== "select") return;

    const filtered = showAllCampaigns
      ? moodboards
      : moodboards.filter((mb) => mb.campaign_id === campaignId);

    setSelectMoodboards(filtered);
  }, [moodboards, campaignId, variant, showAllCampaigns]);

  // Filter by search query - for combobox variant
  useEffect(() => {
    if (variant !== "combobox") return;

    if (searchQuery.trim() === "") {
      setFilteredMoodboards(transformedMoodboards);
    } else {
      setFilteredMoodboards(
        transformedMoodboards.filter((mb) =>
          mb.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, transformedMoodboards, variant]);

  // Handle selection for combobox variant
  const handleSelect = (id: string) => {
    setCampaignIdFromUrl(null);
    setMoodboardIdFromUrl(null);
    const match = moodboards.find((mb) => mb.id === id);
    if (match) {
      // Optimistic update: immediately update UI
      setSelectedMoodboard(match);
      setSelectedMoodboardId(match.id); // This will also set the campaign in the store
      setOpen(false);
      toast.success(`Moodboard '${match.title}' selected`, {
        position: "top-right",
      });
    }
  };

  // Handle selection for select variant
  const handleSelectValueChange = (value: string) => {
    const selectedMb = selectMoodboards.find((mb) => mb.id === value);
    if (selectedMb) {
      // Optimistic update: immediately update UI
      setSelectedMoodboard(selectedMb);
      setSelectedMoodboardId(selectedMb.id); // This will also set the campaign in the store
      toast.success(`Moodboard '${selectedMb.title}' selected`, {
        position: "top-right",
      });
    }
  };

  // Handle deletion of a moodboard
  const handleDelete = async (moodboardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the CommandItem's onSelect
    if (!selectedBrandId) {
      toast.error("No brand selected. Please select a brand and try again.", {
        position: "top-right",
      });
      return;
    }

    try {
      await deleteMoodboard(selectedBrandId, moodboardId);
      toast.success("Moodboard deleted successfully", {
        position: "top-right",
      });

      // Update moodboards by filtering out the deleted one

      setTransformedMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardId)
      );
      setFilteredMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardId)
      );

      // If the deleted moodboard was selected, clear the selection
      if (selectedMoodboard?.id === moodboardId) {
        setSelectedMoodboard(null);
        // Also update the global store to maintain consistency
        setSelectedMoodboardId(null);
      }
    } catch (error) {
      toast.error("Failed to delete moodboard. Please try again.", {
        position: "top-right",
      });
      console.error("Delete error:", error);
    } finally {
    }
  };

  const handleSave = async () => {
    if (!selectedBrandId || !selectedMoodboard) {
      toast.error("No brand or moodboard selected. Please try again.", {
        position: "top-right",
      });
      return;
    }

    try {
      const updatedMoodboard = await patchMoodboard(
        selectedBrandId,
        selectedMoodboard.id,
        {
          title: editTitle,
        }
      );
      setSelectedMoodboard(updatedMoodboard);
      setIsEditing(false);
      toast.success("Moodboard title updated successfully", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Failed to update moodboard title. Please try again.", {
        position: "top-right",
      });
      console.error("Update error:", error);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(selectedMoodboard?.title || "");
  };

  const selectedMoodboardId = selectedMoodboard?.id;

  // Render select variant
  if (variant === "select") {
    return (
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-60 py-[23px] border-[#7F55E0] border-2"
              placeholder="Enter moodboard title"
            />
            <TooltipIconButton
              tooltip="save title"
              onClick={handleSave}
              size="icon"
              variant="ghost"
            >
              <Save className="h-4 w-4" />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="close edit"
              onClick={handleCancel}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </TooltipIconButton>
          </>
        ) : (
          <>
            <Select
              value={selectedMoodboard?.id || ""}
              onValueChange={handleSelectValueChange}
            >
              <SelectTrigger className="w-60 py-[23px] border-[#7F55E0] border-2">
                <SelectValue placeholder="Select Moodboard" />
              </SelectTrigger>
              <SelectContent>
                {selectMoodboards.map((mb) => (
                  <SelectItem key={mb.id} value={mb.id}>
                    {mb.title || "Unnamed Moodboard"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMoodboard && (
              <TooltipIconButton
                onClick={() => setIsEditing(true)}
                size="icon"
                variant="ghost"
                tooltip="Edit Title"
              >
                <Pencil className="h-4 w-4" />
              </TooltipIconButton>
            )}
          </>
        )}
      </div>
    );
  }

  // Render combobox variant (default)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <SearchIcon size={10} className="text-black" />
          Select Moodboard
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-0">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder={
                showAllCampaigns
                  ? "Search campaigns or moodboards..."
                  : "Search moodboards..."
              }
              className="h-9 w-[400px] border-0 outline-none focus-visible:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Loading..."
                : showAllCampaigns
                ? "No campaigns or moodboards found."
                : "No moodboards found."}
            </CommandEmpty>

            {showAllCampaigns ? (
              // Render campaigns with nested moodboards
              campaignsWithMoodboards.map((campaign, index) => (
                <div key={`campaign-${campaign.id}-${index}`}>
                  <CommandItem
                    value={`campaign-${campaign.title}-${index}`}
                    className="flex items-center justify-between group gap-0 rounded-none cursor-default"
                    onSelect={() => {
                      // Prevent selection of campaign itself
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-start min-w-0 w-full">
                      <Megaphone className="mr-2 mt-0.5" size={20} />
                      <div className="flex flex-col space-y-1">
                        <span className="break-words font-medium">
                          {campaign.title}
                          <span className="italic text-xs font-normal ml-1">
                            {` (${campaign.moodboards.length} moodboards)`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </CommandItem>

                  {campaign.moodboards.length > 0 && (
                    <CommandGroup className="pl-8 border-b">
                      {campaign.moodboards.map((mb) => {
                        const displayName = mb.title || "Unnamed Moodboard";
                        const initial = displayName.charAt(0).toUpperCase();
                        return (
                          <CommandItem
                            key={`moodboard-${mb.id}`}
                            value={`${displayName}::${mb.id}`}
                            onSelect={() => handleSelect(mb.id)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "flex items-center justify-between my-0.5",
                              {
                                "bg-primary/10 text-primary":
                                  selectedMoodboardId === mb.id,
                              }
                            )}
                          >
                            <div className="flex items-center min-w-0 w-full">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback className="bg-blue-500 text-white">
                                  {initial}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{displayName}</span>
                            </div>
                            <div className="flex items-center">
                              {selectedMoodboardId === mb.id && (
                                <Check className="h-4 w-4" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(mb.id, e)}
                                disabled={loading}
                                className="hover:bg-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </div>
              ))
            ) : (
              // Render flat list of moodboards (original behavior)
              <CommandGroup>
                {filteredMoodboards.map((mb) => (
                  <CommandItem
                    key={mb.id}
                    value={mb.searchKey}
                    onSelect={() => handleSelect(mb.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center min-w-0 w-full">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {mb.initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{mb.displayName}</span>
                    </div>
                    <div className="flex items-center">
                      {selectedMoodboardId === mb.id && (
                        <Check className="h-4 w-4" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(mb.id, e)}
                        disabled={loading}
                        className="hover:bg-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
