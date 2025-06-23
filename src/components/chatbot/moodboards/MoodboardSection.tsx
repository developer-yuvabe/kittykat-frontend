import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  CirclePlus,
  GlobeIcon,
  Loader,
  Presentation,
  X,
} from "lucide-react";
import { MoodboardInformation, ThreadDetails } from "@/types/types";
import { toast } from "sonner";

import { motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  SocialOption,
  SocialOptionId,
  SourceHandle,
} from "@/types/campaign.types";
import {
  FacebookIcon,
  InstagramIcon,
  PintrestIcon,
} from "@/components/ui/custom-icon";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardOverview } from "./MoodboardOverview";
import {
  addGalleryItemToMoodboard,
  analyzeMoodboardImages,
  createMoodboard,
  createMoodboardForCampaign,
} from "@/services/api/moodboard.service";
import { MoodboardStyleAnalysisStatus } from "./MoodboardStyleAnalysisStatus";
import MoodboardTagsSelector from "./MoodboardTagsSelector";
import { useGalleryQuery } from "@/hooks/useGallery";
import MoodboardLayout from "./MoodboardLayout";
import { ImageCountCard } from "@/components/shared/ImageCountCard";
import MoodboardTagResults from "./MoodboardTagResults";
import { LimitsState, UploadedImage } from "@/types/moodboard.types";
import { MoodboardReferenceDropzone } from "./MoodboardReferenceDropzone";
import { MoodboardReferenceUploadStatus } from "./MoodboardReferenceUploadStatus";
import { MoodboardSocialOptions } from "./MoodboardSocialOptions";
import { GalleryItem } from "@/types/gallery.types";
import { MoodboardFindStyleDialog } from "./MoodboardFindStyleDialog";
import MoodboardSelector from "./MoodboardSelector";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { MoodboardVisualSectionHeader } from "./MoodboardVisualSectionHeader";

