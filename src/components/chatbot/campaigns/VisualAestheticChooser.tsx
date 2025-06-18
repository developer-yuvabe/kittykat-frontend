"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlobeIcon, InfoIcon, Loader, Presentation } from "lucide-react";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import {
  FacebookIcon,
  InstagramIcon,
  PintrestIcon,
} from "@/components/ui/custom-icon";
import {
  addVisualImage,
  analyzeCampaignImages,
  createManualMoodboardForCampaign,
  updateCampaign,
} from "@/services/api/campaign.service";
import { useBrandStore } from "@/store/brand.store";
import {
  SocialOptionId,
  type SocialOption,
  type SourceHandle,
} from "@/types/campaign.types";
import type { ThreadCampaign } from "@/types/types";
import { ManualCampaignDropzone } from "./ManualCampaignDropzone";
import { ManualCampaignUploadStatus } from "./ManualCampaignUploadStatus";
import { SocialLinksEditor } from "./ManualCampaignSocialOptions";
import { ManualCampaigVisualImages } from "./ManualCampaigVisualImages";
import CampaignTagsSelector from "./CampaignTagsSelector";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ContentSection } from "@/components/shared/ContentSection";

import { useGalleryQuery } from "@/hooks/useGallery";
import { useUserStore } from "@/store/user.store";
import { useQueryClient } from "@tanstack/react-query";
import { ImageCountCard } from "@/components/shared/ImageCountCard";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  file: File;
}

interface VisualAestheticChooserProps {
  campaign: ThreadCampaign;

  noOfImagesForMoodboard: number;
  brandId: string;
  socialMediaPlatforms:
    | {
        website: string;
        instagram: string;
        facebook: string;
        tiktok: string;
        pintrest?: string;
      }
    | undefined;

  setNoOfImagesForMoodboard: React.Dispatch<React.SetStateAction<number>>;
}

export type LimitsState = {
  pinterest_limit: number;
  instagram_limit: number;
  facebook_limit: number;
};

