"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { ContentSection } from "@/components/shared/ContentSection";
import { MoodboardReferenceDropzone } from "../moodboards/MoodboardReferenceDropzone";
import { MoodboardSocialOptions } from "../moodboards/MoodboardSocialOptions";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { updateBrandSocialMediaField } from "@/services/api/brand.service";
import {
  InstagramIcon,
  PinterestIcon,
} from "@/components/ui/custom-icon";
import { GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LimitsState, UploadedImage } from "@/types/moodboard.types";
import { SocialOption, SocialOptionId } from "@/types/campaign.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import {
  BulkGalleryUploadRequest,
  BulkScrapeRequest,
  GalleryItem,
} from "@/types/gallery.types";
import { getExtensionFromUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { AnalysisLogDetail } from "@/types/types";
import { getPlatformFromOptionId, getDateTimestamp } from "@/lib/logs.utils";
import { AnalysisStatus } from "@/types/logs.types";
import { BrandAnalysisLogsPopover } from "./BrandAnalysisLogsPopover";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";

interface Props {
  brandId: string | null;
  socialMediaData?: {
    instagram?: string;
    pinterest?: string;
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
  const [isScraping, setIsScraping] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<LimitsState>({
    pinterest_limit: 10,
    instagram_limit: 10,
    website_limit: 10,
  });

  const { user } = useUserStore();
  const { bulkUpload, scrapeHandles } = useGalleryQuery({});

  // Fixed categorization and sorting with proper status handling
  const categorizedLogs = useMemo(() => {
    // Sort all logs by creation time (latest first)
    const sortedLogs = [...analysisLogs].sort((a, b) => {
      const dateA = getDateTimestamp(a.created_at);
      const dateB = getDateTimestamp(b.created_at);
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

  const { refetchAllAutoFillQueries } = useMoodboardQuery({});

  const completedLength = categorizedLogs.completed.length;
  const failedLength = categorizedLogs.failed.length;

  useEffect(() => {
    refetchAllGalleryQueries();
    refetchAllAutoFillQueries();
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
      case SocialOptionId.Website:
        return limits.website_limit;
      default:
        return 10;
    }
  };

  const handleScrapeSelected = async () => {
    if (!brandId) {
      toast.error("No brand ID provided.");
      return;
    }

    if (!user?.id) {
      toast.error("User not authenticated.");
      return;
    }

    if (selectedOptions.length === 0) {
      toast.error("Please select at least one social media option.");
      return;
    }

    setIsScraping({ scraping: true });

    try {
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
            "https://pinterest.com/",
            "https://www.pinterest.com/",
          ];

          if (invalidUrls.includes(url.trim())) {
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
        setIsScraping({});
        return;
      }

      // Process valid options
      const scrapePromises = validatedOptions.map(async (option) => {
        if (!option) return;

        // Use common payload structure for all platforms (Instagram, Pinterest, Website)
        const scrapePayload: BulkScrapeRequest = {
          brand_id: brandId,
          scrape_config: {
            url: option.url,
            platform: option.platform,
            results_limit: option.resultsLimit,
            user_id: user.id,
          },
        };
        
        return scrapeHandles(scrapePayload);
      });

      await Promise.all(scrapePromises);
      toast.success(
        `Social media scraping initiated for ${validatedOptions.length} platform(s)!`
      );
    } catch (error) {
      console.error(error);
      toast.error("Scraping failed. Please try again.");
    } finally {
      setIsScraping({});
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
      if (!brandId) {
        toast.error("No brand ID provided.");
        return;
      }

      if (!user?.id) {
        toast.error("User not authenticated.");
        return;
      }

      // Step 1: IMMEDIATELY show thumbnails using local File URLs
      const tempImages: UploadedImage[] = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file), // Create temporary local URL for immediate display
        name: file.name,
        file,
      }));
      
      setUploadedImages((prev) => [...prev, ...tempImages]);
      setIsUploading(true);
      setUploadError(null);

      try {
        // Step 2: Upload files to GCS and get URLs with progress indication
        const uploadedFiles: UploadedImage[] = [];
        const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`);
        
        const uploadPromises = acceptedFiles.map(async (file, index) => {
          try {
            const downloadUrl = await uploadFileAndReturnUrl(
              file.name,
              file.type,
              "brands",
              file,
              brandId,
              null
            );

            const uploadedImage = {
              id: tempImages[index].id,
              url: downloadUrl,
              name: file.name,
              file,
            };
            uploadedFiles.push(uploadedImage);
            
            setUploadedImages((prev) => 
              prev.map((img) => 
                img.id === tempImages[index].id ? uploadedImage : img
              )
            );
            
            URL.revokeObjectURL(tempImages[index].url);
            return downloadUrl;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            URL.revokeObjectURL(tempImages[index].url);
            return null;
          }
        });
        
        await Promise.allSettled(uploadPromises);
        
        const failedCount = acceptedFiles.length - uploadedFiles.length;
        if (failedCount > 0) {
          toast.warning(`Uploaded ${uploadedFiles.length} of ${acceptedFiles.length} file(s). ${failedCount} failed.`, { id: toastId });
        } else {
          toast.success(`Successfully uploaded ${acceptedFiles.length} file(s)!`, { id: toastId });
        }

        // Step 3: Add successfully uploaded files to gallery
        if (uploadedFiles.length > 0) {
          const itemsToUpload: GalleryItem[] = uploadedFiles.map((img) => ({
            brand_id: brandId,
            asset_url: img.url,
            asset_title: img.name,
            asset_type: "image",
            asset_source: "brand-uploads",
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
          };

          // Gallery upload will show its own toast via the mutation
          await bulkUpload(uploadPayload);
          
          
        }
        
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
        tempImages.forEach(img => URL.revokeObjectURL(img.url));
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

  return (
    <ContentSection
      title="Upload your Brand Images"
      content={
        <div>
          <p className="text-sm text-gray-800 mb-4">
            Drag and drop brand images to upload automatically, or scrape images from Instagram, Pinterest, or your website. 
            All images will be added to your brand library in the gallery.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <MoodboardReferenceDropzone
                onDrop={onDrop}
                uploadedImages={uploadedImages}
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
              <div className="text-sm text-gray-500">
          
              </div>
              <div className="flex items-center gap-3">
                {/* Scrape for Media button - bottom right as per wireframe */}
                <Button
                  onClick={handleScrapeSelected}
                  disabled={selectedOptions.length === 0 || isScraping.scraping}
                  className="min-w-[150px]"
                >
                  {isScraping.scraping ? "Scraping..." : "Scrape for Media"}
                </Button>
                {/* Analysis Logs Popover - beside Scrape button as per wireframe */}
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
