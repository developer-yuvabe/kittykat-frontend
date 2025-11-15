import { ThreadA2iImage, ThreadCampaign, ThreadDetails } from "@/types/types";
import React, { RefObject, useState, useCallback, useEffect } from "react";
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

  // Find the current moodboard to check for existing prompt generation inputs
  const currentMoodboard = moodboardInformation?.find(
    (m) => m.id === referenceMoodboardId
  );

  const existingInputs = currentMoodboard?.prompt_generation_inputs;
  const isGenerating =
    currentMoodboard?.is_prompt_generation_in_progress || false;
  const generatedPrompts = currentMoodboard?.prompts;
  const conflictNotes = currentMoodboard?.prompt_generation_conflict_notes;

  // State for preset selection - use existing preset or undefined to allow auto-selection
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    existingInputs?.preset_id || undefined
  );

  // State for reference images
  const [productReference, setProductReference] = useState<string[]>(
    existingInputs?.product_references || []
  );
  const [contextReference, setContextReference] = useState<string[]>(
    existingInputs?.context_references || []
  );

  // State for prompt inputs
  const [promptValue, setPromptValue] = useState<string>(
    existingInputs?.prompt || ""
  );
  const [negativePrompt, setNegativePrompt] = useState<string[]>(
    existingInputs?.negative_prompt || []
  );
  const [numberOfPrompts, setNumberOfPrompts] = useState<number>(
    existingInputs?.n || 3
  );

  // Reference image selector state
  const [isReferencePopoverOpen, setIsReferencePopoverOpen] = useState(false);
  const [referencePopoverTab, setReferencePopoverTab] = useState<
    "master" | "product"
  >("master");

  const handlePresetChange = useCallback((presetId: string) => {
    setSelectedPreset(presetId);
  }, []);

  useEffect(() => {
    if (currentMoodboard?.prompt_generation_inputs) {
      const inputs = currentMoodboard.prompt_generation_inputs;

      // Only set preset if there's a valid value, otherwise leave undefined for auto-selection
      if (inputs.preset_id) {
        setSelectedPreset(inputs.preset_id);
      }
      setProductReference(inputs.product_references || []);
      setContextReference(inputs.context_references || []);
      setPromptValue(inputs.prompt || "");
      setNegativePrompt(inputs.negative_prompt || []);
      setNumberOfPrompts(inputs.n || 3);
    } else {
      // Reset to defaults when no existing inputs
      setSelectedPreset(undefined);
      setProductReference([]);
      setContextReference([]);
      setPromptValue("");
      setNegativePrompt([]);
      setNumberOfPrompts(3);
    }
  }, [referenceMoodboardId]);

  // Mutation for generating prompts
  const { mutate: generatePrompts, isPending: isGeneratingPrompts } =
    useMutation({
      mutationFn: async () => {
        if (!selectedBrandId || !referenceMoodboardId) {
          throw new Error("Brand ID and Moodboard ID are required");
        }

        return generateAdvancedPrompts(selectedBrandId, referenceMoodboardId, {
          preset_id: selectedPreset!,
          product_references: productReference,
          context_references: contextReference,
          prompt: promptValue || undefined,
          negative_prompt: negativePrompt,
          n: numberOfPrompts,
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
        console.error("Error generating prompts:", error);
        toast.error("Failed to generate prompts. Please try again.", {
          description: error.message || "An unexpected error occurred.",
        });
      },
    });

  const handleGeneratePrompts = useCallback(() => {
    // Validation
    if (!referenceMoodboardId) {
      toast.error("Please select a reference moodboard first");
      return;
    }

    if (!selectedPreset) {
      toast.error("Please select a preset");
      return;
    }

    if (productReference.length === 0 && contextReference.length === 0) {
      toast.warning(
        "Consider adding product or context references for better results"
      );
    }

    generatePrompts();
  }, [
    referenceMoodboardId,
    selectedPreset,
    productReference,
    contextReference,
    generatePrompts,
  ]);

  // Reference zone handlers
  const openReferencePopover = useCallback((tab: "master" | "product") => {
    setReferencePopoverTab(tab);
    setIsReferencePopoverOpen(true);
  }, []);

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
      const source = e.dataTransfer.getData("source");

      if (!assetUrl) return;

      // Handle moving between zones
      if (source === "product" && zone === "master") {
        setProductReference((prev) => prev.filter((url) => url !== assetUrl));
        setContextReference((prev) => [...prev, assetUrl]);
        toast.success("Moved to context reference");
      } else if (source === "master" && zone === "product") {
        setContextReference((prev) => prev.filter((url) => url !== assetUrl));
        setProductReference((prev) => [...prev, assetUrl]);
        toast.success("Moved to product reference");
      }
    },
    []
  );

  const handleRemoveImage = useCallback(
    (zone: "product" | "master", url: string) => {
      if (zone === "product") {
        setProductReference((prev) => prev.filter((u) => u !== url));
      } else {
        setContextReference((prev) => prev.filter((u) => u !== url));
      }
    },
    []
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaign Prompt Generator</h1>
        <A2iAdvancedPromptPresetSelector
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
          disabled={isGenerating || isGeneratingPrompts}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-7 flex flex-col gap-6">
          {/* Reference Moodboard */}
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

          {/* Reference Zones */}
          <A2iAdvancedPromptReferenceZones
            productReference={productReference}
            contextReference={contextReference}
            onProductReferenceClick={() => openReferencePopover("product")}
            onContextReferenceClick={() => openReferencePopover("master")}
            onDragStart={handleDragStart}
            onDrop={handleDropZone}
            onRemoveImage={handleRemoveImage}
          />
        </div>

        {/* Right Column */}
        <div className="col-span-5 flex flex-col gap-6">
          <A2iAdvancedPromptInputs
            promptValue={promptValue}
            negativePrompt={negativePrompt}
            onPromptChange={setPromptValue}
            onNegativePromptChange={setNegativePrompt}
          />
        </div>
      </div>

      {/* Reference Image Selector */}
      <ReferenceImageSelector
        masterReference={contextReference}
        productReference={productReference}
        onMasterReferenceChange={setContextReference}
        onProductReferenceChange={setProductReference}
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

      {/* Generated Prompts Results */}
      <div className="flex flex-row gap-x-2 justify-end">
        <A2iAdvancedPromptActions
          onGenerate={handleGeneratePrompts}
          isGenerating={isGenerating || isGeneratingPrompts}
          disabled={isGenerating || isGeneratingPrompts}
        />
        <Input
          id="number-of-prompts"
          type="number"
          min={1}
          max={10}
          value={numberOfPrompts}
          onChange={(e) => setNumberOfPrompts(Number(e.target.value))}
          disabled={isGenerating || isGeneratingPrompts}
          className="w-16"
        />
      </div>
      <A2iAdvancedPromptResults
        prompts={generatedPrompts}
        isGenerating={isGenerating}
        conflictNotes={conflictNotes}
        numberOfPrompts={numberOfPrompts}
        onNumberOfPromptsChange={setNumberOfPrompts}
      />
    </div>
  );
}

export default A2iAdvancedPromptGenerator;
