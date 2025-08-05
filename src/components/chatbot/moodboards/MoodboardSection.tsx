"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Presentation,
  X,
} from "lucide-react";
import { MoodboardInformation, ThreadDetails } from "@/types/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoodboardIcon, SearchIcon } from "@/components/ui/custom-icon";
import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardOverview } from "./MoodboardOverview";
import {
  createMoodboard,
  createMoodboardForCampaign,
} from "@/services/api/moodboard.service";
import MoodboardTagsSelector from "./MoodboardTagsSelector";
import MoodboardLayout from "./MoodboardLayout";
import MoodboardTagResults from "./MoodboardTagResults";
import MoodboardSelector from "./MoodboardSelector";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Input } from "@/components/ui/input";
import { patchMoodboard } from "@/services/api/moodboard.service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty } from "@/components/ui/command";
import { Loader } from "@/components/ui/loader";
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
  moodboardTags,
  brandInformation,
}) => {
  const { selectedBrandId } = useBrandStore();

  const galleryActions = useGalleryQuery({
    selectedFilters: {
      brands: [selectedBrandId!],
      campaigns: [],
      moodboards: [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  const [isCreatingNewMoodboard, setIsCreatingNewMoodboard] = useState(false);
  const [selectedMoodboardId, setSelectedMoodboardId] = useState<string | null>(
    null
  );
  const [localTags, setLocalTags] = useState<
    MoodboardInformation["aggregated_tags"] | null
  >(null);
  const [isMoodboardGenerating, setIsMoodboardGenerating] = useState(false);
  const [hasUnsavedTagChanges, setHasUnsavedTagChanges] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);

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
    if (isCreatingNewMoodboard) return null;

    // If we have a selected moodboard ID, find it in the current data
    if (selectedMoodboardId) {
      const found = currentCampaignMoodboards.find(
        (mb) => mb.id === selectedMoodboardId
      );
      if (found) return found;
    }

    // Otherwise, get the latest moodboard
    if (currentCampaignMoodboards.length > 0) {
      return currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
    }

    return null;
  }, [currentCampaignMoodboards, selectedMoodboardId, isCreatingNewMoodboard]);

  // Reset states when switching to create new moodboard mode
  const resetToNewMoodboardState = useCallback(() => {
    setSelectedMoodboardId(null);
    setMoodboardTitle(
      currentCampaign?.campaign?.title
        ? `${currentCampaign.campaign.title}'s Moodboard v${
            currentCampaignMoodboards.length + 1
          }`
        : "New Moodboard"
    );
    setIsCreatingNewMoodboard(true);
    toast.success("Ready to create a new moodboard!");
  }, [currentCampaign, currentCampaignMoodboards.length]);

  // Auto-select latest moodboard when campaign changes or moodboards are loaded
  useEffect(() => {
    if (
      !isCreatingNewMoodboard &&
      !selectedMoodboardId &&
      currentCampaignMoodboards.length > 0
    ) {
      const latestMoodboard =
        currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
      setSelectedMoodboardId(latestMoodboard.id);
    } else if (
      !isCreatingNewMoodboard &&
      currentCampaignMoodboards.length === 0
    ) {
      setSelectedMoodboardId(null);
    }
  }, [
    currentCampaign?.id,
    currentCampaignMoodboards.length,
    isCreatingNewMoodboard,
    selectedMoodboardId,
  ]);

  const [expanded, setExpanded] = useState(true);

  const [noOfImagesForMoodboard, setNoOfImagesForMoodboard] =
    useState<number>(0);

  useEffect(() => {
    const assetCount = currentMoodboard?.moodboard_assets?.length ?? 0;
    const fallbackImageCount = galleryActions.totalItems ?? 0;

    const finalCount = assetCount > 0 ? assetCount : fallbackImageCount;

    setNoOfImagesForMoodboard(Math.min(16, finalCount));
  }, [currentMoodboard?.id, galleryActions.totalItems]);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  const [moodboardTitle, setMoodboardTitle] = useState(
    currentCampaign?.campaign?.title
      ? `${currentCampaign.campaign.title}'s Moodboard v${
          currentCampaignMoodboards.length + 1
        }`
      : "New Moodboard"
  );

  useEffect(() => {
    if (isCreatingNewMoodboard) {
      // Only set auto-generated title when creating new moodboard
      if (currentCampaign?.campaign?.title) {
        const versionNumber = currentCampaignMoodboards.length + 1;
        setMoodboardTitle(
          `${currentCampaign.campaign.title}'s Moodboard v${versionNumber}`
        );
      }
    } else if (currentMoodboard) {
      // Use the selected moodboard's title
      setMoodboardTitle(currentMoodboard.title || "Untitled Moodboard");
    } else {
      // Handle case where no moodboard exists
      setMoodboardTitle(
        currentCampaign?.campaign?.title &&
          currentCampaign.campaign.title !== ""
          ? `${currentCampaign.campaign.title}'s Moodboard v${
              currentCampaignMoodboards.length + 1
            }`
          : "New Moodboard"
      );
    }
  }, [
    currentCampaign?.campaign?.title,
    isCreatingNewMoodboard,
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

    setIsCreatingNewMoodboard(true);

    const toastId = toast.loading("Creating moodboard...");

    try {
      // Step 1: Create the new moodboard
      await createMoodboard(selectedBrandId, currentCampaign.id, {
        campaign_id: currentCampaign.id,
        title: moodboardTitle,
      });

      toast.success("Moodboard created successfully!", { id: toastId });
    } catch (error) {
      toast.error("Failed to create moodboard. Please try again.", {
        id: toastId,
      });
      console.error("Failed to create moodboard:", error);
    } finally {
      setIsCreatingNewMoodboard(false);
    }
  }

  const handleCreateNewMoodboard = () => {
    resetToNewMoodboardState();
  };

  const handleCancelNewMoodboard = () => {
    setIsCreatingNewMoodboard(false);
    if (currentCampaignMoodboards.length > 0) {
      const latestMoodboard =
        currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
      setSelectedMoodboardId(latestMoodboard.id);
    }
    toast.success("Returned to existing moodboard");
  };

  const handleMoodboardSelect = (moodboard: MoodboardInformation | null) => {
    if (moodboard) {
      setSelectedMoodboardId(moodboard.id);
      setIsCreatingNewMoodboard(false);
    }
  };

  useEffect(() => {
    if (
      currentMoodboard?.moodboard_generation_status === "in_progress" ||
      galleryActions.isFetching
    ) {
      setIsMoodboardGenerating(true);
    } else {
      setIsMoodboardGenerating(false);
    }
  }, [
    currentMoodboard?.moodboard_generation_status,
    galleryActions.isFetching,
  ]);

  const handleGenerateMoodboard = async () => {
    if (!currentMoodboard || galleryActions.totalItems < 10) {
      toast.warning(
        "Please add at least 10 visual style images to generate a moodboard."
      );
      return;
    }

    if (
      !selectedBrandId ||
      !currentMoodboard?.id ||
      !currentMoodboard?.campaign_id
    )
      return;

    setIsMoodboardGenerating(true);

    try {
      toast.info("Moodboard generation initiated!", {
        id: "moodboard-generate",
      });

      if (hasUnsavedTagChanges && localTags) {
        await patchMoodboard(selectedBrandId, currentMoodboard.id, {
          aggregated_tags: localTags,
        });
        setHasUnsavedTagChanges(false);
      }

      await createMoodboardForCampaign(
        selectedBrandId,
        currentMoodboard.campaign_id,
        currentMoodboard.id,
        { no_of_images: noOfImagesForMoodboard }
      );
    } catch (error) {
      console.error("Failed to generate moodboard:", error);
      toast.error("Failed to generate moodboard. Please try again.", {
        id: "moodboard-generate",
      });
    } finally {
      // setIsMoodboardGenerating(false);
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
                    <div className="text-sm font-medium">{moodboardTitle}</div>
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

                    {isCreatingNewMoodboard ||
                    (currentCampaign &&
                      (!moodboardInformation ||
                        moodboardInformation.length == 0)) ? (
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
                      <p className="font-bold">{moodboardTitle}</p>
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
                isCreatingNew={isCreatingNewMoodboard}
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

            {isCreatingNewMoodboard ? (
              <TooltipIconButton
                tooltip="Cancel"
                className="p-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelNewMoodboard();
                }}
              >
                <X className="text-red-600" />
              </TooltipIconButton>
            ) : (
              <TooltipIconButton
                tooltip="New Moodboard"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("clicked moodboard create button");
                  if (
                    !moodboardInformation ||
                    moodboardInformation.length === 0
                  ) {
                    toast.info(
                      "Set up your first moodboard before creating another."
                    );
                    return;
                  }
                  handleCreateNewMoodboard();
                }}
                className="p-4"
                size={"lg"}
              >
                <CirclePlus className="size-5" />
              </TooltipIconButton>
            )}
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
                  title={`Choose your visual aesthetic `}
                  content={
                    <div>
                      {currentCampaign && currentMoodboard && (
                        <MoodboardVisualSectionHeader
                          currentMoodboard={currentMoodboard}
                          isCreatingNewMoodboard={isCreatingNewMoodboard}
                          brandName={brandInformation?.static?.brand?.name}
                          currentCampaign={currentCampaign}
                          moodboard={currentMoodboard}
                          galleryActions={galleryActions}
                        />
                      )}
                      <div>
                        <div className="mt-8">
                          <MoodboardTagsSelector
                            moodboard={currentMoodboard}
                            onHasChanges={setHasUnsavedTagChanges}
                            onTagsChange={setLocalTags}
                            brandTags={moodboardTags}
                          />
                        </div>
                        {!isCreatingNewMoodboard && currentMoodboard && (
                          <div className="mt-4">
                            <Button
                              onClick={handleGenerateMoodboard}
                              className="w-full"
                              disabled={
                                currentMoodboard.moodboard_generation_status ===
                                  "in_progress" || isMoodboardGenerating
                              }
                            >
                              {currentMoodboard.moodboard_generation_status ===
                                "in_progress" || isMoodboardGenerating ? (
                                <span className="flex items-center gap-2">
                                  <Loader className="animate-spin text-white" />
                                  Generating...
                                </span>
                              ) : (
                                <>
                                  <MoodboardIcon />
                                  Generate Moodboard
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {selectedBrandId &&
                          currentMoodboard &&
                          currentCampaign &&
                          moodboardInformation &&
                          !isCreatingNewMoodboard && (
                            <MoodboardLayout
                              brandId={selectedBrandId}
                              moodboard={currentMoodboard}
                              noOfImagesForMoodboard={noOfImagesForMoodboard}
                              setNoOfImagesForMoodboard={
                                setNoOfImagesForMoodboard
                              }
                              isGenerating={
                                currentMoodboard?.moodboard_generation_status ===
                                  "in_progress" || isMoodboardGenerating
                              }
                              isCreatingNew={isCreatingNewMoodboard}
                              moodboards={moodboardInformation}
                              onNewMoodboard={handleCreateNewMoodboard}
                              selectedMoodboard={currentMoodboard}
                              setSelectedMoodboard={handleMoodboardSelect}
                              handleGenerateMoodboard={handleGenerateMoodboard}
                            />
                          )}
                      </div>
                    </div>
                  }
                  context={undefined}
                />
              )}

              {(isCreatingNewMoodboard || !moodboardInformation) && (
                <div className="mt-4">
                  <Button className="w-full" onClick={handleCreateMoodboard}>
                    Create Moodboard
                  </Button>
                </div>
              )}
              {currentMoodboard && !isCreatingNewMoodboard && (
                <MoodboardTagResults
                  moodboardId={currentMoodboard.id}
                  moodboard_tags={currentMoodboard?.moodboard_tags}
                />
              )}
            </CardContent>
          </div>
        </>
      )}
    </Card>
  );
};
