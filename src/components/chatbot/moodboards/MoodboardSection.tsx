"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Presentation,
} from "lucide-react";
import { MoodboardInformation, ThreadDetails } from "@/types/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { useMoodboardStore } from "@/store/moodboard.store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/custom-icon";
import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardOverview } from "./MoodboardOverview";
import MoodboardLayout from "./MoodboardLayout";
import MoodboardTagResults from "./MoodboardTagResults";
import MoodboardSelector from "./MoodboardSelector";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty } from "@/components/ui/command";
import { useGalleryQuery } from "@/hooks/useGallery";
import { MoodboardVisualSectionHeader } from "./MoodboardVisualSectionHeader";

export const MoodboardSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  setSelectedCampaignIndex: React.Dispatch<React.SetStateAction<number>>;
  moodboardInformation: ThreadDetails["moodboard_information"];
  selectedCampaignIndex: number;
  moodboardTags?: { [key: string]: string[] };
}> = ({
  campaignInformation,
  selectedCampaignIndex,
  moodboardInformation,
  brandInformation,
}) => {
  const { selectedBrandId, selectedMoodboardId, setSelectedMoodboardId } =
    useBrandStore();

  // Get state from Zustand store instead of local state
  const {
    setNoOfImagesForMoodboard,
    showAdvancedSettings,
    expanded,
    toggleExpanded,
    moodboardTitle,
    setMoodboardTitle,
    updateImageCountFromMoodboard,
    generateMoodboardTitle,
    createMoodboardAsync,
    isCreatingNewMoodboard: storeIsCreatingNewMoodboard,
  } = useMoodboardStore();

  // Use store's isCreatingNewMoodboard instead of local state
  const isCreatingNewMoodboard = storeIsCreatingNewMoodboard;

  const galleryActions = useGalleryQuery({
    selectedFilters: {
      brands: [selectedBrandId!],
      campaigns: [],
      moodboards: [],
      product_categories: [],
      asset_types: ["image"],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  const [openPopover, setOpenPopover] = useState(false);

  // Track the last known moodboard count to detect new creations
  const [lastMoodboardCount, setLastMoodboardCount] = useState(0);

  // Use ref to get current selectedMoodboardId without adding to useEffect dependencies
  const selectedMoodboardIdRef = useRef(selectedMoodboardId);
  selectedMoodboardIdRef.current = selectedMoodboardId;

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  // Get list of moodboards matching current campaign
  const currentCampaignMoodboards = useMemo(() => {
    if (!currentCampaign || !moodboardInformation) return [];
    return moodboardInformation.filter(
      (mb) => mb.campaign_id === currentCampaign.id
    );
  }, [currentCampaign, moodboardInformation]);

  // Get current moodboard from props (real-time updates)
  const currentMoodboard = useMemo(() => {
    // If we have a selected moodboard ID, find it in the current data
    if (selectedMoodboardId && currentCampaignMoodboards.length > 0) {
      const found = currentCampaignMoodboards.find(
        (mb) => mb.id === selectedMoodboardId
      );
      if (found) return found;
    }

    // If no specific selection or selected moodboard not found, get the latest moodboard
    if (currentCampaignMoodboards.length > 0) {
      return currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
    }

    return null;
  }, [currentCampaignMoodboards, selectedMoodboardId]);

  // Reset states when switching to create new moodboard mode
  const resetToNewMoodboardState = useCallback(() => {
    setSelectedMoodboardId(null);
    const generatedTitle = generateMoodboardTitle(
      currentCampaign?.campaign?.title,
      currentCampaignMoodboards.length + 1
    );
    setMoodboardTitle(generatedTitle);
    toast.success("Ready to create a new moodboard!");
  }, [
    currentCampaign?.campaign?.title,
    currentCampaignMoodboards.length,
    setSelectedMoodboardId,
    generateMoodboardTitle,
    setMoodboardTitle,
  ]);

  // Auto-select latest moodboard when campaign changes or when new moodboards are created
  useEffect(() => {
    const currentCount = currentCampaignMoodboards.length;

    // If moodboard count increased, a new one was created - select the latest
    if (currentCount > lastMoodboardCount && currentCount > 0) {
      const latestMoodboard = currentCampaignMoodboards[currentCount - 1];
      setSelectedMoodboardId(latestMoodboard.id);
      setLastMoodboardCount(currentCount);
      return;
    }

    // Update count tracker
    if (currentCount !== lastMoodboardCount) {
      setLastMoodboardCount(currentCount);
    }

    // Auto-select latest if no moodboard is selected and we have moodboards
    if (
      !selectedMoodboardIdRef.current &&
      currentCount > 0 &&
      !isCreatingNewMoodboard
    ) {
      const latestMoodboard = currentCampaignMoodboards[currentCount - 1];
      setSelectedMoodboardId(latestMoodboard.id);
    } else if (currentCount === 0) {
      setSelectedMoodboardId(null);
    }
  }, [
    currentCampaign?.id,
    currentCampaignMoodboards.length,
    lastMoodboardCount,
    isCreatingNewMoodboard,
    // Don't include selectedMoodboardId to avoid loops
  ]);

  // Initialize the moodboard count tracker
  useEffect(() => {
    setLastMoodboardCount(currentCampaignMoodboards.length);
  }, [currentCampaign?.id]); // Only when campaign changes

  // Handle case where selected moodboard is deleted
  useEffect(() => {
    if (selectedMoodboardId && currentCampaignMoodboards.length > 0) {
      const isSelectedMoodboardStillAvailable = currentCampaignMoodboards.find(
        (mb) => mb.id === selectedMoodboardId
      );

      if (!isSelectedMoodboardStillAvailable) {
        // Selected moodboard was deleted, select the latest available one
        const latestMoodboard =
          currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
        setSelectedMoodboardId(latestMoodboard.id);
      }
    }
  }, [selectedMoodboardId, currentCampaignMoodboards.length]);

  // Reset whenever moodboard changes
  useEffect(() => {
    setNoOfImagesForMoodboard(16);
  }, [currentMoodboard?.id]);

  // Set count when data is available
  useEffect(() => {
    const assetCount = currentMoodboard?.moodboard_assets?.length ?? 0;
    const fallbackImageCount = galleryActions.totalItems ?? 0;

    updateImageCountFromMoodboard(assetCount, fallbackImageCount);
  }, [
    currentMoodboard?.id,
    currentMoodboard?.moodboard_assets?.length,
    galleryActions.totalItems,
  ]);

  useEffect(() => {
    if (currentMoodboard) {
      // Use the selected moodboard's title
      setMoodboardTitle(currentMoodboard.title || "Untitled Moodboard");
    } else {
      // Handle case where no moodboard exists
      const generatedTitle = generateMoodboardTitle(
        currentCampaign?.campaign?.title,
        currentCampaignMoodboards.length + 1
      );
      setMoodboardTitle(generatedTitle);
    }
  }, [
    currentCampaign?.campaign?.title,
    currentCampaignMoodboards.length,
    currentMoodboard?.title,
  ]);

  async function handleCreateMoodboard() {
    if (!selectedBrandId || !currentCampaign?.id) {
      toast.error("Missing brand or campaign information");
      return;
    }

    if (galleryActions.totalItems < 10) {
      toast.error(
        "At least 10 images are required for analysis and moodboard creation."
      );
      return;
    }

    await createMoodboardAsync(
      selectedBrandId,
      currentCampaign.id,
      moodboardTitle,
      (moodboardId) => {
        setSelectedMoodboardId(moodboardId);
      }
    );
  }

  const handleCreateNewMoodboard = async () => {
    // For the first moodboard, just enter creation mode
    if (!moodboardInformation || moodboardInformation.length === 0) {
      resetToNewMoodboardState();
      return;
    }

    // For subsequent moodboards, create directly
    if (!selectedBrandId || !currentCampaign?.id) {
      toast.error("Missing brand or campaign information");
      return;
    }

    if (galleryActions.totalItems < 10) {
      toast.error(
        "At least 10 images are required for analysis and moodboard creation."
      );
      return;
    }

    const newTitle = generateMoodboardTitle(
      currentCampaign?.campaign?.title,
      currentCampaignMoodboards.length + 1
    );

    await createMoodboardAsync(
      selectedBrandId,
      currentCampaign.id,
      newTitle,
      (moodboardId) => {
        setSelectedMoodboardId(moodboardId);
      }
    );
  };

  const handleMoodboardSelect = (moodboard: MoodboardInformation | null) => {
    if (moodboard) {
      setSelectedMoodboardId(moodboard.id);
    } else {
      setSelectedMoodboardId(null);
    }
  };

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            {expanded ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            {!expanded ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <Presentation size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium break-words max-w-xs">
                        {moodboardTitle}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[#6e7787]">
                    Design the visual direction of your campaign
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex">
                  <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center mr-3 overflow-hidden">
                    <span className="text-white font-bold">
                      <Presentation size={24} />
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-0 block">
                      Moodboard
                    </label>

                    {currentCampaign &&
                    (!moodboardInformation ||
                      moodboardInformation.length == 0) ? (
                      <Input
                        value={moodboardTitle}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onChange={(e) => setMoodboardTitle(e.target.value)}
                        placeholder="Enter moodboard title"
                        className="font-bold w-96"
                      />
                    ) : (
                      <p className="font-bold break-words max-w-xs">
                        {moodboardTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute right-3 top-7 flex items-center gap-x-2">
            {campaignInformation && currentCampaign ? (
              <MoodboardSelector
                campaignId={currentCampaign.id}
                moodboards={moodboardInformation || []}
                selectedMoodboard={currentMoodboard}
                setSelectedMoodboard={handleMoodboardSelect}
                onNewMoodboard={handleCreateNewMoodboard}
                isCreatingNew={false}
              />
            ) : (
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-60 justify-start font-light text-gray-800 border-[#BCC1CA]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SearchIcon size={10} className="text-black" />
                    {`Select Moodboard`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandEmpty>No Existing Moodboard</CommandEmpty>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            <TooltipIconButton
              tooltip="New Moodboard"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateNewMoodboard();
              }}
              className="p-4"
              size={"lg"}
              disabled={isCreatingNewMoodboard}
            >
              <CirclePlus className="size-5" />
            </TooltipIconButton>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <div>
            <CardContent>
              {currentCampaign && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="pt-0 pb-6"
                >
                  <div className="mt-1 space-y-6">
                    <MoodboardOverview
                      title={currentCampaign?.campaign?.title}
                      description={currentCampaign?.campaign?.description}
                      tone={currentCampaign?.campaign?.tone}
                      campaignId={currentCampaign.id}
                    />
                  </div>
                </motion.div>
              )}

              {currentMoodboard?.aggregated_tags && (
                <ContentSection
                  title={`Build Your Campaign Moodboard`}
                  content={
                    <div>
                      {currentCampaign && currentMoodboard && (
                        <MoodboardVisualSectionHeader
                          currentMoodboard={currentMoodboard}
                          brandName={brandInformation?.static?.brand?.name}
                          currentCampaign={currentCampaign}
                          moodboard={currentMoodboard}
                          galleryActions={galleryActions}
                        />
                      )}
                      <div>
                        {selectedBrandId &&
                          currentMoodboard &&
                          currentCampaign &&
                          moodboardInformation && (
                            <MoodboardLayout
                              brandId={selectedBrandId}
                              moodboard={currentMoodboard}
                            />
                          )}
                      </div>
                      {currentMoodboard && (
                        <MoodboardTagResults
                          moodboardId={currentMoodboard.id}
                          moodboard_tags={currentMoodboard?.moodboard_tags}
                          selected_moodboard_tags={
                            currentMoodboard.selected_moodboard_tags
                          }
                          showAdvancedSettings={showAdvancedSettings}
                          isGalleryItemsProcessing={galleryActions.isGalleryItemsProcessing()}
                        />
                      )}
                    </div>
                  }
                  context={undefined}
                />
              )}

              {currentCampaignMoodboards.length === 0 && (
                <div className="mt-4">
                  <Button className="w-full" onClick={handleCreateMoodboard}>
                    Create Moodboard
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </>
      )}
    </Card>
  );
};
