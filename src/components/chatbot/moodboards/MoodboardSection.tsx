import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  CirclePlus,
  GlobeIcon,
  Loader,
  Presentation,
} from "lucide-react";
import { MoodboardInformation, ThreadDetails } from "@/types/types";

import { motion } from "framer-motion";
import { useBrandStore } from "@/store/brand.store";
import { useUserStore } from "@/store/user.store";
import { InlineEditableField } from "@/components/shared/InlineEditableField";
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
  addImageToMoodboard,
  analyzeMoodboardImages,
  createMoodboard,
  createMoodboardForCampaign,
} from "@/services/api/moodboard.service";
import { MoodboardStyleAnalysisStatus } from "./MoodboardStyleAnalysisStatus";
import MoodboardTagsSelector from "./MoodboardTagsSelector";
import { MoodboardVisualImages } from "./MoodboardVisualImages";
import { useGalleryQuery } from "@/hooks/useGallery";
import MoodboardLayout from "./MoodboardLayout";
import { ImageCountCard } from "@/components/shared/ImageCountCard";
import MoodboardTagResults from "./MoodboardTagResults";
import { LimitsState, UploadedImage } from "@/types/moodboard.types";
import { MoodboardReferenceDropzone } from "./MoodboardReferenceDropzone";
import { MoodboardReferenceUploadStatus } from "./MoodboardReferenceUploadStatus";
import { MoodboardSocialOptions } from "./MoodboardSocialOptions";