export const MoodboardSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  setSelectedCampaignIndex: React.Dispatch<React.SetStateAction<number>>;
  moodboardInformation: ThreadDetails["moodboard_information"];
  selectedCampaignIndex: number;
}> = ({
  campaignInformation,
  brandInformation,
  selectedCampaignIndex,
  moodboardInformation,
}) => {
  const { selectedBrandId } = useBrandStore();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isCreatingNewMoodboard, setIsCreatingNewMoodboard] = useState(false);
  const [selectedMoodboardId, setSelectedMoodboardId] = useState<string | null>(
    null
  );

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

  const socialMediaPlatforms = brandInformation?.static?.social_media;

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
    setUploadedImages([]);
    setSelectedOptions([]);
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

  // Sync selected moodboard ID when currentMoodboard changes (e.g., after creation)
  useEffect(() => {
    if (currentMoodboard && currentMoodboard.id !== selectedMoodboardId) {
      setSelectedMoodboardId(currentMoodboard.id);
    }
  }, [currentMoodboard?.id, selectedMoodboardId]);

  // All other state hooks
  const [expanded, setExpanded] = useState(true);

  const [noOfImagesForMoodboard, setNoOfImagesForMoodboard] =
    useState<number>(0);

  useEffect(() => {
    const imageCount = currentMoodboard?.visual_style_images?.length ?? 0;
    setNoOfImagesForMoodboard(Math.min(16, imageCount));
  }, [currentMoodboard?.id]);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  const [socialOptions, setSocialOptions] = useState<SocialOption[]>([]);

  const [limits, setLimits] = useState<LimitsState>({
    pinterest_limit: 10,
    instagram_limit: 10,
    facebook_limit: 10,
  });

  useEffect(() => {
    const initializeSocialOptions = async () => {
      // Get existing sources from campaign
      const existingSources = currentMoodboard?.visual_sources || [];

      const existingSourcesMap = existingSources.reduce((acc, source) => {
        acc[source.platform] = { ...source, url: source.url ?? undefined };
        return acc;
      }, {} as Record<string, SourceHandle>);

      const options: SocialOption[] = [
        {
          id: SocialOptionId.Facebook,
          name: "Use Facebook Images",
          url:
            existingSourcesMap.facebook?.url ||
            socialMediaPlatforms?.facebook ||
            "https://www.facebook.com/",
          icon: <FacebookIcon size={44} />,
          isEditing: false,
          editValue:
            existingSourcesMap.facebook?.url ||
            socialMediaPlatforms?.facebook ||
            "https://www.facebook.com/",
        },
        {
          id: SocialOptionId.Instagram,
          name: "Use Instagram Images",
          url:
            existingSourcesMap.instagram?.url ||
            socialMediaPlatforms?.instagram ||
            "https://instagram.com/",
          icon: <InstagramIcon size={44} />,
          isEditing: false,
          editValue:
            existingSourcesMap.instagram?.url ||
            socialMediaPlatforms?.instagram ||
            "https://instagram.com/",
        },
        {
          id: SocialOptionId.Website,
          name: "Use Website Images",
          url:
            existingSourcesMap.website?.url ||
            socialMediaPlatforms?.website ||
            "https://",
          icon: <GlobeIcon size={44} className="text-blue-600" />,
          isEditing: false,
          editValue:
            existingSourcesMap.website?.url ||
            socialMediaPlatforms?.website ||
            "https://",
        },
      ];

      options.push({
        id: SocialOptionId.Pintrest,
        name: "Use Pinterest Images",
        url:
          existingSourcesMap.pintrest?.url ||
          socialMediaPlatforms?.pintrest ||
          "https://",
        icon: <PintrestIcon size={44} />,
        isEditing: false,
        editValue:
          existingSourcesMap.pintrest?.url ||
          socialMediaPlatforms?.pintrest ||
          "https://",
      });

      setSocialOptions(options);

      // Set selected options based on existing sources
      if (!isCreatingNewMoodboard) {
        const selectedIds = existingSources
          .filter((source) => source.selected)
          .map((source) => source.platform);
        setSelectedOptions(selectedIds);
      }
    };

    initializeSocialOptions();
  }, [
    currentCampaign,
    socialMediaPlatforms,
    currentMoodboard,
    isCreatingNewMoodboard,
  ]);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCreatingNewMoodboard) {
      setUploadedImages([]);
    }
  }, [currentMoodboard?.id, isCreatingNewMoodboard]);

  const { addToGallery, galleryItems } = useGalleryQuery(
    {
      selectedFilters: {
        campaigns: currentCampaign?.id ? [currentCampaign.id] : [],
        moodboards: currentMoodboard?.id ? [currentMoodboard.id] : [],
        brands: selectedBrandId ? [selectedBrandId] : [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    200
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentMoodboard?.visual_style_images) {
      queryClient.invalidateQueries({
        queryKey: [
          "gallery-items",
          /* the rest of your dynamic parts, if necessary */
        ],
      });
    }
  }, [currentMoodboard?.visual_style_images?.length]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setUploadError(null);

      try {
        toast.promise(
          (async () => {
            const uploadPromises = acceptedFiles.map(async (file) => {
              const downloadUrl = await uploadFileAndReturnUrl(
                file.name,
                file.type,
                "threads",
                file
              );

              const uploadedImagePayload = {
                id: crypto.randomUUID(),
                filename: file.name,
                url: downloadUrl,
                source: "upload",
              };

              // Add to state
              setUploadedImages((prev) => [
                ...prev,
                {
                  id: uploadedImagePayload.id,
                  url: downloadUrl,
                  name: file.name,
                  file,
                },
              ]);

              return downloadUrl;
            });

            await Promise.all(uploadPromises);
          })(),
          {
            loading: `Uploading ${acceptedFiles.length} file(s)...`,
            success: `Successfully uploaded ${acceptedFiles.length} file(s)!`,
            error: "Failed to upload files. Please try again.",
          }
        );
      } catch (error) {
        setUploadError("Some files failed to upload. Please try again.");
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedBrandId, currentCampaign?.id]
  );

  const toggleOption = (optionId: string) => {
    const updatedSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId];

    setSelectedOptions(updatedSelection);
  };

  const startEditing = (optionId: SocialOptionId) => {
    setSocialOptions((prev) =>
      prev.map((option) =>
        option.id === optionId ? { ...option, isEditing: true } : option
      )
    );
  };

  const cancelEditing = (optionId: SocialOptionId) => {
    setSocialOptions((prev) =>
      prev.map((option) =>
        option.id === optionId
          ? { ...option, isEditing: false, editValue: option.url }
          : option
      )
    );
  };

  const saveEdit = async (optionId: SocialOptionId) => {
    const option = socialOptions.find((opt) => opt.id === optionId);
    if (!option) return;

    // Update local state
    setSocialOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? { ...opt, url: opt.editValue, isEditing: false }
          : opt
      )
    );

    toast.success("Social media URL updated successfully!");
  };

  const updateEditValue = (optionId: SocialOptionId, value: string) => {
    setSocialOptions((prev) =>
      prev.map((option) =>
        option.id === optionId ? { ...option, editValue: value } : option
      )
    );
  };

  const [moodboardTitle, setMoodboardTitle] = useState("");

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
    }
  }, [
    currentCampaign?.campaign?.title,
    isCreatingNewMoodboard,
    currentCampaignMoodboards.length,
    currentMoodboard?.title, // Add this dependency to react to title changes
  ]);

  async function handleFindStyle() {
    if (!selectedBrandId || !currentCampaign?.id) {
      toast.error("Missing brand or campaign information");
      return;
    }

    const visualSources: SourceHandle[] = socialOptions
      .filter((opt) => selectedOptions.includes(opt.id))
      .map((opt) => ({
        platform: opt.id,
        url: opt.editValue || opt.url,
        selected: true,
      }));

    try {
      await toast.promise(
        (async () => {
          // Step 1: Create the new moodboard
          const newMoodboard = await createMoodboard(
            selectedBrandId,
            currentCampaign.id,
            {
              campaign_id: currentCampaign.id,
              title: moodboardTitle,
              visual_sources: visualSources,
            }
          );

          // Step 2: Upload selected images to gallery and add to moodboard
          const uploadPromises = uploadedImages.map(async (file) => {
            const galleryItem: GalleryItem = {
              brand_id: selectedBrandId,
              campaign_id: currentCampaign.id,
              moodboard_id: newMoodboard.id,
              asset_title: file.name,
              asset_url: file.url,
              asset_type: "image",
              asset_source: "upload",
              size: "unknown",
              media_format: "jpg",
              related_asset_ids: [],
              prompt_modifiers: [],
              ai_tags: [],
              visual_style_tags: [],
              detected_objects: [],
              detected_emotions: [],
              detected_colors: [],
              intent_tags: [],
              search_keywords: [],
              custom_tags: [],
            };

            const galleryResponse = await addToGallery(galleryItem);

            await addGalleryItemToMoodboard(selectedBrandId, newMoodboard?.id, {
              gallery_item_id: galleryResponse.id,
            });
          });

          await Promise.all(uploadPromises);

          setUploadedImages([]);
          setIsCreatingNewMoodboard(false);
          setSelectedMoodboardId(newMoodboard.id);

          // Step 3: Analyze the newly created moodboard
          await analyzeMoodboardImages(
            selectedBrandId,
            currentCampaign.id,
            newMoodboard.id,
            limits
          );
        })(),
        {
          loading: "Creating moodboard and analyzing images...",
          success:
            "Moodboard created successfully! Style analysis in progress.",
          error: "Failed to create moodboard. Please try again.",
        }
      );
    } catch (error) {
      console.error("Failed to create moodboard and upload images:", error);
    }
  }

  const isAnalysisInProgress = () => {
    return currentMoodboard?.style_analysis_status === "in_progress";
  };

  const shouldShowCreationInterface = () => {
    return (
      isCreatingNewMoodboard ||
      (!currentMoodboard && currentCampaignMoodboards.length === 0)
    );
  };

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
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <Presentation size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Moodboards</div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your Campaign Moodboards
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Moodboard
                </label>

                {isCreatingNewMoodboard ? (
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
            )}
          </div>
          {expanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              {campaignInformation &&
                currentCampaign &&
                moodboardInformation && (
                  <MoodboardSelector
                    campaignId={currentCampaign?.id}
                    moodboards={moodboardInformation}
                    selectedMoodboard={currentMoodboard}
                    setSelectedMoodboard={handleMoodboardSelect}
                    onNewMoodboard={handleCreateNewMoodboard}
                    isCreatingNew={isCreatingNewMoodboard}
                  />
                )}

              {isCreatingNewMoodboard ? (
                <TooltipIconButton
                  tooltip="Cancel"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelNewMoodboard();
                  }}
                >
                  <X className=" text-red-600" />
                </TooltipIconButton>
              ) : (
                <TooltipIconButton
                  tooltip="Create new moodboard"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewMoodboard();
                  }}
                  className="mt-2"
                >
                  <CirclePlus />
                </TooltipIconButton>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {expanded && (
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

            <ContentSection
              title={`Choose your visual aesthetic `}
              content={
                <div>
                  {currentCampaign && currentMoodboard && (
                    <MoodboardVisualSectionHeader
                      currentMoodboard={currentMoodboard}
                      isCreatingNewMoodboard={isCreatingNewMoodboard}
                      galleryItems={galleryItems || []}
                      brandName={brandInformation?.static?.brand?.name}
                      currentCampaign={currentCampaign}
                      moodboard={currentMoodboard}
                    />
                  )}

                  <div>
                    {selectedBrandId && shouldShowCreationInterface() && (
                      <div className="grid grid-cols-1 bg-white lg:grid-cols-2 gap-6">
                        {/* Left Column - File Upload */}
                        <div className="space-y-4">
                          <MoodboardReferenceDropzone
                            onDrop={onDrop}
                            uploadedImages={uploadedImages}
                          />
                          <MoodboardReferenceUploadStatus
                            isUploading={isUploading}
                            uploadError={uploadError}
                          />
                        </div>

                        {/* Right Column - Social Options */}
                        <MoodboardSocialOptions
                          socialOptions={socialOptions}
                          selectedOptions={selectedOptions}
                          updateEditValue={updateEditValue}
                          saveEdit={saveEdit}
                          cancelEditing={cancelEditing}
                          startEditing={startEditing}
                          toggleOption={toggleOption}
                          limits={limits}
                          setLimits={setLimits}
                        />
                      </div>
                    )}

                    {currentMoodboard && !isCreatingNewMoodboard && (
                      <MoodboardStyleAnalysisStatus
                        progress={currentMoodboard?.style_analysis_progress}
                        status={currentMoodboard?.style_analysis_status}
                        progressMessages={
                          currentMoodboard?.style_analysis_progress_messages
                        }
                        retryAnalysis={handleFindStyle}
                      />
                    )}

                    {currentMoodboard?.aggregated_tags &&
                      Object.keys(currentMoodboard?.aggregated_tags).length >
                        0 &&
                      !isCreatingNewMoodboard && (
                        <div className="mt-8">
                          <MoodboardTagsSelector moodboard={currentMoodboard} />

                          <div className="mt-8 flex mb-5 flex-row gap-x-2 items-center">
                            <div className="flex-[9]">
                              <Button
                                onClick={async () => {
                                  if (selectedBrandId) {
                                    toast.promise(
                                      createMoodboardForCampaign(
                                        selectedBrandId,
                                        currentMoodboard?.campaign_id,
                                        currentMoodboard.id,
                                        { no_of_images: noOfImagesForMoodboard }
                                      ),
                                      {
                                        loading: "Generating moodboard...",
                                        success:
                                          "Moodboard generated successfully!",
                                        error:
                                          "Failed to generate moodboard. Please try again.",
                                      }
                                    );
                                  }
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300"
                                disabled={
                                  currentMoodboard.moodboard_generation_status ===
                                  "in_progress"
                                }
                              >
                                {currentMoodboard.moodboard_generation_status ===
                                "in_progress" ? (
                                  <span className="flex items-center gap-2">
                                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                    Generating...
                                  </span>
                                ) : (
                                  <>
                                    <Presentation size={28} className="mr-2" />
                                    Generate Moodboard
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="flex-[1]">
                              <ImageCountCard
                                imageCount={noOfImagesForMoodboard}
                                onRefresh={async () => {
                                  if (selectedBrandId) {
                                    toast.promise(
                                      createMoodboardForCampaign(
                                        selectedBrandId,
                                        currentMoodboard?.campaign_id,
                                        currentMoodboard.id,
                                        {
                                          no_of_images:
                                            noOfImagesForMoodboard + 1,
                                        }
                                      ),
                                      {
                                        loading: "Adding more images...",
                                        success: "Additional images generated!",
                                        error:
                                          "Failed to generate additional images.",
                                      }
                                    );
                                    setNoOfImagesForMoodboard(
                                      noOfImagesForMoodboard + 1
                                    );
                                  }
                                }}
                                onChange={setNoOfImagesForMoodboard}
                                hideRefresh
                                maxCount={
                                  currentMoodboard.visual_style_images.length >
                                  16
                                    ? 16
                                    : currentMoodboard.visual_style_images
                                        .length
                                }
                              />
                            </div>
                          </div>
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
                          setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                          isGenerating={
                            currentMoodboard?.moodboard_generation_status ===
                            "in_progress"
                          }
                          isCreatingNew={isCreatingNewMoodboard}
                          moodboards={moodboardInformation}
                          onNewMoodboard={handleCreateNewMoodboard}
                          selectedMoodboard={currentMoodboard}
                          setSelectedMoodboard={handleMoodboardSelect}
                        />
                      )}
                  </div>
                  <MoodboardFindStyleDialog
                    currentMoodboard={currentMoodboard}
                    currentCampaign={currentCampaign}
                    uploadedImages={uploadedImages}
                    selectedOptions={selectedOptions}
                    socialOptions={socialOptions}
                    isAnalysisInProgress={isAnalysisInProgress}
                    handleFindStyle={handleFindStyle}
                  />
                </div>
              }
              context={undefined}
            />
            {currentMoodboard && !isCreatingNewMoodboard && (
              <MoodboardTagResults
                moodboard_tags={currentMoodboard?.moodboard_tags}
              />
            )}
          </CardContent>
        </div>
      )}
    </Card>
  );
};
