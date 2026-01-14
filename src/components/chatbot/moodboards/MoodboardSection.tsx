"use client";

import { ContentSection } from "@/components/shared/ContentSection";
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
import { useGalleryQuery } from "@/hooks/useGallery";
import { useBrandStore } from "@/store/brand.store";
import { useMoodboardStore } from "@/store/moodboard.store";
import { useUserStore } from "@/store/user.store";
import {
  MoodboardInformation,
  ThreadCampaign,
  ThreadDetails,
} from "@/types/types";
import { motion } from "framer-motion";
import { ChevronRight, CirclePlus, Presentation } from "lucide-react";
import { useQueryState } from "nuqs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import MoodboardLayout from "./MoodboardLayout";
import { MoodboardOverview } from "./MoodboardOverview";
import MoodboardSelector from "./MoodboardSelector";
import MoodboardTagResults from "./MoodboardTagResults";
import { MoodboardVisualSectionHeader } from "./MoodboardVisualSectionHeader";

export const MoodboardSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  currentCampaign: ThreadCampaign | null;
  moodboardTags?: { [key: string]: string[] };
}> = ({
  campaignInformation,
  moodboardInformation,
  currentCampaign,
  brandInformation,
}) => {
  const {
    selectedBrandId,
    selectedMoodboardId,
    setSelectedMoodboardId,
    isCampaignCreating,
  } = useBrandStore();
  const { user } = useUserStore();

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
      asset_sources: ["brand-uploads"],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
      sort_by: "created_at_descending",
    },
  });
  const handleMoodboardTitleChange = useCallback(
    (newTitle: string) => {
      setMoodboardTitle(newTitle);
    },
    [setMoodboardTitle]
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [moodboardIdFromUrl, setMoodboardIdFromUrl] =
    useQueryState("moodboardId");

  const [openPopover, setOpenPopover] = useState(false);

  // Track the last known moodboard count to detect new creations
  const [lastMoodboardCount, setLastMoodboardCount] = useState(0);

  // Use ref to get current selectedMoodboardId without adding to useEffect dependencies
  const selectedMoodboardIdRef = useRef(selectedMoodboardId);
  selectedMoodboardIdRef.current = selectedMoodboardId;

  // Get list of moodboards matching current campaign
  const currentCampaignMoodboards = useMemo(() => {
    if (!currentCampaign || !moodboardInformation) return [];
    return moodboardInformation.filter(
      (mb) => mb.campaign_id === currentCampaign.id
    );
  }, [currentCampaign, moodboardInformation]);

  // Handle moodboard selection from URL parameter - HIGH PRIORITY
  useEffect(() => {
    if (moodboardIdFromUrl && currentCampaignMoodboards.length > 0) {
      // Validate that the moodboard belongs to the current campaign before setting it
      const targetMoodboard = currentCampaignMoodboards.find(
        (mb) => mb.id === moodboardIdFromUrl
      );
      if (targetMoodboard) {
        setSelectedMoodboardId(moodboardIdFromUrl);
      }
    }
  }, [moodboardIdFromUrl, currentCampaignMoodboards, setSelectedMoodboardId]);

  // Get current moodboard from props (real-time updates)
  const currentMoodboard = useMemo(() => {
    // If we have a selected moodboard ID, find it in the current data
    if (selectedMoodboardId && currentCampaignMoodboards.length > 0) {
      const found = currentCampaignMoodboards.find(
        (mb) => mb.id === selectedMoodboardId
      );
      // Only return the found moodboard if it exists, otherwise return null
      // Don't fall back to latest - let the auto-select effect handle that
      return found || null;
    }

    // Only return latest if there's no selection at all
    if (!selectedMoodboardId && currentCampaignMoodboards.length > 0) {
      return currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
    }

    return null;
  }, [currentCampaignMoodboards, selectedMoodboardId]);

  // Auto-select latest moodboard when campaign changes or when new moodboards are created
  useEffect(() => {
    const currentCount = currentCampaignMoodboards.length;

    // Don't auto-select if we have a moodboard ID from URL to process
    if (moodboardIdFromUrl) {
      return;
    }

    // If moodboard count increased, a new one was created - select the latest only if created by current user
    if (currentCount > lastMoodboardCount && currentCount > 0) {
      const latestMoodboard = currentCampaignMoodboards[currentCount - 1];
      // Only auto-select if the moodboard was created by the currently logged-in user
      if (user && latestMoodboard.created_by === user.id) {
        setSelectedMoodboardId(latestMoodboard.id);
      }
      setLastMoodboardCount(currentCount);
      return;
    }

    // Update count tracker
    if (currentCount !== lastMoodboardCount) {
      setLastMoodboardCount(currentCount);
    }

    // Don't auto-select if a valid moodboard is already selected
    if (
      selectedMoodboardIdRef.current &&
      currentCampaignMoodboards.find(
        (mb) => mb.id === selectedMoodboardIdRef.current
      )
    ) {
      return;
    }

    // Auto-select latest if no moodboard is selected and we have moodboards
    if (!selectedMoodboardIdRef.current && currentCount > 0) {
      const latestMoodboard = currentCampaignMoodboards[currentCount - 1];
      setSelectedMoodboardId(latestMoodboard.id);
    } else if (currentCount === 0) {
      setSelectedMoodboardId(null);
    }
  }, [
    currentCampaign?.id,
    currentCampaignMoodboards,
    lastMoodboardCount,
    moodboardIdFromUrl,
    setSelectedMoodboardId,
    // Don't include selectedMoodboardId to avoid loops
  ]);

  // Handle scrolling when moodboard is selected from URL
  useEffect(() => {
    const scrollAndReset = async () => {
      if (moodboardIdFromUrl && scrollRef.current) {
        // Make sure the ref exists before scrolling
        scrollRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };
    scrollAndReset();
  }, [moodboardIdFromUrl, setMoodboardIdFromUrl]);

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

  // Initialize the moodboard count tracker
  useEffect(() => {
    setLastMoodboardCount(currentCampaignMoodboards.length);
  }, [currentCampaign?.id]); // Only when campaign changes

  // Handle case where selected moodboard is deleted
  useEffect(() => {
    // Don't auto-correct if we have a URL parameter to process
    if (moodboardIdFromUrl) {
      return;
    }

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
  }, [
    selectedMoodboardId,
    currentCampaignMoodboards.length,
    moodboardIdFromUrl,
  ]);

  // Reset whenever moodboard changes
  useEffect(() => {
    setNoOfImagesForMoodboard(10);
  }, [currentMoodboard?.id]);

  // Set count when data is available
  useEffect(() => {
    const assetCount = currentMoodboard?.moodboard_assets?.length ?? 0;
    const fallbackImageCount = 10;

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

  // Don't render MoodboardSection at all when campaign is being created
  // The CampaignSection handles both placeholders in that case
  if (isCampaignCreating) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-x-4 items-center">
          <Button
            variant="outline"
            size="icon"
            className={
              expanded
                ? "rotate-90 transition-transform"
                : "transition-transform"
            }
            onClick={toggleExpanded}
          >
            {<ChevronRight />}
          </Button>
          <div className="w-14 h-14 rounded-lg bg-brand-gradient text-white flex items-center justify-center">
            <Presentation />
          </div>
          <div>
            <h4 className="font-light text-sm">Moodboard</h4>
            <p className="font-bold text-2xl">
              {moodboardTitle || "Untitled Moodboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          {campaignInformation && currentCampaign ? (
            <MoodboardSelector
              campaignId={currentCampaign.id}
              moodboards={moodboardInformation || []}
              selectedMoodboard={currentMoodboard}
              setSelectedMoodboard={handleMoodboardSelect}
              onNewMoodboard={handleCreateNewMoodboard}
              isCreatingNew={false}
              onMoodboardTitleChange={handleMoodboardTitleChange}
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

      {expanded && (
        <>
          <div>
            <CardContent>
              {currentCampaign && (
                <motion.div
                  key={currentCampaign?.id}
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
                      <div ref={scrollRef}></div>
                      <div>
                        {selectedBrandId &&
                          currentMoodboard &&
                          currentCampaign &&
                          moodboardInformation && (
                            <MoodboardLayout
                              brandId={selectedBrandId}
                              moodboard={currentMoodboard}
                              carouselHeader={
                                currentCampaign && currentMoodboard ? (
                                  <MoodboardVisualSectionHeader
                                    currentMoodboard={currentMoodboard}
                                    brandName={
                                      brandInformation?.static?.brand?.name
                                    }
                                    currentCampaign={currentCampaign}
                                    moodboard={currentMoodboard}
                                    galleryActions={galleryActions}
                                  />
                                ) : null
                              }
                            />
                          )}
                      </div>
                      {currentMoodboard && (
                        <MoodboardTagResults
                          moodboardId={currentMoodboard.id}
                          campaignId={currentMoodboard.campaign_id}
                          moodboard_tags={currentMoodboard?.moodboard_tags}
                          selected_moodboard_tags={
                            currentMoodboard.selected_moodboard_tags
                          }
                          showAdvancedSettings={showAdvancedSettings}
                          isGalleryItemsProcessing={galleryActions.isGalleryItemsProcessing()}
                          moodboardAssets={
                            currentMoodboard.moodboard_assets || []
                          }
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
    </div>
  );
};