export const MoodboardSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandInformation: ThreadDetails["brand_information"];
  selectedCampaignIndex: number;
  setSelectedCampaignIndex: React.Dispatch<React.SetStateAction<number>>;
  moodboardInformation: ThreadDetails["moodboard_information"];
}> = ({
  campaignInformation,
  brandInformation,
  selectedCampaignIndex,
  setSelectedCampaignIndex,
  moodboardInformation,
}) => {
  const { selectedBrandId } = useBrandStore();
  const { user } = useUserStore();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

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

  const [currentMoodboard, setCurrentMoodboard] =
    useState<MoodboardInformation | null>(null);

  useEffect(() => {
    if (currentCampaignMoodboards.length > 0) {
      const latestMoodboard =
        currentCampaignMoodboards[currentCampaignMoodboards.length - 1];
      setCurrentMoodboard(latestMoodboard);
    } else {
      setCurrentMoodboard(null);
    }
  }, [currentCampaign?.id, currentCampaign]);

  // All other state hooks
  const [expanded, setExpanded] = useState(true);

  const [noOfImagesForMoodboard, setNoOfImagesForMoodboard] =
    useState<number>(10);

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
      const selectedIds = existingSources
        .filter((source) => source.selected)
        .map((source) => source.platform);
      setSelectedOptions(selectedIds);
    };

    initializeSocialOptions();
  }, [currentCampaign, socialMediaPlatforms]);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setUploadError(null);

      try {
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

          if (selectedBrandId && currentCampaign && currentMoodboard) {
            await addImageToMoodboard(
              selectedBrandId,
              currentCampaign?.id,
              currentMoodboard?.id,
              uploadedImagePayload
            );
          }

          return downloadUrl;
        });

        await Promise.all(uploadPromises);
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

    // ✅ Don't send API call anymore
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
    if (currentCampaign?.campaign?.title) {
      setMoodboardTitle(
        `${currentCampaign.campaign.title}'s Moodboard v${
          (moodboardInformation?.length ?? 0) + 1
        }`
      );
    }
  }, [currentCampaign?.campaign?.title, moodboardInformation]);

  async function handleFindStyle() {
    if (!selectedBrandId || !currentCampaign?.id) return;

    // Construct visual_sources from selected social options
    const visualSources: SourceHandle[] = socialOptions
      .filter((opt) => selectedOptions.includes(opt.id))
      .map((opt) => ({
        platform: opt.id,
        url: opt.editValue || opt.url,
        selected: true,
      }));

    try {
      const newMoodboard = await createMoodboard(
        selectedBrandId,
        currentCampaign.id,
        {
          campaign_id: currentCampaign.id,
          title: moodboardTitle,
          visual_sources: visualSources,
        }
      );

      await analyzeMoodboardImages(
        selectedBrandId,
        currentCampaign.id,
        newMoodboard.id,
        limits
      );

      // Optional: handle success feedback here
    } catch (error) {
      console.error("Failed to create moodboard:", error);
      // Optional: show error UI
    }
  }

  const isAnalysisInProgress = () => {
    return currentMoodboard?.style_analysis_status === "in_progress";
  };

  const { galleryItems } = useGalleryQuery({
    creator: user?.id,
    selectedFilters: {
      brands: selectedBrandId ? [selectedBrandId] : [],
      campaigns: currentCampaign?.id ? [currentCampaign.id] : [],
      moodboards: currentMoodboard?.id ? [currentMoodboard.id] : [],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  console.log("aeq", galleryItems);

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
              <div className="">
                <InlineEditableField
                  key={currentMoodboard?.id ?? "new-moodboard"}
                  label="Moodboard"
                  value={currentMoodboard?.title ?? moodboardTitle}
                  onSave={async (_newValue: string) => {
                    if (currentMoodboard) {
                      // Update existing moodboard title
                      console.log("Update existing moodboard:", _newValue);
                    } else {
                      // Update local state for new moodboard
                      setMoodboardTitle(_newValue);
                    }
                  }}
                  textClassName="font-bold"
                  showLabel={true}
                  isTextarea={false}
                />
              </div>
            )}
          </div>
          {expanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              {/* {campaignInformation && (
                <MoodboardSelector
                  campaigns={moodboardInformation}
                  selectedCampaignIndex={selectedCampaignIndex}
                  setSelectedCampaignIndex={handleCampaignIndexChange}
                />
              )} */}

              <Button
                size="lg"
                className="p-4"
                variant="ghost"
                onClick={() => {}}
              >
                <CirclePlus className="size-5" />
              </Button>
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
                  {currentMoodboard && (
                    <div className="mt-6">
                      <MoodboardVisualImages
                        images={(galleryItems || []).map((item) => {
                          // Find the corresponding visual image by id
                          const visualImage =
                            currentMoodboard.visual_style_images.find(
                              (img) => img.gallery_item_id === item.id
                            );

                          console.log("here", visualImage);
                          return {
                            id: item.id,
                            filename: item.asset_title ?? "Untitled",
                            url: item.asset_url,
                            source: item.asset_source,
                            is_liked: visualImage?.is_liked ?? false,
                            ignored: visualImage?.to_ignore ?? false,
                          };
                        })}
                      />
                    </div>
                  )}

                  <div>
                    {selectedBrandId &&
                      currentMoodboard?.style_analysis_status !== "completed" &&
                      currentMoodboard?.style_analysis_status !==
                        "in_progress" && (
                        <div className="grid grid-cols-1 bg-white lg:grid-cols-2 gap-6">
                          {/* Left Column - File Upload */}
                          <div className="space-y-4">
                            <MoodboardReferenceDropzone onDrop={onDrop} />
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
                    <MoodboardStyleAnalysisStatus
                      progress={currentMoodboard?.style_analysis_progress}
                      status={currentMoodboard?.style_analysis_status}
                      progressMessages={
                        currentMoodboard?.style_analysis_progress_messages
                      }
                    />
                    {currentMoodboard?.aggregated_tags &&
                      Object.keys(currentMoodboard?.aggregated_tags).length >
                        0 && (
                        <div className="mt-8">
                          <MoodboardTagsSelector moodboard={currentMoodboard} />

                          <div className="mt-8 flex mb-5 flex-row gap-x-2 items-center">
                            <div className="flex-[9]">
                              <Button
                                onClick={async () => {
                                  if (selectedBrandId) {
                                    await createMoodboardForCampaign(
                                      selectedBrandId,
                                      currentMoodboard?.campaign_id,
                                      currentMoodboard.id,
                                      { no_of_images: noOfImagesForMoodboard }
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
                                    await createMoodboardForCampaign(
                                      selectedBrandId,
                                      currentMoodboard?.campaign_id,
                                      currentMoodboard.id,
                                      {
                                        no_of_images:
                                          noOfImagesForMoodboard + 1,
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
                                  currentMoodboard.visual_style_images.length
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {selectedBrandId && currentMoodboard && currentCampaign && (
                      <MoodboardLayout
                        brandId={selectedBrandId}
                        moodboard={currentMoodboard}
                        noOfImagesForMoodboard={noOfImagesForMoodboard}
                        setNoOfImagesForMoodboard={setNoOfImagesForMoodboard}
                        isGenerating={
                          currentMoodboard?.moodboard_generation_status ===
                          "in_progress"
                        }
                      />
                    )}
                  </div>
                  {(!currentMoodboard || currentCampaign) &&
                    currentMoodboard?.style_analysis_status !== "completed" &&
                    currentMoodboard?.style_analysis_status !==
                      "in_progress" && (
                      <div className="mt-2">
                        <Button
                          className="w-full"
                          onClick={handleFindStyle}
                          disabled={
                            (uploadedImages.length === 0 &&
                              selectedOptions.length === 0) ||
                            isAnalysisInProgress()
                          }
                        >
                          {isAnalysisInProgress() ? (
                            <span className="flex items-center gap-2">
                              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                              Analyzing...
                            </span>
                          ) : (
                            "Find your style!"
                          )}
                        </Button>
                      </div>
                    )}
                </div>
              }
              context={undefined}
            />
            <MoodboardTagResults
              moodboard_tags={currentMoodboard?.moodboard_tags}
            />
          </CardContent>
        </div>
      )}
    </Card>
  );
};
