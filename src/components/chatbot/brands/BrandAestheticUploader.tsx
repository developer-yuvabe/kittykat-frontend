"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardReferenceDropzone } from "../moodboards/MoodboardReferenceDropzone";
import { MoodboardReferenceUploadStatus } from "../moodboards/MoodboardReferenceUploadStatus";
import { MoodboardSocialOptions } from "../moodboards/MoodboardSocialOptions";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { updateBrandSocialMediaField } from "@/services/api/brand.service";
import {
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
} from "@/components/ui/custom-icon";
import { GlobeIcon } from "lucide-react";
import { LimitsState, UploadedImage } from "@/types/moodboard.types";
import { SocialOption, SocialOptionId } from "@/types/campaign.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import { BulkGalleryUploadRequest, GalleryItem } from "@/types/gallery.types";
import { getExtensionFromUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { AnalysisLogDetail } from "@/types/types";
import { getPlatformFromOptionId } from "@/lib/logs.utils";
import { AnalysisStatus } from "@/types/logs.types";
import { BrandAnalysisLogsPopover } from "./BrandAnalysisLogsPopover";
import { BrandSocialVerifyDialog } from "./BrandSocialVerifyDialog";

interface Props {
  brandId: string | null;
  socialMediaData?: {
    instagram?: string;
    pinterest?: string;
    facebook?: string;
    website?: string;
  };
  analysisLogs: AnalysisLogDetail[];
}

export const BrandAestheticUploader: React.FC<Props> = ({
  brandId,
  socialMediaData,
  analysisLogs,
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [socialOptions, setSocialOptions] = useState<SocialOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [limits, setLimits] = useState<LimitsState>({
    pinterest_limit: 10,
    instagram_limit: 10,
    facebook_limit: 10,
    website_limit: 10,
  });

  const { user } = useUserStore();
  const { bulkUpload } = useGalleryQuery({});

  // Fixed categorization and sorting with proper status handling
  const categorizedLogs = useMemo(() => {
    // Sort all logs by creation time (latest first)
    const sortedLogs = [...analysisLogs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Latest first
    });

    // Categorize using proper enum values
    const activeLogs = sortedLogs.filter(
      (log) =>
        log.status === AnalysisStatus.PENDING ||
        log.status === AnalysisStatus.IN_PROGRESS
    );

    const completedLogs = sortedLogs.filter(
      (log) => log.status === AnalysisStatus.COMPLETED
    );

    const failedLogs = sortedLogs.filter(
      (log) => log.status === AnalysisStatus.FAILED
    );

    const cancelledLogs = sortedLogs.filter(
      (log) => log.status === AnalysisStatus.CANCELLED
    );

    return {
      active: activeLogs,
      completed: completedLogs,
      failed: failedLogs,
      cancelled: cancelledLogs,
      all: sortedLogs,
      total: sortedLogs.length,
    };
  }, [analysisLogs]);

  const { refetchAllGalleryQueries } = useGalleryQuery({});

  const completedLength = categorizedLogs.completed.length;
  const failedLength = categorizedLogs.failed.length;

  useEffect(() => {
    refetchAllGalleryQueries();
  }, [completedLength, failedLength]);

  const getSocialMediaUrl = (optionId: string): string => {
    const option = socialOptions.find((opt) => opt.id === optionId);
    return option?.url || "";
  };

  const getResultsLimit = (optionId: string): number => {
    switch (optionId) {
      case SocialOptionId.Instagram:
        return limits.instagram_limit;
      case SocialOptionId.Pinterest:
        return limits.pinterest_limit;
      case SocialOptionId.Facebook:
        return limits.facebook_limit;
      case SocialOptionId.Website:
        return limits.website_limit;
      default:
        return 10;
    }
  };

  const handleBulkUpload = async () => {
    if (!brandId) {
      toast.error("No brand ID provided.");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    const hasUploadedImages = uploadedImages.length > 0;
    const hasSelectedSocialOptions = selectedOptions.length > 0;

    if (!hasUploadedImages && !hasSelectedSocialOptions) {
      toast.error("Please upload images or select social media options.");
      return;
    }

    setIsProcessing(true);

    try {
      // Case 1: Only social media options selected (scrape only)
      if (!hasUploadedImages && hasSelectedSocialOptions) {
        const validationErrors: string[] = [];

        // Validate all selected options first
        const validatedOptions = selectedOptions
          .map((optionId) => {
            const platform = getPlatformFromOptionId(optionId);
            const url = getSocialMediaUrl(optionId);
            const resultsLimit = getResultsLimit(optionId);

            // Validate URL
            if (!url || url.trim() === "") {
              validationErrors.push(`Please provide a URL for ${platform}`);
              return null;
            }

            // Check for invalid/default URLs
            const invalidUrls = [
              "https://",
              "https://instagram.com/",
              "https://www.instagram.com/",
              "https://facebook.com/",
              "https://www.facebook.com/",
              "https://pinterest.com/",
              "https://www.pinterest.com/",
            ];

            if (invalidUrls.includes(url.trim()) || url.trim() === "https://") {
              validationErrors.push(
                `Please provide a valid ${platform} URL (not just the homepage)`
              );
              return null;
            }

            return {
              optionId,
              platform,
              url: url.trim(),
              resultsLimit: resultsLimit || 10,
            };
          })
          .filter(Boolean);

        // If there are validation errors, show them and return
        if (validationErrors.length > 0) {
          toast.error(validationErrors[0]); // Show first error
          setIsProcessing(false);
          return;
        }

        // Process valid options
        const scrapePromises = validatedOptions.map(async (option) => {
          if (!option) return;

          const scrapePayload: BulkGalleryUploadRequest = {
            brand_id: brandId,
            scrape_config: {
              url: option.url,
              platform: option.platform,
              results_limit: option.resultsLimit,
              user_id: user.id, // Ensure user_id is properly set
            },
            scrape_only: true,
            gallery_items: [], // Ensure this is included even if empty
          };

          console.log("Scrape payload:", scrapePayload); // Debug log
          return bulkUpload(scrapePayload);
        });

        await Promise.all(scrapePromises);
        toast.success(
          `Social media scraping initiated for ${validatedOptions.length} platform(s)!`
        );
        return;
      }

      // Case 2: Only uploaded images (manual upload only)
      if (hasUploadedImages && !hasSelectedSocialOptions) {
        const itemsToUpload: GalleryItem[] = uploadedImages.map((img) => ({
          brand_id: brandId!,
          asset_url: img.url,
          asset_title: img.name,
          asset_type: "image",
          asset_source: "manual-upload",
          size: `${img.file.size}`,
          search_keywords: [],
          custom_tags: [],
          related_asset_ids: [],
          prompt_modifiers: [],
          ai_tags: [],
          visual_style_tags: {},
          detected_objects: [],
          detected_emotions: [],
          detected_colors: [],
          media_format: getExtensionFromUrl(img.url),
        }));

        const uploadPayload: BulkGalleryUploadRequest = {
          gallery_items: itemsToUpload,
          brand_id: brandId,
          scrape_only: false,
        };

        await bulkUpload(uploadPayload);
        toast.success(
          `${uploadedImages.length} image(s) uploaded to gallery successfully!`
        );
        return;
      }

      // Case 3: Both uploaded images and social media options selected
      if (hasUploadedImages && hasSelectedSocialOptions) {
        // First upload the manual images
        const itemsToUpload: GalleryItem[] = uploadedImages.map((img) => ({
          brand_id: brandId!,
          asset_url: img.url,
          asset_title: img.name,
          asset_type: "image",
          asset_source: "manual-upload",
          size: `${img.file.size}`,
          search_keywords: [],
          custom_tags: [],
          related_asset_ids: [],
          prompt_modifiers: [],
          ai_tags: [],
          visual_style_tags: {},
          detected_objects: [],
          detected_emotions: [],
          detected_colors: [],
          media_format: getExtensionFromUrl(img.url),
        }));

        const uploadPayload: BulkGalleryUploadRequest = {
          gallery_items: itemsToUpload,
          brand_id: brandId,
          scrape_only: false,
        };

        await bulkUpload(uploadPayload);

        // Then process social media scraping
        const validationErrors: string[] = [];

        // Validate all selected social options
        const validatedSocialOptions = selectedOptions
          .map((optionId) => {
            const platform = getPlatformFromOptionId(optionId);
            const url = getSocialMediaUrl(optionId);
            const resultsLimit = getResultsLimit(optionId);

            // Validate URL
            if (!url || url.trim() === "") {
              validationErrors.push(`Please provide a URL for ${platform}`);
              return null;
            }

            // Check for invalid/default URLs
            const invalidUrls = [
              "https://",
              "https://instagram.com/",
              "https://www.instagram.com/",
              "https://facebook.com/",
              "https://www.facebook.com/",
              "https://pinterest.com/",
              "https://www.pinterest.com/",
            ];

            if (invalidUrls.includes(url.trim()) || url.trim() === "https://") {
              validationErrors.push(
                `Please provide a valid ${platform} URL (not just the homepage)`
              );
              return null;
            }

            return {
              optionId,
              platform,
              url: url.trim(),
              resultsLimit: resultsLimit || 10,
            };
          })
          .filter(Boolean);

        // If there are validation errors, show them and return
        if (validationErrors.length > 0) {
          toast.error(validationErrors[0]); // Show first error
          setIsProcessing(false);
          return;
        }

        const scrapePromises = validatedSocialOptions.map(async (option) => {
          if (!option) return;

          const scrapePayload: BulkGalleryUploadRequest = {
            brand_id: brandId,
            scrape_config: {
              url: option.url,
              platform: option.platform,
              results_limit: option.resultsLimit,
              user_id: user.id,
            },
            scrape_only: true,
            gallery_items: [],
          };

          return bulkUpload(scrapePayload);
        });

        await Promise.all(scrapePromises);

        toast.success(
          `${uploadedImages.length} image(s) uploaded and scraping initiated for ${validatedSocialOptions.length} platform(s)!`
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload/scraping failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setUploadedImages([]);
    }
  };

  useEffect(() => {
    const options: SocialOption[] = [
      {
        id: SocialOptionId.Instagram,
        name: "Use Instagram Images",
        url: socialMediaData?.instagram || "https://instagram.com/",
        icon: <InstagramIcon size={44} />,
        isEditing: false,
        editValue: socialMediaData?.instagram || "https://instagram.com/",
      },
      {
        id: SocialOptionId.Pinterest,
        name: "Use Pinterest Images",
        url: socialMediaData?.pinterest || "https://",
        icon: <PinterestIcon size={44} />,
        isEditing: false,
        editValue: socialMediaData?.pinterest || "https://",
      },
      {
        id: SocialOptionId.Facebook,
        name: "Use Facebook Images",
        url: socialMediaData?.facebook || "https://www.facebook.com/",
        icon: <FacebookIcon size={44} />,
        isEditing: false,
        editValue: socialMediaData?.facebook || "https://www.facebook.com/",
      },
      {
        id: SocialOptionId.Website,
        name: "Use Website Images",
        url: socialMediaData?.website || "https://",
        icon: <GlobeIcon size={44} className="text-blue-600" />,
        isEditing: false,
        editValue: socialMediaData?.website || "https://",
      },
    ];
    setSocialOptions(options);
  }, [socialMediaData]);

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
                "brands",
                file,
                brandId,
                null
              );

              setUploadedImages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
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
    [brandId]
  );

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const updateEditValue = (optionId: SocialOptionId, value: string) => {
    setSocialOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId ? { ...opt, editValue: value } : opt
      )
    );
  };

  const startEditing = (optionId: SocialOptionId) => {
    setSocialOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId ? { ...opt, isEditing: true } : opt
      )
    );
  };

  const cancelEditing = (optionId: SocialOptionId) => {
    setSocialOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? { ...opt, isEditing: false, editValue: opt.url }
          : opt
      )
    );
  };

  const saveEdit = async (optionId: SocialOptionId) => {
    const option = socialOptions.find((opt) => opt.id === optionId);
    if (!option || !brandId) return;

    try {
      await updateBrandSocialMediaField(
        brandId,
        optionId as keyof typeof socialMediaData,
        option.editValue
      );

      setSocialOptions((prev) =>
        prev.map((opt) =>
          opt.id === optionId
            ? { ...opt, url: opt.editValue, isEditing: false }
            : opt
        )
      );
      toast.success("Social media URL updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update social media URL.");
    }
  };

  const getButtonText = () => {
    const hasImages = uploadedImages.length > 0;
    const hasSocial = selectedOptions.length > 0;

    if (isProcessing) {
      if (hasImages && hasSocial) {
        return "Processing Upload & Scraping...";
      } else if (hasImages) {
        return "Uploading to Gallery...";
      } else if (hasSocial) {
        return "Initiating Scraping...";
      }
    }

    if (hasImages && hasSocial) {
      return "Upload Images & Scrape Social Media";
    } else if (hasImages) {
      return "Upload to Gallery";
    } else if (hasSocial) {
      return "Scrape Social Media";
    }
    return "Upload to Gallery";
  };

  return (
    <ContentSection
      title="Upload your Brand Images"
      content={
        <div>
          <p className="text-sm  text-gray-800 mb-4">
            Upload brand images or connect your Instagram and Pinterest accounts
            to teach KittyKat your visual style. Then hit &quot;Upload to
            Gallery&quot; to add everything to your brand library.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="lg:col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandSocialVerifyDialog
                  uploadedImages={uploadedImages}
                  selectedOptions={selectedOptions}
                  socialOptions={socialOptions}
                  isProcessing={isProcessing}
                  handleBulkUpload={handleBulkUpload}
                  getButtonText={getButtonText}
                />

                {/* Enhanced Analysis Logs Popover */}
                <BrandAnalysisLogsPopover categorizedLogs={categorizedLogs} />
              </div>
            </div>
          </div>
        </div>
      }
      context={undefined}
    />
  );
};
