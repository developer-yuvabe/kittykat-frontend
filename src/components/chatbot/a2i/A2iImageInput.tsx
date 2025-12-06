import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { cn, PlatformApiError } from "@/lib/utils";
import { generateImage } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import {
  ImagesIcon,
  Settings2,
  WandSparkles,
  Paperclip,
  PanelTop,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { DragEvent } from "react";
import { z, ZodTypeAny } from "zod";
import { DynamicFormField } from "./DynamicFormField";
import { FileParam, ModelParameter } from "@/types/a2i-media.types";
import { useMutation } from "@tanstack/react-query";
import { enhancePrompt } from "@/services/api/moodboard.service";
import { toast } from "sonner";
import { ThreadA2iImage, ThreadCampaign } from "@/types/types";
import { useModelsStore } from "@/store/models.store";
import { useA2iStore } from "@/store/a2i.store";
import useModelPricing from "@/hooks/useModelPricing";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useA2iForm } from "@/hooks/useA2iForm";
import { useReferenceImagePaste } from "@/hooks/useReferenceImagePaste";
import { useCreditsStore } from "@/store/credits.store";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import TokenGenerateButton from "@/components/shared/TokenGenerateButton";
import ModelSelector from "./ModelSelector";
import { LockIcon, LockOpenIcon, TrashIcon } from "@/components/ui/custom-icon";
import ReferenceImageSelector from "./ReferenceImageSelector";
import { useUserStore } from "@/store/user.store";
import { updateUser } from "@/services/api/user.service";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReferenceZone } from "./ReferenceZone";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import {
  handleReferenceImageDrop,
  validateFiles,
  updateReferencesByZone,
  validateImageUrlsBySize,
} from "@/lib/reference-image.utils";
import { getExtensionFromUrl } from "@/lib/utils";
import { useGalleryQuery } from "@/hooks/useGallery";
import { useReferenceImagesStore } from "@/store/reference-image.store";
import { GalleryItem } from "@/types/gallery.types";
import { Select, SelectTrigger } from "@radix-ui/react-select";

