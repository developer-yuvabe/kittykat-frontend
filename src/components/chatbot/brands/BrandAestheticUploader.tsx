// components/brand/BrandAestheticUploader.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { getExtensionFromUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";

interface Props {
  brandId: string | null;
  socialMediaData?: {
    instagram?: string;
    pinterest?: string;
    facebook?: string;
    website?: string;
  };
}

export const BrandAestheticUploader: React.FC<Props> = ({
  brandId,
  socialMediaData,
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [socialOptions, setSocialOptions] = useState<SocialOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [limits, setLimits] = useState<LimitsState>({
    pinterest_limit: 10,
    instagram_limit: 10,
    facebook_limit: 10,
    website_limit: 10,
  });

  const { user } = useUserStore();

  const { bulkUpload } = useGalleryQuery({});

  const getPlatformFromOptionId = (optionId: string): string => {
    switch (optionId) {
      case SocialOptionId.Instagram:
        return "instagram";
      case SocialOptionId.Pinterest:
        return "pinterest";
      case SocialOptionId.Facebook:
        return "facebook";
      case SocialOptionId.Website:
        return "website";
      default:
        return "unknown";
    }
  };

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

    const hasUploadedImages = uploadedImages.length > 0;
    const hasSelectedSocialOptions = selectedOptions.length > 0;

    if (!hasUploadedImages && !hasSelectedSocialOptions) {
      toast.error("Please upload images or select social media options.");
      return;
    }

    try {
      // Case 1: Only social media options selected (scrape only)
      if (!hasUploadedImages && hasSelectedSocialOptions) {
        // Process each selected social option separately
        for (const optionId of selectedOptions) {
          const platform = getPlatformFromOptionId(optionId);
          const url = getSocialMediaUrl(optionId);
          const resultsLimit = getResultsLimit(optionId);

          if (
            !url ||
            url === "https://" ||
            url === "https://instagram.com/" ||
            url === "https://www.facebook.com/"
          ) {
            toast.error(`Please provide a valid URL for ${platform}`);
            continue;
          }

          const scrapePayload: BulkGalleryUploadRequest = {
            brand_id: brandId,
            scrape_config: {
              url,
              platform,
              results_limit: resultsLimit,
              user_id: user?.id,
            },
            scrape_only: true,
          };

          await bulkUpload(scrapePayload);
        }
        toast.success("Social media scraping initiated successfully!");
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
        toast.success("Images uploaded to gallery successfully!");
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
        for (const optionId of selectedOptions) {
          const platform = getPlatformFromOptionId(optionId);
          const url = getSocialMediaUrl(optionId);
          const resultsLimit = getResultsLimit(optionId);

          if (
            !url ||
            url === "https://" ||
            url === "https://instagram.com/" ||
            url === "https://www.facebook.com/"
          ) {
            toast.error(`Please provide a valid URL for ${platform}`);
            continue;
          }

          const scrapePayload: BulkGalleryUploadRequest = {
            brand_id: brandId,
            scrape_config: {
              url,
              platform,
              results_limit: resultsLimit,
              user_id: user?.id,
            },
            scrape_only: true,
          };

          await bulkUpload(scrapePayload);
        }

        toast.success(
          "Images uploaded and social media scraping initiated successfully!"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload/scraping failed. Please try again.");
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
      title="Upload your brand Aesthetic"
      content={
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
          <Button
            className="mt-4"
            onClick={handleBulkUpload}
            disabled={
              uploadedImages.length === 0 && selectedOptions.length === 0
            }
          >
            {getButtonText()}
          </Button>
        </div>
      }
      context={undefined}
    />
  );
};
