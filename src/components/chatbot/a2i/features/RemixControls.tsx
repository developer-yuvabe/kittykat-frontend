import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { BrushIcon } from "@/components/ui/custom-icon";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useA2iForm } from "@/hooks/useA2iForm";
import useModelPricing from "@/hooks/useModelPricing";
import {
  canvasToBlob,
  cn,
  PlatformApiError,
  getExtensionFromUrl,
} from "@/lib/utils";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { remixImageService } from "@/services/api/remix.service";
import { useBrandStore } from "@/store/brand.store";
import { useCreditsStore } from "@/store/credits.store";
import { useModelsStore } from "@/store/models.store";
import { useUserStore } from "@/store/user.store";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import { useGalleryQuery } from "@/hooks/useGallery";
import { FileParam, ModelParameter } from "@/types/a2i-media.types";
import { GalleryItem } from "@/types/gallery.types";
import { updateUser } from "@/services/api/user.service";
import { Eraser, Images, Redo, Settings2, Undo } from "lucide-react";
import { LockIcon, LockOpenIcon, TrashIcon } from "@/components/ui/custom-icon";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { DynamicFormField } from "../DynamicFormField";
import ModelSelector from "../ModelSelector";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { useRouter } from "next/navigation";
import TokenGenerateButton from "@/components/shared/TokenGenerateButton";
import { getRemixInputPlaceholderMessage } from "@/lib/a2i.utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import ReferenceImageSelector from "../ReferenceImageSelector";
import { Paperclip, PanelTop } from "lucide-react";
import { ReferenceZone } from "../ReferenceZone";
import {
  handleReferenceImageDrop,
  updateReferencesByZone,
  validateFiles,
} from "@/lib/reference-image.utils";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";

export type RemixControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  image: {
    url: string;
    size: string;
  };
  offScreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brandId?: string;
};