const A2iImageInput = ({
  referenceMoodboardId,
  currentCampaign,
}: {
  referenceMoodboardId: ThreadA2iImage["reference_moodboard_id"];
  currentCampaign: ThreadCampaign | null;
}) => {
  const { parameters, setParameters } = useMetadataActionsStore();
  const { selectedImageGenerationModel, setSelectedImageGenerationModel } =
    useModelsStore();
  const formInstance = useA2iForm({
    formKey: `image-generation`,
    selectedModel: selectedImageGenerationModel,
  });
  const { setShowInsufficientCreditsModal } = useCreditsStore();
  const { credits, isCalculatingCredits: isCalculatingTokens } =
    useModelPricing({
      form: formInstance,
      model: selectedImageGenerationModel,
    });
  const { selectedBrandId } = useBrandStore();
  const { referencePrompt, referencePromptSignal, clearReferencePrompt } =
    useA2iStore();
  const { user, setUser } = useUserStore();
  const [isMagicEnabled, setIsMagicEnabled] = useState(
    user?.user_preferences?.enhance_prompts
  );

  // Add gallery query and store for reference images
  const { bulkUpload, refetchGalleryItems, patchItem } = useGalleryQuery(
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

  const { addItems, addOptimisticItem } = useReferenceImagesStore();

  const { mutate: handleEnhancePrompt, isPending: isEnhancingPrompt } =
    useMutation({
      mutationFn: () =>
        enhancePrompt(
          selectedBrandId!,
          formInstance.getValues("prompt"),
          referenceMoodboardId
        ),
      onSuccess: () => {
        clearReferencePrompt();
      },
    });

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

  const { referenceImagesModelInfo, initialParams, advancedParams } =
    useMemo(() => {
      let fileParam: FileParam | null = null;
      const initialParams: ModelParameter[] = [];
      const advancedParams: ModelParameter[] = [];

      for (const param of selectedImageGenerationModel?.parameters ?? []) {
        if (param.type === "file") {
          fileParam = param as FileParam;
        } else if (param.category === "initial" && param.id !== "prompt") {
          initialParams.push(param);
        } else if (param.category === "advanced") {
          advancedParams.push(param);
        }
      }

      return {
        referenceImagesModelInfo: fileParam,
        initialParams,
        advancedParams,
      };
    }, [selectedImageGenerationModel]);

  const [masterReference, setMasterReference] = useState<string[]>([]);
  const [productReference, setProductReference] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isReferencePopoverOpen, setIsReferencePopoverOpen] = useState(false);
  const [referencePopoverTab, setReferencePopoverTab] = useState<
    "master" | "product"
  >("master");

  const currentImageCount = masterReference.length + productReference.length;

  const openReferencePopover = (tab: "master" | "product") => {
    setReferencePopoverTab(tab);
    setIsReferencePopoverOpen(true);
  };

  function clearPromptAndReferences() {
    formInstance.setValue("prompt", "", { shouldValidate: true });
    setMasterReference([]);
    setProductReference([]);
    clearReferencePrompt();

    // Clear reference image form value if it exists
    if (referenceImagesModelInfo?.id) {
      formInstance.setValue(referenceImagesModelInfo.id, undefined, {
        shouldValidate: true,
      });
    }
  }

  // Handle file uploads from OS drag-and-drop
  const handleFileUpload = useCallback(
    async (
      files: File[],
      targetZone: "master" | "product",
      showToast = true
    ): Promise<string[]> => {
      if (!referenceImagesModelInfo) {
        toast.error("This model doesn't support reference images");
        return [];
      }

      const { fileTypes, maxFileSizeLimit, maxLimit } =
        referenceImagesModelInfo;
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
        if (showToast) {
          const toastPromise = toast.promise(uploadPromise(), {
            loading: `Uploading ${validFiles.length} file(s) to ${targetZone} reference...`,
            success: (data) =>
              `${data.count} file(s) uploaded to ${data.targetZone} reference`,
            error: "Failed to upload files. Please try again.",
          });

          const result = await toastPromise.unwrap();
          return result.successfulUrls;
        } else {
          const result = await uploadPromise();
          return result.successfulUrls;
        }
      } catch (error) {
        console.error("File upload failed:", error);
        return [];
      }
    },
    [
      referenceImagesModelInfo,
      masterReference.length,
      productReference.length,
      selectedBrandId,
      bulkUpload,
      addItems,
    ]
  );

  // Handle drag-and-drop between zones (collapsed state)
  const handleZoneDrop = useCallback(
    async (e: DragEvent, targetZone: "master" | "product") => {
      e.preventDefault();
      e.stopPropagation();

      if (!referenceImagesModelInfo) {
        toast.error("This model doesn't support reference images");
        return;
      }

      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source");
      const galleryItemId = e.dataTransfer.getData("galleryItemId");

      const isInternalA2iDrag =
        source === "a2i" ||
        Boolean(galleryItemId) ||
        (assetUrl &&
          !(e.dataTransfer?.files && e.dataTransfer.files.length > 0));

      if (isInternalA2iDrag) {
        if (!assetUrl) return;

        const result = handleReferenceImageDrop(
          assetUrl,
          source,
          targetZone,
          masterReference,
          productReference,
          referenceImagesModelInfo.maxLimit
        );

        if (result.shouldPrevent) {
          if (result.toastMessage) {
            toast[result.toastMessage.type](result.toastMessage.message);
          }
          return;
        }

        if (result.newMasterReference !== undefined)
          setMasterReference(result.newMasterReference);
        if (result.newProductReference !== undefined)
          setProductReference(result.newProductReference);

        if (result.toastMessage)
          toast[result.toastMessage.type](result.toastMessage.message);

        // Optimistically add the asset to the reference-image store so selectors see it
        try {
          const galleryItemId = e.dataTransfer.getData("galleryItemId");
          addOptimisticItem({
            id: galleryItemId,
            asset_url: assetUrl,
            preview_url: assetUrl,
            brand_id: selectedBrandId!,
          });
          if (galleryItemId) {
            try {
              patchItem({
                itemId: galleryItemId,
                data: { last_accessed_at: new Date().toISOString() },
                revalidateAutofillSuggestions: false,
              });
              await refetchGalleryItems();
            } catch (err) {
              console.warn("patchItem failed after A2I drop", err);
            }
          }
        } catch (err) {
          console.warn("addOptimisticItem or refetch failed", err);
        }

        return;
      }

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
        referenceImagesModelInfo.maxLimit
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
    [
      referenceImagesModelInfo,
      masterReference,
      productReference,
      handleFileUpload,
      addOptimisticItem,
      refetchGalleryItems,
      selectedBrandId,
    ]
  );

  // Use paste hook for handling paste events
  useReferenceImagePaste({
    containerSelector: "#concept-visual-playground",
    handleFileUpload: async (
      files: File[],
      targetZone: "master" | "product"
    ) => {
      const uploadedUrls = await handleFileUpload(files, targetZone, false);
      return uploadedUrls;
    },
    masterReference,
    productReference,
    setMasterReference,
    setProductReference,
    referencePopoverTab,
    showToast: true,
    useDocumentListener: true,
  });

  // Handle drag-and-drop on prompt textarea
  const handlePromptDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!referenceImagesModelInfo) {
        toast.error("This model doesn't support reference images");
        return;
      }

      const assetUrl = e.dataTransfer.getData("assetUrl");
      const source = e.dataTransfer.getData("source");
      const galleryItemId = e.dataTransfer.getData("galleryItemId");

      // If this is an internal A2I drag or contains an assetUrl but no files,
      // handle it as an internal reference add instead of uploading files.
      const isInternalA2iDrag =
        source === "a2i" ||
        Boolean(galleryItemId) ||
        (assetUrl &&
          !(e.dataTransfer?.files && e.dataTransfer.files.length > 0));

      if (isInternalA2iDrag) {
        if (!assetUrl) return;

        const targetZone =
          masterReference.length > 0 || productReference.length > 0
            ? referencePopoverTab
            : "master";

        const result = handleReferenceImageDrop(
          assetUrl,
          source,
          targetZone,
          masterReference,
          productReference,
          referenceImagesModelInfo.maxLimit
        );

        if (result.shouldPrevent) {
          if (result.toastMessage)
            toast[result.toastMessage.type](result.toastMessage.message);
          return;
        }

        if (result.newMasterReference !== undefined)
          setMasterReference(result.newMasterReference);
        if (result.newProductReference !== undefined)
          setProductReference(result.newProductReference);

        // Optimistic add to reference store and refetch metadata
        try {
          addOptimisticItem({
            id: galleryItemId,
            asset_url: assetUrl,
            preview_url: assetUrl,
            brand_id: selectedBrandId!,
          });

          // If we added a real gallery item id, update its last_accessed_at using the gallery id
          if (galleryItemId) {
            try {
              patchItem({
                itemId: galleryItemId,
                data: { last_accessed_at: new Date().toISOString() },
                revalidateAutofillSuggestions: false,
              });
              await refetchGalleryItems();
            } catch (err) {
              console.warn("patchItem failed after A2I prompt drop", err);
            }
          }
        } catch (err) {
          console.warn("failed to add optimistic item for prompt drop", err);
        }

        // Show success toast
        if (result.toastMessage) {
          toast[result.toastMessage.type](result.toastMessage.message);
        }

        return;
      }

      // Get files from drag
      if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) return;

      // Determine target zone based on active tab or default to master
      const targetZone =
        masterReference.length > 0 || productReference.length > 0
          ? referencePopoverTab
          : "master";

      const uploadedUrls = await handleFileUpload(files, targetZone, true);

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
    },
    [
      referenceImagesModelInfo,
      masterReference,
      productReference,
      referencePopoverTab,
      handleFileUpload,
      addOptimisticItem,
      refetchGalleryItems,
      selectedBrandId,
    ]
  );

  const onSubmit = async (data: z.infer<ZodTypeAny>) => {
    try {
      const referenceImages: string[] = [];
      referenceImages.push(...masterReference, ...productReference);

      // Clean up any stale reference image data from the form
      if (referenceImagesModelInfo?.id && data[referenceImagesModelInfo.id]) {
        delete data[referenceImagesModelInfo.id];
      }

      if (referenceImagesModelInfo && referenceImages.length > 0) {
        data[referenceImagesModelInfo.id] =
          referenceImagesModelInfo.maxLimit > 1
            ? referenceImages
            : referenceImages[0];
      }

      if (selectedImageGenerationModel?.prefix) {
        data.prompt = `${selectedImageGenerationModel.prefix} ${data.prompt}`;
      }

      if (selectedImageGenerationModel?.finetune_id) {
        data.finetune_id = selectedImageGenerationModel.finetune_id;
      }

      await generateImage(selectedBrandId!, {
        ...data,
        campaign_id: currentCampaign?.id || null,
        enhance_prompt_for_product:
          isMagicEnabled && productReference.length > 0,
        product_reference_images: productReference,
        team_id: user?.active_team_id,
      });

      if (!isLocked) {
        formInstance.setValue("prompt", "", { shouldValidate: true });
        setMasterReference([]);
        setProductReference([]);
        clearReferencePrompt();

        // Clear reference image form value if it exists
        if (referenceImagesModelInfo?.id) {
          formInstance.setValue(referenceImagesModelInfo.id, undefined, {
            shouldValidate: true,
          });
        }
      }
    } catch (error) {
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }

      toast.error("Failed to generate image. Please try again.");
    }
  };

  useEffect(() => {
    if (referencePrompt) {
      formInstance.setValue("prompt", referencePrompt, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [referencePrompt, formInstance, referencePromptSignal]);

  useEffect(() => {
    if (!referenceImagesModelInfo) {
      if (currentImageCount > 0) {
        toast.info(
          "This model doesn't support reference images. Uploaded images have been removed."
        );
      }
      setMasterReference([]);
      setProductReference([]);
      return;
    }

    const validateAndUpdateReferences = async () => {
      const maxLimit = referenceImagesModelInfo.maxLimit;
      const maxSizeMB = referenceImagesModelInfo.maxFileSizeLimit;

      // First validate size for all existing images
      const allImages = [...masterReference, ...productReference];
      const { validUrls, invalidUrls } = await validateImageUrlsBySize(
        allImages,
        maxSizeMB
      );

      if (invalidUrls.length > 0) {
        toast.info(
          `${invalidUrls.length} image(s) removed (exceeds ${maxSizeMB}MB limit)`
        );
      }

      // Filter master and product references to keep only valid ones
      let validMaster = masterReference.filter((url) =>
        validUrls.includes(url)
      );
      let validProduct = productReference.filter((url) =>
        validUrls.includes(url)
      );

      // Then check count limit
      const validTotalImages = validMaster.length + validProduct.length;
      if (validTotalImages > maxLimit) {
        const masterKeep = validMaster.slice(0, maxLimit);
        const productKeep = validProduct.slice(
          0,
          Math.max(0, maxLimit - masterKeep.length)
        );

        toast.info(
          `This model only supports ${maxLimit} image${
            maxLimit > 1 ? "s" : ""
          }. Extra images have been removed.`
        );

        validMaster = masterKeep;
        validProduct = productKeep;
      }

      // Update state if anything changed
      if (
        validMaster.length !== masterReference.length ||
        validProduct.length !== productReference.length
      ) {
        setMasterReference(validMaster);
        setProductReference(validProduct);

        // Update form value with kept images
        const keptImages = [...validMaster, ...validProduct];
        if (keptImages.length > 0) {
          const value = maxLimit > 1 ? keptImages : keptImages[0];
          formInstance.setValue(referenceImagesModelInfo.id, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          // Clear form value when no images are kept
          formInstance.setValue(referenceImagesModelInfo.id, undefined, {
            shouldValidate: true,
          });
        }
      } else if (validTotalImages === 0) {
        // Clear form value when all reference images are removed
        formInstance.setValue(referenceImagesModelInfo.id, undefined, {
          shouldValidate: true,
        });
      }
    };

    validateAndUpdateReferences();
  }, [
    selectedImageGenerationModel?.id,
    referenceImagesModelInfo,
    masterReference.length,
    productReference.length,
    formInstance,
    currentImageCount,
  ]);

  useEffect(() => {
    if (parameters.imageGeneationParameters) {
      const paramName = referenceImagesModelInfo?.id;

      formInstance.reset({
        ...formInstance.getValues(),
        ...parameters.imageGeneationParameters,
      });

      // Check for reference_images parameter (from advanced prompt generator)
      const referenceImagesParam =
        parameters.imageGeneationParameters.reference_images;

      if (referenceImagesParam) {
        const imagesArray = Array.isArray(referenceImagesParam)
          ? referenceImagesParam
          : [referenceImagesParam];

        // Get product reference images from parameters or stored state
        const productRefImages = parameters.productReferenceImages || [];

        // Categorize images: if product_reference_images exists, use it to split
        if (productRefImages.length > 0) {
          // Images in productRefImages go to productReference
          const productImages = imagesArray.filter((img) =>
            productRefImages.includes(img)
          );
          // Remaining images go to masterReference (context references)
          const masterImages = imagesArray.filter(
            (img) => !productRefImages.includes(img)
          );

          setProductReference(productImages);
          setMasterReference(masterImages);
        } else {
          // If no product_reference_images, assign all to master
          setMasterReference(imagesArray);
          setProductReference([]);
        }
      } else if (paramName && parameters.imageGeneationParameters[paramName]) {
        // Legacy path: handle existing parameter structure
        const referenceImages = parameters.imageGeneationParameters[paramName];
        const imagesArray = Array.isArray(referenceImages)
          ? referenceImages
          : [referenceImages];

        // Get product reference images from parameters or stored state
        const productRefImages = parameters.productReferenceImages || [];

        // Categorize images: if product_reference_images exists, use it to split
        if (productRefImages.length > 0) {
          // Images in productRefImages go to productReference
          const productImages = imagesArray.filter((img) =>
            productRefImages.includes(img)
          );
          // Remaining images go to masterReference
          const masterImages = imagesArray.filter(
            (img) => !productRefImages.includes(img)
          );

          setProductReference(productImages);
          setMasterReference(masterImages);
        } else {
          // If no product_reference_images, assign all to master
          setMasterReference(imagesArray);
          setProductReference([]);
        }
      } else {
        // No reference images in parameters - clear existing references
        setMasterReference([]);
        setProductReference([]);
      }

      formInstance.trigger();
      requestAnimationFrame(() => {
        setParameters("imageGeneationParameters", null);
        setParameters("productReferenceImages", null);
      });
    }

    if (parameters.referenceImage) {
      const referenceImageUrl = parameters.referenceImage;
      setMasterReference([referenceImageUrl]);

      requestAnimationFrame(() => {
        setParameters("referenceImage", null);
      });
    }
  }, [parameters]);

  const value = formInstance.watch("max_images");

  useEffect(() => {
    const total = currentImageCount + value;

    if (total > 15) {
      const newValue = Math.max(1, 15 - currentImageCount);
      formInstance.setValue("max_images", newValue);
      toast.info(
        `The maximum number of images to generate has been adjusted to ${newValue} due to the number of reference images uploaded.`
      );
    }
  }, [currentImageCount, value, formInstance]);

  return (
    <div
      className="flex flex-col items-stretch w-full mx-auto border resize-none rounded-2xl bottom-8 h-max bg-background scrollbar overflow-hidden pb-4"
      id="concept-visual-playground"
    >
      <Form {...formInstance}>
        <div
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            formInstance.handleSubmit(onSubmit)();
          }}
        >
          <FormField
            control={formInstance.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative h-full">
                    <Textarea
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (referencePrompt) {
                          clearReferencePrompt();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) {
                          return;
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          formInstance.handleSubmit(onSubmit)();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={handlePromptDrop}
                      className={cn(
                        "relative w-full resize-none mt-5 border-0 focus-visible:ring-0 shadow-none focus scrollbar px-4 pt-4 h-auto min-h-20 max-h-[200px] overflow-y-auto align-top"
                      )}
                      placeholder="Describe what you want to see ..."
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
          <div className="flex gap-2 justify-between items-center px-4">
            <div className="flex items-center gap-2">
              {referenceImagesModelInfo ? (
                <ReferenceImageSelector
                  masterReference={masterReference}
                  productReference={productReference}
                  onMasterReferenceChange={setMasterReference}
                  onProductReferenceChange={setProductReference}
                  maxLimit={referenceImagesModelInfo.maxLimit}
                  fileTypes={referenceImagesModelInfo.fileTypes}
                  maxFileSizeLimit={referenceImagesModelInfo.maxFileSizeLimit}
                  disabled={formInstance.formState.isSubmitting}
                  currentCampaignId={currentCampaign?.id}
                  isOpen={isReferencePopoverOpen}
                  onOpenChange={setIsReferencePopoverOpen}
                  activeTab={referencePopoverTab}
                  onTabChange={setReferencePopoverTab}
                  isMagicEnabled={isMagicEnabled}
                  onToggleMagic={handleToggleMagic}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size={"icon"} variant={"outline"} disabled={true}>
                        <ImagesIcon />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    This model does not support attaching reference images
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Render other initial params (exclude aspect_ratio and image_count) */}
              {initialParams
                .filter(
                  (param) =>
                    param.type !== "aspect_ratio" &&
                    param.type !== "image_count"
                )
                .map((param) => {
                  return (
                    <DynamicFormField
                      key={param.id}
                      param={param}
                      form={formInstance}
                      type="initial"
                      rules={selectedImageGenerationModel?.rules}
                      allModelParameters={[...initialParams, ...advancedParams]}
                    />
                  );
                })}

              {/* Aspect Ratio - Always show */}
              {(() => {
                const aspectRatioParam =
                  selectedImageGenerationModel?.parameters?.find(
                    (param) => param.type === "aspect_ratio"
                  );

                if (aspectRatioParam) {
                  return (
                    <DynamicFormField
                      key={aspectRatioParam.id}
                      param={aspectRatioParam}
                      form={formInstance}
                      type="initial"
                      rules={selectedImageGenerationModel?.rules}
                      allModelParameters={
                        selectedImageGenerationModel?.parameters
                      }
                    />
                  );
                }

                // No aspect ratio support - show disabled select
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Select disabled>
                          <SelectTrigger className="cursor-not-allowed">
                            <span>1:1</span>
                          </SelectTrigger>
                        </Select>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      This model does not support aspect ratio selection
                    </TooltipContent>
                  </Tooltip>
                );
              })()}

              {/* Image Count - Always show */}
              {(() => {
                const imageCountParam =
                  selectedImageGenerationModel?.parameters?.find(
                    (param) => param.type === "image_count"
                  );

                if (imageCountParam) {
                  return (
                    <DynamicFormField
                      key={imageCountParam.id}
                      param={imageCountParam}
                      form={formInstance}
                      type="initial"
                      rules={selectedImageGenerationModel?.rules}
                      allModelParameters={
                        selectedImageGenerationModel?.parameters
                      }
                    />
                  );
                }

                // No image count support - show disabled button
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          disabled
                          className="cursor-not-allowed"
                        >
                          1x
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      This model does not support no of generations selection
                    </TooltipContent>
                  </Tooltip>
                );
              })()}

              {advancedParams.length > 0 ? (
                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="outline">
                          <Settings2 />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Additional Settings</TooltipContent>
                  </Tooltip>
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
                            form={formInstance}
                            type="advanced"
                            rules={selectedImageGenerationModel?.rules}
                            allModelParameters={[
                              ...initialParams,
                              ...advancedParams,
                            ]}
                          />
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button size={"icon"} variant={"outline"} disabled={true}>
                        <Settings2 />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>No Additional Settings</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex gap-x-2">
              <ModelSelector
                onModelChange={setSelectedImageGenerationModel}
                selectedModel={selectedImageGenerationModel}
                typeFilter="image"
              />
              <Button
                type="button"
                disabled={!formInstance.watch("prompt") || isEnhancingPrompt}
                variant={"outline"}
                className="border-primary text-primary"
                onClick={() => {
                  if (!formInstance.getValues("prompt")) return;
                  handleEnhancePrompt(undefined, {
                    onSuccess: (data) => {
                      formInstance.setValue("prompt", data.prompt, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });

                      toast.success("Prompt enhanced successfully!");
                    },
                    onError: () => {
                      toast.error(
                        "Failed to enhance prompt. Please try again."
                      );
                    },
                  });
                }}
              >
                <WandSparkles />
                {isEnhancingPrompt ? "Enhancing Prompt..." : "Enhance Prompt"}
              </Button>
              <TokenGenerateButton
                onClick={() => formInstance.handleSubmit(onSubmit)()}
                tokens={credits}
                loading={formInstance.formState.isSubmitting}
                disabled={
                  !formInstance.formState.isValid ||
                  formInstance.formState.isSubmitting ||
                  isEnhancingPrompt ||
                  !selectedImageGenerationModel
                }
                isCalculatingTokens={isCalculatingTokens}
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
                      description="Drag, drop, or paste images here"
                      images={masterReference}
                      isSelected={referencePopoverTab === "master"}
                      onClick={() => {
                        setReferencePopoverTab("master");
                        openReferencePopover("master");
                      }}
                      onDrop={(e: DragEvent) => handleZoneDrop(e, "master")}
                      onDragStart={(e: DragEvent, url: string) => {
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
                      description="Drag, drop, or paste images here"
                      images={productReference}
                      isSelected={referencePopoverTab === "product"}
                      onClick={() => {
                        setReferencePopoverTab("product");
                        openReferencePopover("product");
                      }}
                      onDrop={(e: DragEvent) => handleZoneDrop(e, "product")}
                      onDragStart={(e: DragEvent, url: string) => {
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
  );
};

export default A2iImageInput;