const VisualAestheticChooser: React.FC<VisualAestheticChooserProps> = ({
  campaign,
  socialMediaPlatforms,
  noOfImagesForMoodboard,
  setNoOfImagesForMoodboard,
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [socialOptions, setSocialOptions] = useState<SocialOption[]>([]);

  const { selectedBrandId } = useBrandStore();

  const [limits, setLimits] = useState<LimitsState>({
    pinterest_limit: 10,
    instagram_limit: 10,
    facebook_limit: 10,
  });

  const { user } = useUserStore();

  const { galleryItems } = useGalleryQuery({
    creator: user?.id,
    selectedFilters: {
      brands: [selectedBrandId || ""],
      campaigns: [campaign.id],
      product_categories: [],
      asset_types: [],
      asset_sources: [],
      media_format: [],
      aspect_ratio: [],
      workflow_status: [],
    },
  });

  // Helper function to determine if analysis is in progress
  const isAnalysisInProgress = () => {
    return campaign.style_analysis_status === "in_progress";
  };

  // Helper function to get analysis progress
  const getAnalysisProgress = () => {
    if (campaign.style_analysis_status === "completed") return 100;
    if (campaign.style_analysis_status === "failed") return 0;
    return campaign.style_analysis_progress || 0;
  };

  // Initialize social options from props and campaign data
  useEffect(() => {
    const initializeSocialOptions = async () => {
      // Get existing sources from campaign
      const existingSources = campaign.selected_sources || [];

      const existingSourcesMap = existingSources.reduce((acc, source) => {
        acc[source.platform] = source;
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
  }, [campaign, socialMediaPlatforms]);

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

          if (selectedBrandId) {
            await addVisualImage(
              selectedBrandId,
              campaign.id,
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
    [selectedBrandId, campaign.id]
  );

  const toggleOption = async (optionId: string) => {
    if (!selectedBrandId) return;

    const updatedSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId];

    // Update local state
    setSelectedOptions(updatedSelection);

    try {
      // Create updated sources with current edit values and updated selection
      const updatedSources: SourceHandle[] = socialOptions.map((opt) => ({
        platform: opt.id,
        url: opt.url,
        selected: updatedSelection.includes(opt.id),
      }));

      await updateCampaign(selectedBrandId, campaign.id, {
        selected_sources: updatedSources,
      });
    } catch (error) {
      console.error("Failed to update selected source:", error);
      // Optionally revert toggle if needed
    }
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
    if (!option || !selectedBrandId) return;

    try {
      // Update local state
      setSocialOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId
            ? { ...opt, url: opt.editValue, isEditing: false }
            : opt
        )
      );

      // Update campaign with new source handles
      const updatedSources: SourceHandle[] = socialOptions.map((opt) => ({
        platform: opt.id,
        url: opt.id === optionId ? option.editValue : opt.url,
        selected: selectedOptions.includes(opt.id),
      }));

      await updateCampaign(selectedBrandId, campaign.id, {
        selected_sources: updatedSources,
      });
    } catch (error) {
      console.error("Failed to update social handle:", error);
      // Revert changes on error
      cancelEditing(optionId);
    }
  };

  const updateEditValue = (optionId: SocialOptionId, value: string) => {
    setSocialOptions((prev) =>
      prev.map((option) =>
        option.id === optionId ? { ...option, editValue: value } : option
      )
    );
  };

  const startAnalysis = async () => {
    if (!selectedBrandId) return;

    try {
      await updateCampaign(selectedBrandId, campaign.id, {
        selected_sources: socialOptions.map((opt) => ({
          platform: opt.id,
          url: opt.url,
          selected: selectedOptions.includes(opt.id),
        })),
      });
      await analyzeCampaignImages(selectedBrandId, campaign.id, limits);
      // The actual progress updates will come from the campaign prop via event source
    } catch (error) {
      console.error("Failed to start image analysis:", error);
    }
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as any[];
        return key[0] === "gallery-items" && key[4] === user.id;
      },
    });
  }, [selectedBrandId, campaign.visual_images]); // Add other fields you care about

  const getAnalysisStatusMessage = () => {
    switch (campaign.style_analysis_status) {
      case "not_started":
        return "Ready to analyze your style";
      case "in_progress":
        return "Analyzing your style...";
      case "completed":
        return "Analysis Complete!";
      case "failed":
        return "Analysis failed - please try again";
      case "partially_completed":
        return "Analysis partially completed";
      default:
        return "Ready to analyze your style";
    }
  };

  const shouldShowAnalysisStatus = () => {
    return (
      campaign.style_analysis_status !== "not_started" &&
      campaign.style_analysis_status !== undefined
    );
  };

  const renderAnalysisStatus = () => {
    if (!shouldShowAnalysisStatus()) return null;

    const progress = getAnalysisProgress();
    const statusMessage = getAnalysisStatusMessage();

    return (
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-800">{statusMessage}</h3>
            {campaign.style_analysis_progress_messages &&
              campaign.style_analysis_progress_messages.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                    >
                      <InfoIcon className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">View analysis details</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Analysis Progress</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-600">
                        {campaign.style_analysis_progress_messages.map(
                          (message, index) => (
                            <p key={index}>{message}</p>
                          )
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
          </div>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2 transition-all duration-300"
        />
      </div>
    );
  };

  async function handleGenerateMoodboard(): Promise<void> {
    if (selectedBrandId) {
      await createManualMoodboardForCampaign(selectedBrandId, campaign.id, {
        no_of_images: noOfImagesForMoodboard,
      });
    }
  }

  return (
    <ContentSection
      title={`Choose your Visual Aesthetic`}
      content={
        <div>
          {(!campaign?.tags || Object.keys(campaign.tags).length === 0) &&
            campaign.style_analysis_status !== "completed" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - File Upload */}

                <div className="space-y-4">
                  {/* Upload Area */}

                  <ManualCampaignDropzone onDrop={onDrop} />

                  <ManualCampaignUploadStatus
                    isUploading={isUploading}
                    uploadError={uploadError}
                  />
                </div>

                {/* Right Column - Social Options */}
                <SocialLinksEditor
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

          <ManualCampaigVisualImages
            images={(galleryItems || []).map((item) => {
              // Find the corresponding visual image by id
              const visualImage = campaign.visual_images.find(
                (img) => img.id === item.id
              );

              console.log("here", visualImage);
              return {
                id: item.id,
                filename: item.asset_title ?? "Untitled",
                url: item.asset_url,
                source: item.asset_source,
                is_liked: visualImage?.is_liked ?? false,
                ignored: visualImage?.ignored ?? false,
              };
            })}
          />

          {/* Analysis Status with Progress Bar */}
          {renderAnalysisStatus()}

          {/* Tags Selector */}
          {campaign?.tags && Object.keys(campaign.tags).length > 0 && (
            <div className="mt-8">
              <CampaignTagsSelector campaign={campaign} />
            </div>
          )}

          {/* Footer Button */}
          {(!campaign?.tags || Object.keys(campaign.tags).length === 0) &&
          campaign.style_analysis_status !== "completed" ? (
            <div className="mt-8">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300"
                disabled={
                  (uploadedImages.length === 0 &&
                    selectedOptions.length === 0) ||
                  isAnalysisInProgress()
                }
                onClick={startAnalysis}
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
          ) : (
            campaign.style_analysis_status === "completed" && (
              <div className="mt-8 flex flex-row gap-x-2 items-center">
                <div className="flex-[9]">
                  <Button
                    onClick={handleGenerateMoodboard}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-300"
                    disabled={
                      campaign.manual_moodboard_generation_status ===
                      "in_progress"
                    }
                  >
                    {campaign.manual_moodboard_generation_status ===
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
                    onRefresh={() => handleGenerateMoodboard()}
                    onChange={setNoOfImagesForMoodboard}
                    hideRefresh
                    maxCount={campaign.visual_images.length}
                  />
                </div>
              </div>
            )
          )}
        </div>
      }
      context={undefined}
    />
  );
};

export default VisualAestheticChooser;
