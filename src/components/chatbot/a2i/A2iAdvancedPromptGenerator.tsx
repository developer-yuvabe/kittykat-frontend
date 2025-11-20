import { Textarea } from "@/components/ui/textarea";
import {
  ThreadA2iImage,
  ThreadCampaign,
  ThreadDetails,
  GeneratedPrompt,
} from "@/types/types";
import { GalleryItem } from "@/types/gallery.types";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import ReferenceMoodboard from "./ReferenceMoodboard";
import ReferenceImageSelector from "./ReferenceImageSelector";
import { A2iAdvancedPromptPresetSelector } from "./A2iAdvancedPromptPresetSelector";
import { A2iAdvancedPromptReferenceZones } from "./A2iAdvancedPromptReferenceZones";
import { A2iAdvancedPromptActions } from "./A2iAdvancedPromptActions";
import { A2iAdvancedPromptResults } from "./A2iAdvancedPromptResults";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useBrandStore } from "@/store/brand.store";
import { generateAdvancedPrompts } from "@/services/api/moodboard.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { a2iAdvancedPromptSchema } from "@/types/preset.types";
import { useA2iStore } from "@/store/a2i.store";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import { validateFiles } from "@/lib/reference-image.utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { getExtensionFromUrl } from "@/lib/utils";
import {
  A2iAdvancedPromptFormData,
  getDefaultFormValues,
  validatePromptGeneration,
} from "@/lib/preset.utils";
import { useResizeObserver } from "@/hooks/useResizeObserver";

type A2iAdvancedPromptGeneratorProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  referenceMoodboardAssets: ThreadA2iImage["reference_moodboard_assets"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
  currentCampaign: ThreadCampaign | null;
};

