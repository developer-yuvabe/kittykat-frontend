// components/brand/BrandAestheticUploader.tsx
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
import {
  GlobeIcon,
  Activity,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { LimitsState, UploadedImage } from "@/types/moodboard.types";
import { SocialOption, SocialOptionId } from "@/types/campaign.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import { BulkGalleryUploadRequest, GalleryItem } from "@/types/gallery.types";
import { Button } from "@/components/ui/button";
import { getExtensionFromUrl } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { AnalysisLogDetail } from "@/types/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatAnalysisType,
  formatTimestamp,
  getEstimatedTimeRemaining,
  getPlatformFromOptionId,
  getStatusColor,
  getStatusIcon,
} from "@/lib/logs.utils";
import { AnalysisStatus } from "@/types/logs.types";

// Analysis Status Enum to match backend

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
        log.status === AnalysisStatus.IN_PROGRESS ||
        log.status === "processing" // Legacy support
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

  // ... (keeping all existing handler functions unchanged)

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

  const renderAnalysisLog = (log: AnalysisLogDetail, isActive = false) => (
    <Card
      key={log.log_id}
      className={`border-0 shadow-none transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 ring-1 ring-blue-200"
          : "bg-gray-50/50 hover:bg-gray-50"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getStatusIcon(log.status)}

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header with improved spacing and contrast */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-gray-900">
                    {formatAnalysisType(log.analysis_type)}
                  </h4>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${getStatusColor(
                    log.status
                  )}`}
                >
                  {log.status.charAt(0).toUpperCase() +
                    log.status.slice(1).replace("_", " ")}
                </Badge>
              </div>
              <div className="text-right space-y-1 flex-shrink-0">
                <p className="text-xs text-gray-500 font-medium">
                  {formatTimestamp(log.created_at)}
                </p>
              </div>
            </div>

            {/* Enhanced Progress Section */}
            {(log.status === AnalysisStatus.IN_PROGRESS ||
              log.status === "processing" ||
              log.status === AnalysisStatus.COMPLETED) && (
              <div className="space-y-3 bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {log.progress_percent}%
                  </span>
                </div>
                <Progress
                  value={log.progress_percent}
                  className={`h-2.5 ${
                    log.status === AnalysisStatus.IN_PROGRESS ||
                    log.status === "processing"
                      ? "bg-blue-100"
                      : "bg-green-100"
                  }`}
                />

                {/* Enhanced Stats with better visual hierarchy */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">
                    {log.processed_items} of {log.total_items} items processed
                  </span>
                  <div className="flex items-center gap-3">
                    {log.successful_items > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-700 font-semibold">
                          {log.successful_items}
                        </span>
                      </div>
                    )}
                    {log.failed_items > 0 && (
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-700 font-semibold">
                          {log.failed_items}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Latest Message with better styling */}
            {log.user_friendly_messages &&
              log.user_friendly_messages.length > 0 && (
                <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Latest Update
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {
                      log.user_friendly_messages[
                        log.user_friendly_messages.length - 1
                      ]?.message
                    }
                  </p>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

          <div className="lg:col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBulkUpload}
                disabled={
                  (uploadedImages.length === 0 &&
                    selectedOptions.length === 0) ||
                  isProcessing
                }
                className="min-w-[200px]"
              >
                {isProcessing && (
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                )}
                {getButtonText()}
              </Button>

              {/* Enhanced Analysis Logs Popover */}
              {categorizedLogs.total > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`relative transition-all duration-200 ${
                        categorizedLogs.active.length > 0
                          ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Activity
                        className={`w-4 h-4 mr-2 ${
                          categorizedLogs.active.length > 0
                            ? "animate-spin text-blue-600"
                            : ""
                        }`}
                      />
                      Analysis Logs
                      {categorizedLogs.active.length > 0 && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 font-bold border-blue-200"
                          >
                            {categorizedLogs.active.length}
                          </Badge>
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[600px] p-0 max-h-[70vh] overflow-y-scroll"
                    align="start"
                  >
                    {/* Enhanced Header with better stats */}
                    <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-base text-gray-900">
                            Analysis Progress
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            All jobs sorted by latest first
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-3 text-sm mb-1">
                            {categorizedLogs.active.length > 0 && (
                              <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                {categorizedLogs.active.length} active
                              </div>
                            )}
                            {categorizedLogs.completed.length > 0 && (
                              <div className="flex items-center gap-1 text-green-600 font-semibold">
                                <CheckCircle className="w-3 h-3" />
                                {categorizedLogs.completed.length}
                              </div>
                            )}
                            {categorizedLogs.failed.length > 0 && (
                              <div className="flex items-center gap-1 text-red-600 font-semibold">
                                <XCircle className="w-3 h-3" />
                                {categorizedLogs.failed.length}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium">
                            {categorizedLogs.total} total jobs
                          </p>
                        </div>
                      </div>
                    </div>

                    <ScrollArea className="max-h-[500px]">
                      <div className="p-4 space-y-4">
                        {categorizedLogs.total === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-semibold text-lg mb-2">
                              No analysis logs yet
                            </p>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                              Start uploading images or scraping social media to
                              see progress tracking here
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Show all logs sorted by latest first */}
                            {categorizedLogs.all.map((log) => {
                              const isActive =
                                log.status === AnalysisStatus.PENDING ||
                                log.status === AnalysisStatus.IN_PROGRESS ||
                                log.status === "processing";
                              return renderAnalysisLog(log, isActive);
                            })}
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Enhanced Footer with action hints */}
                    {categorizedLogs.total > 0 && (
                      <div className="border-t bg-gray-50 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Updates automatically every few seconds</span>
                          {categorizedLogs.active.length > 0 && (
                            <div className="flex items-center gap-1 text-blue-600 font-medium">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                              Live tracking active
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      }
      context={undefined}
    />
  );
};
