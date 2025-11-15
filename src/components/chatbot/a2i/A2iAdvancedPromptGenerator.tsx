import {
  PromptGenerationInputs,
  ThreadA2iImage,
  ThreadCampaign,
  ThreadDetails,
} from "@/types/types";
import React, { RefObject, useCallback, useEffect, useMemo } from "react";
import ReferenceMoodboard from "./ReferenceMoodboard";
import ReferenceImageSelector from "./ReferenceImageSelector";
import { A2iAdvancedPromptPresetSelector } from "./A2iAdvancedPromptPresetSelector";
import { A2iAdvancedPromptReferenceZones } from "./A2iAdvancedPromptReferenceZones";
import { A2iAdvancedPromptInputs } from "./A2iAdvancedPromptInputs";
import { A2iAdvancedPromptActions } from "./A2iAdvancedPromptActions";
import { A2iAdvancedPromptResults } from "./A2iAdvancedPromptResults";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useBrandStore } from "@/store/brand.store";
import { generateAdvancedPrompts } from "@/services/api/moodboard.service";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { a2iAdvancedPromptSchema } from "@/types/preset.types";

type A2iAdvancedPromptFormData = z.infer<typeof a2iAdvancedPromptSchema>;

type A2iAdvancedPromptGeneratorProps = {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  referenceMoodboardAssets: ThreadA2iImage["reference_moodboard_assets"];
  prompts: ThreadA2iImage["prompts"];
  moodboardInformation: ThreadDetails["moodboard_information"];
  formRef: RefObject<HTMLDivElement | null>;
  currentCampaign: ThreadCampaign | null;
};

/**
 * Get the default form values from existing inputs
 */
const getDefaultFormValues = (
  existingInputs?: PromptGenerationInputs
): A2iAdvancedPromptFormData => ({
  selectedPreset: existingInputs?.preset_id || "",
  productReference: existingInputs?.product_references || [],
  contextReference: existingInputs?.context_references || [],
  promptValue: existingInputs?.prompt || "",
  negativePrompt: existingInputs?.negative_prompt || [],
  numberOfPrompts: existingInputs?.n || 3,
});

/**
 * Validate form data before generating prompts
 */
const validatePromptGeneration = (
  referenceMoodboardId: string | undefined,
  selectedPreset: string
): boolean => {
  if (!referenceMoodboardId) {
    toast.error("Please select a reference moodboard first");
    return false;
  }

  if (!selectedPreset) {
    toast.error("Please select a preset");
    return false;
  }

  return true;
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

  const currentMoodboard = useMemo(
    () => moodboardInformation?.find((m) => m.id === referenceMoodboardId),
    [moodboardInformation, referenceMoodboardId]
  );

  const existingInputs = currentMoodboard?.prompt_generation_inputs;
  const isGenerating =
    currentMoodboard?.is_prompt_generation_in_progress || false;
  const generatedPrompts = currentMoodboard?.prompts;
  const conflictNotes = currentMoodboard?.prompt_generation_conflict_notes;

  // ====== Form Setup ======
  const form = useForm<A2iAdvancedPromptFormData>({
    resolver: zodResolver(a2iAdvancedPromptSchema),
    defaultValues: getDefaultFormValues(existingInputs),
  });

  // ====== Form Watchers (for reactive UI) ======
  const watchedNumberOfPrompts = form.watch("numberOfPrompts");
  const watchedSelectedPreset = form.watch("selectedPreset");
  const watchedProductReference = form.watch("productReference");
  const watchedContextReference = form.watch("contextReference");
  const watchedPromptValue = form.watch("promptValue");
  const watchedNegativePrompt = form.watch("negativePrompt");

  // ====== UI State ======
  const [optimisticIsGenerating, setOptimisticIsGenerating] =
    React.useState(false);
  const [isReferencePopoverOpen, setIsReferencePopoverOpen] =
    React.useState(false);
  const [referencePopoverTab, setReferencePopoverTab] = React.useState<
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
        negative_prompt: watchedNegativePrompt,
        n: watchedNumberOfPrompts,
      });
    },
    onSuccess: () => {
      setOptimisticIsGenerating(false);
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

  const handleOpenReferencePopover = useCallback(
    (tab: "master" | "product") => {
      setReferencePopoverTab(tab);
      setIsReferencePopoverOpen(true);
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, url: string, source: "product" | "master") => {
      e.dataTransfer.setData("assetUrl", url);
      e.dataTransfer.setData("source", source);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDropZone = useCallback(
    (e: React.DragEvent, zone: "product" | "master") => {
      e.preventDefault();
      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source") as "product" | "master";

      if (!assetUrl) return;

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
        toast.success("Moved to context reference");
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
    [handleFieldChange, watchedProductReference, watchedContextReference]
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign Prompt Generator</h1>
        <A2iAdvancedPromptPresetSelector
          selectedPreset={watchedSelectedPreset}
          onPresetChange={(presetId) =>
            handleFieldChange("selectedPreset", presetId)
          }
          disabled={isAnyGenerating}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Reference & Zones */}
        <div className="col-span-7 flex flex-col gap-6">
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

          <A2iAdvancedPromptReferenceZones
            productReference={watchedProductReference}
            contextReference={watchedContextReference}
            onProductReferenceClick={() =>
              handleOpenReferencePopover("product")
            }
            onContextReferenceClick={() => handleOpenReferencePopover("master")}
            onDragStart={handleDragStart}
            onDrop={handleDropZone}
            onRemoveImage={handleRemoveImage}
          />
        </div>

        {/* Right Column - Inputs */}
        <div className="col-span-5 flex flex-col gap-6">
          <A2iAdvancedPromptInputs
            promptValue={watchedPromptValue}
            negativePrompt={watchedNegativePrompt}
            onPromptChange={(value) => handleFieldChange("promptValue", value)}
            onNegativePromptChange={(value) =>
              handleFieldChange("negativePrompt", value)
            }
          />
        </div>
      </div>

      {/* Reference Image Selector Modal */}
      <ReferenceImageSelector
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
        showPopoverTrigger={false}
      />

      {/* Actions & Settings */}
      <div className="flex flex-row gap-x-2 justify-end">
        <A2iAdvancedPromptActions
          onGenerate={handleGeneratePrompts}
          isGenerating={isAnyGenerating}
          disabled={isAnyGenerating}
        />
        <Input
          id="number-of-prompts"
          type="number"
          min={1}
          max={10}
          value={watchedNumberOfPrompts}
          onChange={(e) =>
            handleFieldChange("numberOfPrompts", Number(e.target.value))
          }
          disabled={isAnyGenerating}
          className="w-16"
        />
      </div>

      {/* Results */}
      <A2iAdvancedPromptResults
        prompts={generatedPrompts}
        isGenerating={isGenerating || optimisticIsGenerating}
        conflictNotes={conflictNotes}
        numberOfPrompts={watchedNumberOfPrompts}
        onNumberOfPromptsChange={(value) =>
          handleFieldChange("numberOfPrompts", value)
        }
      />
    </div>
  );
}

export default A2iAdvancedPromptGenerator;