function A2iAdvancedPromptGenerator({
  referenceMoodboardId,
  referenceMoodboardAssets,
  prompts,
  moodboardInformation,
  formRef,
  currentCampaign,
}: A2iAdvancedPromptGeneratorProps) {
  const { selectedBrandId } = useBrandStore();
  const { setReferencePrompt } = useA2iStore();
  const { setParameters } = useMetadataActionsStore();

  // Add gallery query and store for reference images
  const { bulkUpload } = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: ["reference"],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
        sort_by: "last_accessed_at",
      },
    },
    40,
    true
  );

  const { addItems } = useReferenceImagesStore();

  const currentMoodboard = useMemo(
    () => moodboardInformation?.find((m) => m.id === referenceMoodboardId),
    [moodboardInformation, referenceMoodboardId]
  );

  const existingInputs = currentMoodboard?.prompt_generation_inputs;
  const isGenerating =
    currentMoodboard?.is_prompt_generation_in_progress || false;
  const generatedPrompts = currentMoodboard?.prompts;
  const conflictNotes = currentMoodboard?.prompt_generation_conflict_notes;

  const form = useForm<A2iAdvancedPromptFormData>({
    resolver: zodResolver(a2iAdvancedPromptSchema),
    defaultValues: getDefaultFormValues(existingInputs),
  });

  const NUMBER_OF_PROMPTS = 3;
  const watchedSelectedPreset = form.watch("selectedPreset");
  const watchedProductReference = form.watch("productReference");
  const watchedContextReference = form.watch("contextReference");
  const watchedPromptValue = form.watch("promptValue");
  const watchedNegativePrompt = form.watch("negativePrompt");

  const [optimisticIsGenerating, setOptimisticIsGenerating] = useState(false);
  const [isReferencePopoverOpen, setIsReferencePopoverOpen] = useState(false);
  const [referencePopoverTab, setReferencePopoverTab] = useState<
    "master" | "product"
  >("master");

  const isAnyGenerating = isGenerating || optimisticIsGenerating;

  useEffect(() => {
    form.reset(getDefaultFormValues(existingInputs));
  }, [referenceMoodboardId, form, existingInputs]);

  const { mutate: generatePrompts } = useMutation({
    mutationFn: async () => {
      if (!selectedBrandId || !referenceMoodboardId) {
        throw new Error("Brand ID and Moodboard ID are required");
      }

      return generateAdvancedPrompts(selectedBrandId, referenceMoodboardId, {
        preset_id: watchedSelectedPreset,
        product_references: watchedProductReference,
        context_references: watchedContextReference,
        prompt: watchedPromptValue || undefined,
        n: NUMBER_OF_PROMPTS,
      });
    },
    onSuccess: () => {
      toast.success(
        "Prompt generation started! Check the moodboard for results.",
        {
          description: "The prompts will be generated in the background.",
        }
      );
    },
    onError: (error: any) => {
      setOptimisticIsGenerating(false);
      console.error("Error generating prompts:", error);
      toast.error("Failed to generate prompts. Please try again.", {
        description: error.message || "An unexpected error occurred.",
      });
    },
  });

  const handleGeneratePrompts = useCallback(() => {
    const isValid = validatePromptGeneration(
      referenceMoodboardId,
      watchedSelectedPreset
    );

    if (!isValid) return;

    setOptimisticIsGenerating(true);
    generatePrompts();
  }, [
    referenceMoodboardId,
    watchedSelectedPreset,
    watchedProductReference,
    watchedContextReference,
    generatePrompts,
  ]);

  // Reusable form field change handler
  const handleFieldChange = useCallback(
    (fieldName: keyof A2iAdvancedPromptFormData, value: any) => {
      form.setValue(fieldName, value);
    },
    [form]
  );

  // Handle edit prompt - apply prompt and reference images to A2iImageInput
  const handleEditPrompt = useCallback(
    (generatedPrompt: GeneratedPrompt) => {
      // Set the prompt text
      setReferencePrompt(generatedPrompt.prompt);

      // Combine all reference images (product + context)
      const allReferences = [
        ...generatedPrompt.product_references,
        ...generatedPrompt.context_references,
      ];

      // Set reference images in metadata store for A2iImageInput to pick up
      if (allReferences.length > 0) {
        setParameters("imageGeneationParameters", {
          // Use a generic reference image parameter name that A2iImageInput will handle
          reference_images: allReferences,
        });
        setParameters(
          "productReferenceImages",
          generatedPrompt.product_references
        );
      }

      toast.success("Prompt and reference images applied to the input form");
    },
    [setReferencePrompt, setParameters]
  );

  const handleToggleReferenceSelector = useCallback(
    (tab: "master" | "product") => {
      if (isReferencePopoverOpen && referencePopoverTab === tab) {
        // If clicking the same tab, toggle closed
        setIsReferencePopoverOpen(false);
      } else {
        // Otherwise, open with the new tab
        setReferencePopoverTab(tab);
        setIsReferencePopoverOpen(true);
      }
    },
    [isReferencePopoverOpen, referencePopoverTab]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, url: string, source: "product" | "master") => {
      e.dataTransfer.setData("assetUrl", url);
      e.dataTransfer.setData("source", source);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  // Handle file uploads from OS drag-and-drop
  const handleFileUpload = useCallback(
    async (
      files: File[],
      targetZone: "master" | "product"
    ): Promise<string[]> => {
      const maxLimit = 20;
      const fileTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxFileSizeLimit = 10;
      const remainingSlots =
        maxLimit -
        (watchedProductReference.length + watchedContextReference.length);

      if (remainingSlots <= 0) {
        toast.error(`You can only upload ${maxLimit} image(s).`);
        return [];
      }

      // Use shared validation utility
      const { validFiles, invalidFiles } = validateFiles(
        files,
        fileTypes,
        maxFileSizeLimit,
        remainingSlots
      );

      if (invalidFiles.length > 0) {
        toast.warning(
          `${invalidFiles.length} file(s) rejected: ${invalidFiles.join(", ")}`
        );
      }

      if (validFiles.length === 0) {
        return [];
      }

      // Upload files with toast.promise for better UX
      const uploadPromise = async () => {
        const uploadedGalleryItems: GalleryItem[] = [];
        const uploadedUrls: string[] = [];

        // Upload files to storage
        const uploadPromises = validFiles.map(async (file) => {
          try {
            const uploadedUrl = await uploadFileAndReturnUrl(
              file.name,
              file.type,
              "brands",
              file,
              selectedBrandId
            );

            uploadedGalleryItems.push({
              brand_id: selectedBrandId!,
              asset_type: "image",
              asset_source: "reference",
              asset_title: file.name,
              asset_url: uploadedUrl,
              preview_url: uploadedUrl,
              media_format: getExtensionFromUrl(uploadedUrl),
              is_master: true,
              size: "",
              last_accessed_at: new Date().toISOString(),
            });

            uploadedUrls.push(uploadedUrl);
            return uploadedUrl;
          } catch (error) {
            console.error("Upload failed for", file.name, error);
            throw error;
          }
        });

        await Promise.all(uploadPromises);

        if (uploadedGalleryItems.length === 0) {
          throw new Error("No files were uploaded successfully");
        }

        // Save to gallery backend
        const response = await bulkUpload({
          gallery_items: uploadedGalleryItems,
          brand_id: selectedBrandId!,
        });

        // Add uploaded items to gallery store
        if (response && response.length > 0) {
          addItems(response);
        }

        return {
          successfulUrls: uploadedUrls,
          count: uploadedUrls.length,
          targetZone,
        };
      };

      try {
        const toastPromise = toast.promise(uploadPromise(), {
          loading: `Uploading ${validFiles.length} file(s) to ${targetZone} reference...`,
          success: (data) =>
            `${data.count} file(s) uploaded to ${data.targetZone} reference`,
          error: "Failed to upload files. Please try again.",
        });

        const result = await toastPromise.unwrap();
        return result.successfulUrls;
      } catch (error) {
        console.error("File upload failed:", error);
        return [];
      }
    },
    [
      watchedProductReference.length,
      watchedContextReference.length,
      selectedBrandId,
      bulkUpload,
      addItems,
    ]
  );

  const handleDropZone = useCallback(
    async (e: React.DragEvent, zone: "product" | "master") => {
      e.preventDefault();

      // Handle file drops from OS
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const uploadedUrls = await handleFileUpload(files, zone);

        if (uploadedUrls.length > 0) {
          // Update the appropriate reference zone
          if (zone === "product") {
            handleFieldChange("productReference", [
              ...watchedProductReference,
              ...uploadedUrls,
            ]);
          } else {
            handleFieldChange("contextReference", [
              ...watchedContextReference,
              ...uploadedUrls,
            ]);
          }
        }
        return;
      }

      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source") as
        | "product"
        | "master"
        | "gallery";

      if (!assetUrl) return;

      // Handle gallery drops - add to the zone
      if (source === "gallery") {
        const currentImageCount =
          watchedProductReference.length + watchedContextReference.length;
        const maxLimit = 20;

        if (currentImageCount >= maxLimit) {
          toast.error(`You can only upload ${maxLimit} image(s).`);
          return;
        }

        // Add to the appropriate zone
        if (zone === "product") {
          if (!watchedProductReference.includes(assetUrl)) {
            handleFieldChange("productReference", [
              ...watchedProductReference,
              assetUrl,
            ]);
            toast.success("Added to product reference");
          }
        } else {
          if (!watchedContextReference.includes(assetUrl)) {
            handleFieldChange("contextReference", [
              ...watchedContextReference,
              assetUrl,
            ]);
            toast.success("Added to master reference");
          }
        }
        return;
      }

      // Handle zone-to-zone moves
      const isMovingToContext = source === "product" && zone === "master";
      const isMovingToProduct = source === "master" && zone === "product";

      if (isMovingToContext) {
        handleFieldChange(
          "productReference",
          watchedProductReference.filter((url) => url !== assetUrl)
        );
        handleFieldChange("contextReference", [
          ...watchedContextReference,
          assetUrl,
        ]);
        toast.success("Moved to master reference");
      } else if (isMovingToProduct) {
        handleFieldChange(
          "contextReference",
          watchedContextReference.filter((url) => url !== assetUrl)
        );
        handleFieldChange("productReference", [
          ...watchedProductReference,
          assetUrl,
        ]);
        toast.success("Moved to product reference");
      }
    },
    [
      handleFieldChange,
      watchedProductReference,
      watchedContextReference,
      handleFileUpload,
    ]
  );

  const handleRemoveImage = useCallback(
    (zone: "product" | "master", url: string) => {
      if (zone === "product") {
        handleFieldChange(
          "productReference",
          watchedProductReference.filter((u) => u !== url)
        );
      } else {
        handleFieldChange(
          "contextReference",
          watchedContextReference.filter((u) => u !== url)
        );
      }
    },
    [handleFieldChange, watchedProductReference, watchedContextReference]
  );

  useEffect(() => {
    if (isGenerating) {
      setOptimisticIsGenerating(true);
    } else {
      setOptimisticIsGenerating(false);
    }
  }, [isGenerating]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [initialWidth, setInitialWidth] = useState<number | null>(null);
  const { width } = useResizeObserver({
    ref: containerRef as React.RefObject<any>,
  });

  // Store initial width on mount
  useEffect(() => {
    if (width && initialWidth === null) {
      setInitialWidth(width);
    }
  }, [width, initialWidth]);

  // Determine if negative prompt should be moved based on width decrease
  const shouldMoveNegativePrompt =
    initialWidth !== null && width !== undefined && width < initialWidth;

  return (
    <div className="flex flex-col gap-6 w-full" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign Prompt Generator</h1>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Moodboard */}
        <div className="flex flex-col gap-6">
          <ReferenceMoodboard
            referenceMoodboardId={referenceMoodboardId}
            referenceMoodboardAssets={referenceMoodboardAssets}
            prompts={prompts}
            moodboardInformation={moodboardInformation}
            formRef={formRef}
            currentCampaign={currentCampaign}
            showPrompts={false}
            isAdvanceMode={true}
          />
        </div>

        {/* Right Column - Reference Zones & Negative Prompt */}
        <div className="flex flex-col gap-y-4 mt-1">
          {/* Reference Image Selector Inline */}
          <ReferenceImageSelector
            variant="popover"
            masterReference={watchedContextReference}
            productReference={watchedProductReference}
            onMasterReferenceChange={(value) =>
              handleFieldChange("contextReference", value)
            }
            onProductReferenceChange={(value) =>
              handleFieldChange("productReference", value)
            }
            activeTab={referencePopoverTab}
            onTabChange={setReferencePopoverTab}
            maxLimit={20}
            fileTypes={["image/jpeg", "image/png", "image/webp"]}
            maxFileSizeLimit={10}
            maxTotalSizeMB={50}
            currentCampaignId={currentCampaign?.id || null}
            isOpen={isReferencePopoverOpen}
            onOpenChange={setIsReferencePopoverOpen}
          />
          <A2iAdvancedPromptReferenceZones
            productReference={watchedProductReference}
            contextReference={watchedContextReference}
            onProductReferenceClick={() =>
              handleToggleReferenceSelector("product")
            }
            onContextReferenceClick={() =>
              handleToggleReferenceSelector("master")
            }
            onDragStart={handleDragStart}
            onDrop={handleDropZone}
            onRemoveImage={handleRemoveImage}
          />

          {/* Negative Prompt Only - Show here if NOT moved */}
          {!shouldMoveNegativePrompt && (
            <div>
              <Textarea
                id="advanced-negative-prompt"
                title="Negative Prompt Controls"
                placeholder="More than 2 feet, smoke, warping, distortion..."
                className="h-[85px] w-full resize-none"
                variant="inset-label"
                label="Negative Prompt Controls"
                value={watchedNegativePrompt}
                onChange={(e) =>
                  handleFieldChange("negativePrompt", e.target.value)
                }
                disabled={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Negative Prompt - Show above main prompt if moved */}
      {shouldMoveNegativePrompt && (
        <div className="w-full">
          <Textarea
            id="advanced-negative-prompt"
            title="Negative Prompt Controls"
            placeholder="More than 2 feet, smoke, warping, distortion..."
            className="h-16 w-full resize-none"
            variant="inset-label"
            label="Negative Prompt Controls"
            value={watchedNegativePrompt}
            onChange={(e) =>
              handleFieldChange("negativePrompt", e.target.value)
            }
            disabled={false}
          />
        </div>
      )}

      {/* Positive Prompt - Full Width Below Grid */}
      <div className="w-full relative">
        <Textarea
          id="advanced-prompt"
          title="Positive Prompt Controls"
          placeholder="Describe what you want to see in the generated images..."
          className="h-[100px] w-full resize-none mb-[50px]"
          variant="inset-label"
          label="Positive Prompt Controls"
          value={watchedPromptValue}
          onChange={(e) => handleFieldChange("promptValue", e.target.value)}
          disabled={false}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <A2iAdvancedPromptPresetSelector
            selectedPreset={watchedSelectedPreset}
            onPresetChange={(presetId) =>
              handleFieldChange("selectedPreset", presetId)
            }
            disabled={isAnyGenerating}
          />
          <A2iAdvancedPromptActions
            onGenerate={handleGeneratePrompts}
            isGenerating={isAnyGenerating}
            disabled={isAnyGenerating}
          />
        </div>
      </div>

      {/* Results - Full Width Below Grid */}
      <div className="w-full">
        <A2iAdvancedPromptResults
          prompts={generatedPrompts}
          isGenerating={isGenerating || optimisticIsGenerating}
          conflictNotes={conflictNotes}
          onEditPrompt={handleEditPrompt}
          formRef={formRef}
        />
      </div>
    </div>
  );
}

export default A2iAdvancedPromptGenerator;
