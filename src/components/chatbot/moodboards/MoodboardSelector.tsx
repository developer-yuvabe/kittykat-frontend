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
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  isAdvancedMode?: boolean;
  onMoodboardTitleChange?: (newTitle: string) => void;
}

export default function MoodboardSelector({
  moodboards,
  selectedMoodboard,
  setSelectedMoodboard,
  campaignId,
  variant = "combobox",
  showAllCampaigns = false,
  isAdvancedMode = false,
  onMoodboardTitleChange,
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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moodboardToDelete, setMoodboardToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

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
  const queryClient = useQueryClient();

  const { mutateAsync: deleteMoodboardMutate, isPending: isDeleting } =
    useMutation({
      mutationFn: async ({
        brandId,
        moodboardId,
      }: {
        brandId: string;
        moodboardId: string;
      }) => {
        return deleteMoodboard(brandId, moodboardId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["moodboards"] });
      },
    });

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

  const handleDeleteMoodboard = async () => {
    if (!moodboardToDelete || !selectedBrandId) return;

    try {
      await deleteMoodboardMutate({
        brandId: selectedBrandId,
        moodboardId: moodboardToDelete.id,
      });

      toast.success(`Moodboard '${moodboardToDelete.title}' deleted`);

      setTransformedMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardToDelete.id)
      );
      setFilteredMoodboards((prev) =>
        prev.filter((mb) => mb.id !== moodboardToDelete.id)
      );

      if (selectedMoodboard?.id === moodboardToDelete.id) {
        setSelectedMoodboard(null);
        setSelectedMoodboardId(null);
      }
    } catch {
      toast.error("Failed to delete moodboard");
    } finally {
      setShowDeleteDialog(false);
      setMoodboardToDelete(null);
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
              <SelectTrigger
                className={`${
                  isAdvancedMode ? "w-30 py-2 text-sm" : "w-60 py-[23px]"
                } border-[#7F55E0] border-2`}
              >
                <SelectValue
                  placeholder="Select Moodboard"
                  className="peer-data-placeholder:text-xs"
                />
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
  // Add these states
  const [editingMoodboardId, setEditingMoodboardId] = useState<string | null>(
    null
  );
  const [editingTitle, setEditingTitle] = useState("");

  // Handler for rename
  const handleRenameMoodboard = async (moodboardId: string) => {
    if (!selectedBrandId || !editingTitle.trim()) {
      cancelEditing();
      return;
    }

    const newTitle = editingTitle.trim();
    if (selectedMoodboard?.id === moodboardId && onMoodboardTitleChange) {
      onMoodboardTitleChange(newTitle);
    }

    // Update UI immediately
    setTransformedMoodboards((prev) =>
      prev.map((mb) =>
        mb.id === moodboardId
          ? {
              ...mb,
              displayName: newTitle,
              raw: { ...mb.raw, title: newTitle },
            }
          : mb
      )
    );

    setFilteredMoodboards((prev) =>
      prev.map((mb) =>
        mb.id === moodboardId
          ? {
              ...mb,
              displayName: newTitle,
              raw: { ...mb.raw, title: newTitle },
            }
          : mb
      )
    );

    // Update selected moodboard if it's the one being renamed
    if (selectedMoodboard?.id === moodboardId) {
      setSelectedMoodboard({
        ...selectedMoodboard,
        title: newTitle,
      });
    }

    //  Exit editing mode immediately
    setEditingMoodboardId(null);
    setEditingTitle("");

    //  API call in background
    try {
      await patchMoodboard(selectedBrandId, moodboardId, {
        title: newTitle,
      });
    } catch (error) {
      console.error("Rename error:", error);
      toast.error("Failed to sync rename");
    }
  };

  // Start editing
  const startEditing = (moodboardId: string, currentTitle: string) => {
    setEditingMoodboardId(moodboardId);
    setEditingTitle(currentTitle);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMoodboardId(null);
    setEditingTitle("");
  };

  // Render combobox variant (default)
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={` justify-start font-light text-gray-800 border-[#BCC1CA] overflow-hidden ${
              isAdvancedMode ? "w-30" : "w-60"
            }`}
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
                              onSelect={() => {
                                if (editingMoodboardId !== mb.id) {
                                  handleSelect(mb.id);
                                }
                              }}
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

                                {/* Input field when editing */}
                                {editingMoodboardId === mb.id ? (
                                  <Input
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleRenameMoodboard(mb.id);
                                      } else if (e.key === "Escape") {
                                        cancelEditing();
                                      }
                                    }}
                                    className="h-8 text-sm flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="flex-1 truncate text-sm font-medium">
                                    {displayName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {selectedMoodboardId === mb.id &&
                                  editingMoodboardId !== mb.id && (
                                    <Check className="h-4 w-4" />
                                  )}

                                {/* editing */}
                                {editingMoodboardId === mb.id ? (
                                  <>
                                    {/* Save Icon */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRenameMoodboard(mb.id);
                                      }}
                                      disabled={loading}
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                    </Button>

                                    {/* Cancel Icon */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditing();
                                      }}
                                      disabled={loading}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {/* Pencil Icon - Start editing */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(mb.id, displayName);
                                      }}
                                      disabled={loading}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>

                                    {/* Trash Icon - Delete */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpen(false);
                                        setMoodboardToDelete({
                                          id: mb.id,
                                          title: mb.title || "Untitled",
                                        });
                                        setShowDeleteDialog(true);
                                      }}
                                      disabled={loading}
                                      className="hover:bg-red-200"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
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
                      onSelect={() => {
                        if (editingMoodboardId !== mb.id) {
                          handleSelect(mb.id);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center min-w-0 w-full">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {mb.initial}
                          </AvatarFallback>
                        </Avatar>

                        {/* Input field when editing */}
                        {editingMoodboardId === mb.id ? (
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameMoodboard(mb.id);
                              } else if (e.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                            className="h-8 text-sm flex-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate">{mb.displayName}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {selectedMoodboardId === mb.id &&
                          editingMoodboardId !== mb.id && (
                            <Check className="h-4 w-4" />
                          )}

                        {/* editing  */}
                        {editingMoodboardId === mb.id ? (
                          <>
                            {/* Save Icon */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameMoodboard(mb.id);
                              }}
                              disabled={loading}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>

                            {/* Cancel Icon */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              disabled={loading}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Pencil Icon - Start editing */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(mb.id, mb.displayName);
                              }}
                              disabled={loading}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            {/* Trash Icon - Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setMoodboardToDelete({
                                  id: mb.id,
                                  title: mb.displayName || "Untitled",
                                });
                                setShowDeleteDialog(true);
                              }}
                              disabled={loading}
                              className="hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Moodboard?"
        description={
          <>
            You’re about to permanently delete{" "}
            <b>“{moodboardToDelete?.title}”</b>. This action cannot be undone.
            <br />
            Are you sure you want to continue?
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteMoodboard}
        isLoading={isDeleting}
        danger
      />
    </>
  );
}