const RemixControls = ({
  image,
  offScreenCanvasRef,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  brushSize,
  onBrushSizeChange,
  brandId,
}: RemixControlsProps) => {
  const router = useRouter();
  const { closeConceptVisual, source, isConceptVisualOpened } =
    useConceptVisualStore();
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { selectedBrandId, selectedCampaignId: campaignId } = useBrandStore();
  const { selectedRemixModel, setSelectedRemixModel } = useModelsStore();
  const { user, setUser } = useUserStore();
  const [isMagicEnabled, setIsMagicEnabled] = useState(
    user?.user_preferences?.enhance_prompts
  );
  const { parameters, setParameters } = useMetadataActionsStore();
  const [masterReference, setMasterReference] = useState<string[]>([]);
  const [productReference, setProductReference] = useState<string[]>([]);

  const {
    initialParams,
    advancedParams,
    referenceImageParam,
    baseImageParam,
    maskImageParam,
  } = useMemo(() => {
    const initialParams: ModelParameter[] = [];
    const advancedParams: ModelParameter[] = [];
    let referenceImageParam: FileParam | null = null;
    let baseImageParam = null;
    let maskImageParam = null;

    for (const param of selectedRemixModel?.parameters || []) {
      if (["base_image", "image"].includes(param.id) && param.type !== "file") {
        baseImageParam = param;
        continue;
      }

      if (["reference_images", "image"].includes(param.id)) {
        referenceImageParam = param as FileParam;
        continue;
      }

      if (["mask_image"].includes(param.id)) {
        maskImageParam = param;
        continue;
      }

      if (param.category === "initial" && param.id !== "prompt") {
        initialParams.push(param);
      } else if (param.category === "advanced") {
        advancedParams.push(param);
      }
    }

    return {
      initialParams,
      advancedParams,
      referenceImageParam,
      baseImageParam,
      maskImageParam,
    };
  }, [selectedRemixModel]);

  const form = useA2iForm({
    selectedModel: selectedRemixModel,
    formKey: `remix`,
    dynamicDefualtValues: {
      ...(baseImageParam?.id && image.url
        ? { [baseImageParam.id]: image.url }
        : {}),
    },
  });

  useEffect(() => {
    if (image.url && baseImageParam) {
      form.setValue(baseImageParam.id, image.url, { shouldValidate: true });
    } else if (baseImageParam) {
      form.setValue(baseImageParam.id, null, { shouldValidate: true });
    }
  }, [image]);

  useEffect(() => {
    const p = parameters.remixParameters;
    if (!p) return;

    // Load prompt
    if (p.prompt) form.setValue("prompt", p.prompt, { shouldValidate: true });

    // Load all other parameters
    for (const param of selectedRemixModel?.parameters ?? []) {
      const id = param.id;
      if (p[id] !== undefined) {
        form.setValue(id, p[id], { shouldValidate: true });
      }
    }

    // Dynamically find the reference images parameter ID from the model
    const refParam = selectedRemixModel?.parameters?.find(
      (param) => param.type === "file" && param.id.includes("reference_images")
    );

    if (refParam) {
      // Extract references using the dynamic parameter ID
      const productImages = p.product_reference_images || [];
      const allReferenceImages = p[refParam.id] || [];

      // Separate master vs product references
      const masterImages = allReferenceImages.filter(
        (img: string) => !productImages.includes(img)
      );

      const master = masterImages.length > 0 ? [masterImages[0]] : [];
      const products = productImages;

      setMasterReference(master);
      setProductReference(products);
    }

    // Clear parameters after a tick to avoid race conditions
    requestAnimationFrame(() => {
      setParameters("remixParameters", null);
    });
  }, [parameters.remixParameters, selectedRemixModel, form, setParameters]);

  const { credits, isCalculatingCredits } = useModelPricing({
    form,
    model: selectedRemixModel,
  });

  // Reference images state - using master/product zones like A2iImageInput

  const [isReferencePopoverOpen, setIsReferencePopoverOpen] = useState(false);
  const [referencePopoverTab, setReferencePopoverTab] = useState<
    "master" | "product"
  >("master");

  const currentImageCount = masterReference.length + productReference.length;

  // Gallery query for uploading reference images
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

  const openReferencePopover = (tab: "master" | "product") => {
    setReferencePopoverTab(tab);
    setIsReferencePopoverOpen(true);
  };

  // Handle file uploads from OS drag-and-drop
  const handleFileUpload = useCallback(
    async (
      files: File[],
      targetZone: "master" | "product"
    ): Promise<string[]> => {
      if (!referenceImageParam) {
        toast.error("This model doesn't support reference images");
        return [];
      }

      const { fileTypes, maxFileSizeLimit, maxLimit } = referenceImageParam;
      const remainingSlots =
        maxLimit - (masterReference.length + productReference.length);

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
      referenceImageParam,
      masterReference.length,
      productReference.length,
      selectedBrandId,
      bulkUpload,
      addItems,
    ]
  );

  const handleToggleMagic = async () => {
    if (!user) return;

    const newMagicState = !isMagicEnabled;
    const updatedPreferences = {
      enhance_prompts: newMagicState,
    };

    // Update local state and store optimistically
    setIsMagicEnabled(newMagicState);
    const updatedUserWithPrefs = {
      ...user,
      user_preferences: updatedPreferences,
    };
    setUser(updatedUserWithPrefs);
    toast.success(`Magic enhance ${newMagicState ? "enabled" : "disabled"}`);

    // Update server in the background
    try {
      await updateUser(user.id, {
        user_preferences: updatedPreferences,
      });
    } catch (error) {
      console.error("Error toggling magic feature:", error);
      // Revert optimistic update on error
      setIsMagicEnabled(!newMagicState);
      setUser(user);
      toast.error("Failed to update magic preference");
    }
  };

  // Handle drag-and-drop between zones (when popover is closed)
  const handleZoneDrop = useCallback(
    async (e: React.DragEvent, targetZone: "master" | "product") => {
      e.preventDefault();
      e.stopPropagation();

      if (!referenceImageParam) {
        toast.error("This model doesn't support reference images");
        return;
      }

      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source");

      // Handle file drops from OS
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const uploadedUrls = await handleFileUpload(files, targetZone);

        if (uploadedUrls.length > 0) {
          // Use shared utility to update references
          const { newMasterReference, newProductReference } =
            updateReferencesByZone(
              targetZone,
              uploadedUrls,
              masterReference,
              productReference
            );
          setMasterReference(newMasterReference);
          setProductReference(newProductReference);
        }
        return;
      }

      // Handle drag between zones
      if (!assetUrl) return;

      // Use shared utility function for drop logic
      const result = handleReferenceImageDrop(
        assetUrl,
        source,
        targetZone,
        masterReference,
        productReference,
        referenceImageParam.maxLimit
      );

      // If drop should be prevented, show toast and return
      if (result.shouldPrevent) {
        if (result.toastMessage) {
          toast[result.toastMessage.type](result.toastMessage.message);
        }
        return;
      }

      // Apply the state updates
      if (result.newMasterReference !== undefined) {
        setMasterReference(result.newMasterReference);
      }
      if (result.newProductReference !== undefined) {
        setProductReference(result.newProductReference);
      }

      // Show success toast
      if (result.toastMessage) {
        toast[result.toastMessage.type](result.toastMessage.message);
      }
    },
    [referenceImageParam, masterReference, productReference, handleFileUpload]
  );

  const onSubmit = async (data: Record<string, any>) => {
    try {
      // Combine master and product references for the API
      const referenceImages: string[] = [];
      referenceImages.push(...masterReference, ...productReference);

      // Add reference images to form data if model supports it

      if (referenceImageParam && referenceImages.length > 0) {
        data[referenceImageParam.id] =
          referenceImageParam.maxLimit > 1
            ? referenceImages
            : referenceImages[0];
      }

      let maskUrl = null;

      if (maskImageParam) {
        const offScreenCanvas = offScreenCanvasRef.current;
        if (!offScreenCanvas) return;

        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = offScreenCanvas.width;
        compositeCanvas.height = offScreenCanvas.height;

        const compositeCtx = compositeCanvas.getContext("2d");
        if (!compositeCtx) throw new Error("Failed to get canvas context");

        compositeCtx.fillStyle = "black";
        compositeCtx.fillRect(
          0,
          0,
          compositeCanvas.width,
          compositeCanvas.height
        );

        compositeCtx.globalCompositeOperation = "lighten";
        compositeCtx.drawImage(offScreenCanvas, 0, 0);

        compositeCtx.globalCompositeOperation = "source-over";

        const blob = await canvasToBlob(compositeCanvas, "image/png");
        const file = new File([blob], "mask-image.png", {
          type: "image/png",
        });

        maskUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "remix",
          file
        );
      }

      await remixImageService(
        brandId ?? selectedBrandId!,
        campaignId,
        data,
        maskUrl,
        productReference,
        isMagicEnabled && productReference.length > 0
      );

      if (!isLocked) {
        form.setValue("prompt", "", { shouldValidate: true });
        setMasterReference([]);
        setProductReference([]);
        if (referenceImageParam) {
          form.setValue(referenceImageParam.id, null);
        }
      }

      closeConceptVisual();
      if (source === "blanket") {
        router.push("/?scrollTo=a2i-input");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to remix image. Please try again.");
    }
  };

  useEffect(() => {
    // Handle model changes - only clear if new model doesn't support reference images
    if (!referenceImageParam) {
      if (currentImageCount > 0) {
        toast.info(
          "This model doesn't support reference images. Uploaded images have been removed."
        );
      }
      setMasterReference([]);
      setProductReference([]);
      return;
    }

    const maxLimit = referenceImageParam.maxLimit;
    const totalImages = masterReference.length + productReference.length;

    if (totalImages > maxLimit) {
      const masterKeep = masterReference.slice(0, maxLimit);
      const productKeep = productReference.slice(
        0,
        Math.max(0, maxLimit - masterKeep.length)
      );

      toast.info(
        `This model only supports ${maxLimit} image${
          maxLimit > 1 ? "s" : ""
        }. Extra images have been removed.`
      );

      setMasterReference(masterKeep);
      setProductReference(productKeep);

      // Update form value with kept images
      const keptImages = [...masterKeep, ...productKeep];
      if (keptImages.length > 0) {
        const value = maxLimit > 1 ? keptImages : keptImages[0];
        form.setValue(referenceImageParam.id, value, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    }
  }, [
    selectedRemixModel?.id,
    referenceImageParam,
    masterReference.length,
    productReference.length,
    form,
    currentImageCount,
  ]);

  const value = form.watch("max_images");
  const numberOfReferenceImagesUploaded = currentImageCount;

  useEffect(() => {
    const total = numberOfReferenceImagesUploaded + value;

    if (total > 14) {
      const newValue = Math.max(1, 14 - numberOfReferenceImagesUploaded);
      form.setValue("max_images", newValue);
      toast.info(
        `The maximum number of images to generate has been adjusted to ${newValue} due to the number of reference images uploaded.`
      );
    }
  }, [numberOfReferenceImagesUploaded, value, form]);

  const [isLocked, setIsLocked] = useState(false);

  function clearPromptAndReferences() {
    form.setValue("prompt", "", { shouldValidate: true });
    setMasterReference([]);
    setProductReference([]);
    if (referenceImageParam) {
      form.setValue(referenceImageParam.id, null);
    }
  }

  return (
    <div className="w-full flex flex-col gap-y-6 p-4">
      {/* Brush Controls - Only show when maskImageParam exists */}
      {maskImageParam && (
        <div className="flex gap-x-4 w-full">
          <div className="flex gap-6 items-center border p-4 rounded-md flex-1">
            <BrushIcon className="text-primary" />
            <div className="flex-1 flex items-center gap-3">
              <Slider
                value={[brushSize]}
                onValueChange={(value) => onBrushSizeChange(value[0])}
                max={100}
                min={5}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-2 items-center rounded-md">
            <TooltipIconButton
              tooltip="Undo"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo size={16} />
            </TooltipIconButton>

            <TooltipIconButton
              tooltip="Redo"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo size={16} />
            </TooltipIconButton>

            <TooltipIconButton
              tooltip="Clear"
              variant="outline"
              size="icon"
              className="size-16"
              onClick={onClear}
            >
              <Eraser size={16} />
            </TooltipIconButton>
          </div>
        </div>
      )}

      {/* Main Input Container - Matching A2iImageInput Layout */}
      <div className="flex flex-col items-stretch w-full mx-auto border resize-none rounded-2xl bottom-8 h-max bg-background scrollbar overflow-hidden pb-4">
        <Form {...form}>
          <div
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)();
            }}
          >
            {/* Textarea with Lock and Clear buttons */}
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative h-full">
                      <Textarea
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.shiftKey) {
                            return;
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                        className={cn(
                          "relative w-full resize-none mt-5 border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-20 max-h-[200px] overflow-y-auto align-top"
                        )}
                        placeholder={getRemixInputPlaceholderMessage({
                          supportsBrush: !!maskImageParam,
                          supportsReferenceImage: !!referenceImageParam,
                        })}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <TooltipButton
                          tooltip="Keep prompt and reference images"
                          icon={
                            isLocked ? (
                              <LockIcon color="#7F55E0" size={20} />
                            ) : (
                              <LockOpenIcon color="#7F55E0" size={20} />
                            )
                          }
                          size="md"
                          className="px-2 py-2"
                          onClick={() => setIsLocked(!isLocked)}
                        />
                        <TooltipButton
                          tooltip="Clear prompt and references"
                          icon={<TrashIcon color="#7F55E0" size={20} />}
                          size="md"
                          className="px-2 py-2"
                          onClick={() => clearPromptAndReferences()}
                        />
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Bottom Controls - Parameters, Model Selector, and Generate Button */}
            <div className="flex gap-2 justify-between items-center px-4">
              <div className="flex items-center gap-2">
                {/* Reference Image Selector - matching A2iImageInput */}
                <ReferenceImageSelector
                  masterReference={masterReference}
                  productReference={productReference}
                  onMasterReferenceChange={setMasterReference}
                  onProductReferenceChange={setProductReference}
                  maxLimit={referenceImageParam?.maxLimit || 0}
                  fileTypes={referenceImageParam?.fileTypes || []}
                  maxFileSizeLimit={referenceImageParam?.maxFileSizeLimit || 0}
                  disabled={form.formState.isSubmitting || !referenceImageParam}
                  currentCampaignId={campaignId}
                  isOpen={isReferencePopoverOpen}
                  onOpenChange={setIsReferencePopoverOpen}
                  activeTab={referencePopoverTab}
                  onTabChange={setReferencePopoverTab}
                  isMagicEnabled={isMagicEnabled}
                  onToggleMagic={handleToggleMagic}
                />

                {/* Initial Parameters */}
                {initialParams.map((param) => {
                  return (
                    <DynamicFormField
                      key={param.id}
                      param={param}
                      form={form}
                      type="initial"
                      rules={selectedRemixModel?.rules}
                      source="remix"
                    />
                  );
                })}

                {/* Advanced Parameters Popover */}
                {advancedParams.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size={"icon"} variant={"outline"}>
                        <Settings2 />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      forceMount
                      align="center"
                      side="top"
                      className="space-y-2 w-64"
                    >
                      <div className="space-y-4">
                        <FormLabel className="py-0 text-xs">
                          Advance Parameters
                        </FormLabel>
                        {advancedParams.map((param) => {
                          return (
                            <DynamicFormField
                              key={param.id}
                              param={param}
                              form={form}
                              type="advanced"
                              rules={selectedRemixModel?.rules}
                              source="remix"
                            />
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Right Side - Model Selector and Generate Button */}
              <div className="flex gap-x-2">
                <ModelSelector
                  onModelChange={(m) => {
                    setSelectedRemixModel(m);
                  }}
                  selectedModel={selectedRemixModel}
                  typeFilter="remix"
                />
                <TokenGenerateButton
                  onClick={() => form.handleSubmit(onSubmit)()}
                  tokens={credits}
                  loading={form.formState.isSubmitting}
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                  isCalculatingTokens={isCalculatingCredits}
                />
              </div>
            </div>

            {/* Reference Zones - Show when there are references */}
            {(masterReference.length > 0 || productReference.length > 0) &&
              !isReferencePopoverOpen && (
                <div className="w-full px-4">
                  <div className="flex gap-4 w-full">
                    {/* MASTER REFERENCE SECTION */}
                    <div className="flex-1">
                      <ReferenceZone
                        type="master"
                        icon={Paperclip}
                        title="Master Reference"
                        description="Use elements of an image. (Drag files or images here)"
                        images={masterReference}
                        isSelected={referencePopoverTab === "master"}
                        onClick={() => openReferencePopover("master")}
                        onDrop={(e: React.DragEvent) =>
                          handleZoneDrop(e, "master")
                        }
                        onDragStart={(e: React.DragEvent, url: string) => {
                          e.dataTransfer.setData("assetUrl", url);
                          e.dataTransfer.setData("source", "master");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onRemoveImage={(url: string) => {
                          setMasterReference(
                            masterReference.filter((u) => u !== url)
                          );
                        }}
                        showAddButton={
                          masterReference.length === 0 &&
                          productReference.length > 0
                        }
                        onAddClick={() => openReferencePopover("master")}
                      />
                    </div>

                    {/* PRODUCT REFERENCE SECTION */}
                    <div className="flex-1">
                      <ReferenceZone
                        type="product"
                        icon={PanelTop}
                        title="Product Reference"
                        description="Use a product image. (Drag files or images here)"
                        images={productReference}
                        isSelected={referencePopoverTab === "product"}
                        onClick={() => openReferencePopover("product")}
                        onDrop={(e: React.DragEvent) =>
                          handleZoneDrop(e, "product")
                        }
                        onDragStart={(e: React.DragEvent, url: string) => {
                          e.dataTransfer.setData("assetUrl", url);
                          e.dataTransfer.setData("source", "product");
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onRemoveImage={(url: string) => {
                          setProductReference(
                            productReference.filter((u) => u !== url)
                          );
                        }}
                        showAddButton={
                          productReference.length === 0 &&
                          masterReference.length > 0
                        }
                        onAddClick={() => openReferencePopover("product")}
                        isMagicEnabled={isMagicEnabled}
                        onToggleMagic={handleToggleMagic}
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RemixControls;
