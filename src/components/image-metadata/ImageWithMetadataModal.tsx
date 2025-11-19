import { GalleryItemResponse } from "@/types/gallery.types";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DownloadIcon } from "../ui/custom-icon";
import { CheckIcon, CopyIcon, HeartIcon } from "lucide-react";
import {
  cn,
  getDimensionAndAspectRatioFromParameters,
  PlatformApiError,
  urlToFile,
} from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { generateImage } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import { toast } from "sonner";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { usePathname, useRouter } from "next/navigation";
import { useModelsStore } from "@/store/models.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { upscaleImage } from "@/services/api/upscale.service";
import { videoGenerationService } from "@/services/api/video-gen.service";
import { useDynamicModelSchema } from "@/hooks/useDynamicModelSchema";
import {
  getGalleryImageParameters,
  galleryService,
} from "@/services/api/gallery.service";
import { useQuery } from "@tanstack/react-query";
import ZoomableImage from "../ui/zoomable-image";
import { Spinner } from "../ui/spinner";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { A2iImageGeneration } from "@/types/types";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { remixImageService } from "@/services/api/remix.service";
import { Skeleton } from "../ui/skeleton";

import { useCreditsStore } from "@/store/credits.store";
type ImageWithMetadataModalProps = {
  galleryItem: GalleryItemResponse;
  generation?: {
    type: A2iImageGeneration["type"];
    parameters: A2iImageGeneration["parameters"];
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  source: "concept-visual-media" | "media-gallery";
};

const ImageWithMetadataModal = ({
  isOpen,
  onClose,
  galleryItem,
  onDownload,
  onLike,
  isLiked,
  generation,
  source,
}: ImageWithMetadataModalProps) => {
  const router = useRouter();
  const { setParameters } = useMetadataActionsStore();
  const [currentDisplayItem, setCurrentDisplayItem] =
    useState<GalleryItemResponse>(galleryItem);
  const [loading, setLoading] = useState({
    manualAuto: false,
    varyAuto: false,
    upscaleAuto: false,
    animateDynamic: false,
    animateSmooth: false,
    modifyReference: false,
  });
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const { selectedBrandId, selectedCampaignId } = useBrandStore();
  const { openConceptVisual } = useConceptVisualStore();
  const {
    setSelectedImageGenerationModelByModelId,
    setSelectedImageGenerationModel,
    setSelectedVideoGenearationModel,
    setSelectedRemixModel,
    models,
  } = useModelsStore();
  const { showInsufficientCreditsModal, setShowInsufficientCreditsModal } =
    useCreditsStore();

  // Fetch versions if source is media-gallery
  const { data: versions, isFetching: isFetchingVersions } = useQuery({
    queryKey: ["versions", galleryItem.id],
    queryFn: () => galleryService.getGalleryItemVersions(galleryItem.id),
    enabled: isOpen && source === "media-gallery" && !!galleryItem?.id,
    staleTime: Infinity,
  });

  // Update current display item when versions are fetched
  useEffect(() => {
    if (isFetchingVersions) return;
    if (source === "media-gallery") {
      if (versions && versions.length > 0) {
        // Use the latest version
        setCurrentDisplayItem(versions[versions.length - 1]);
      } else if (versions?.length === 0) {
        // No versions available, use the galleryItem
        setCurrentDisplayItem(galleryItem);
      }
    } else {
      // For concept-visual-media, always use galleryItem
      setCurrentDisplayItem(galleryItem);
    }
  }, [versions, isFetchingVersions, galleryItem, source]);

  const { data, isFetching: isFetchingParams } = useQuery({
    queryKey: [
      "image-parameters",
      currentDisplayItem.brand_id,
      currentDisplayItem.id,
      currentDisplayItem.asset_url,
    ],
    queryFn: () =>
      getGalleryImageParameters(
        currentDisplayItem.brand_id,
        currentDisplayItem.id
      ),
    enabled:
      !generation && currentDisplayItem.asset_source == "showboard-media",
    placeholderData: generation
      ? {
          type: generation.type,
          parameters: generation.parameters,
        }
      : null,
    staleTime: Infinity,
  });

  const isDisabled = !(
    data?.type === "image_generation" ||
    data?.type === "a2i" ||
    data?.type === "remix"
  )
    ? true
    : false;

  const referenceImages = (() => {
    const images: string[] = [];
    const model = models.find((m) => m.model === data?.parameters?.model);

    const referenceImageParam = model?.parameters?.find(
      (param) => param.type === "file"
    );

    // For editor outputs (remix)
    if (data?.type === "remix" && data?.parameters) {
      if (data.parameters.base_image) {
        images.push(data.parameters.base_image);
      }

      if (referenceImageParam) {
        const refImages = data.parameters[referenceImageParam.id];
        if (refImages) {
          const arr = Array.isArray(refImages) ? refImages : [refImages];
          images.push(...arr);
        }
      }
    } else if (data?.parameters) {
      // Image generation mode
      if (referenceImageParam) {
        const refImages = data?.parameters[referenceImageParam.id];
        if (refImages) {
          const arr = Array.isArray(refImages) ? refImages : [refImages];
          images.push(...arr);
        }
      } else {
        // Provider-specific fallback (replicate)
        if (
          data?.parameters?.image &&
          Array.isArray(data.parameters.image) &&
          data?.parameters?.provider === "replicate"
        ) {
          images.push(...data.parameters.image);
        } else if (data?.parameters?.image_prompt) {
          images.push(data.parameters.image_prompt);
        }
      }
    }

    return images.length > 0 ? images : [];
  })();

  const handleCopyPrompt = () => {
    if (data?.parameters.prompt) {
      navigator.clipboard.writeText(data.parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleVaryAuto = async () => {
    if (!data?.parameters) return;

    setLoading((p) => ({ ...p, varyAuto: true }));
    try {
      const model = models.find((m) => m.model === data.parameters.model);
      if (!model) {
        throw new Error("Model not found for variation");
      }

      const paramsResponsibleForVaryingNumberOfOutputs =
        model.parameters.filter((p) => p.type === "image_count");

      if (data?.type === "remix") {
        // Extract base parameters for remix
        const remixParams = {
          ...data.parameters,
          seed: -1,
          ...Object.fromEntries(
            paramsResponsibleForVaryingNumberOfOutputs.map((p) => [p.id, 1])
          ),
        };

        // Extract mask_image
        const maskImageUrl = data.parameters.mask_image || null;

        // Extract product reference images
        const productReferenceImages =
          data.parameters.product_reference_images || [];

        const enhancePromptForProducts =
          data.parameters.enhance_prompt_for_product || false;

        // Call remix service
        await remixImageService(
          selectedBrandId!,
          selectedCampaignId,
          remixParams,
          maskImageUrl,
          productReferenceImages,
          enhancePromptForProducts
        );
      } else {
        //image generation
        await generateImage(selectedBrandId!, {
          ...data.parameters,
          seed: -1,
          ...Object.fromEntries(
            paramsResponsibleForVaryingNumberOfOutputs.map((p) => [p.id, 1])
          ),
          source_asset_id: currentDisplayItem.id,
          // Preserve product_reference_images if they exist
          product_reference_images:
            data.parameters.product_reference_images || undefined,

          campaign_id: selectedCampaignId,
        });
      }

      onClose();
      if (source === "media-gallery") {
        router.push("/?scrollTo=a2i-input");
      }
      toast.info("Started Generation of Auto Vary Image.");
    } catch (error) {
      console.error("Error generating image:", error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }
      toast.error("Error generating a varied image. Please try again.");
    } finally {
      setLoading((p) => ({ ...p, varyAuto: false }));
    }
  };

  const handleVaryManual = async () => {
    try {
      setLoading((p) => ({ ...p, manualAuto: true }));
      if (!data?.parameters) return;

      if (data?.type === "remix") {
        const model = models.find(
          (m) => m.model === data.parameters.model && m.type === "remix"
        );

        if (!model) {
          toast.error("No model found for this image.");
          return;
        }
        // Validate that base image exists
        const baseInputImageUrl =
          data.parameters.base_image || data.parameters.image;
        if (!baseInputImageUrl) {
          toast.error("Base input not available—cannot vary this image.");
          return;
        }

        // Set the remix model
        setSelectedRemixModel(model);

        // Store full parameters for remix tab
        setParameters("remixParameters", data.parameters);

        onClose();
        console.log(data.parameters);
        console.log("base input", baseInputImageUrl);

        // asset object with base_image URL
        const baseImageAsset = {
          ...galleryItem,
          asset_url: baseInputImageUrl,
          preview_url: baseInputImageUrl,
        };

        // Open concept visual with base image loaded in canvas
        openConceptVisual({
          source: "blanket",
          assetItems: [baseImageAsset],
          asset: {
            currentAsset: baseImageAsset,
            galleryActions: null,
          },
          defaultActiveTab: "remix",
        });
        return;
      } else {
        const model = models.find(
          (m) => m.model === data.parameters.model && m.type === "image"
        );

        if (!model) {
          toast.error("No model found for this image.");
          return;
        }
        // Regular image generation workflow
        setSelectedImageGenerationModel(model);

        const parameters = data.parameters;
        const productReferenceImages =
          parameters.product_reference_images || [];

        // Get reference images parameter ID
        const referneceImagesParamId = model.parameters.find(
          (p) => p.type === "file"
        );

        let modifiedParameters = { ...parameters };

        // Instead of re-uploading, we reuse the existing URLs directly
        // This maintains the connection with gallery items
        if (referneceImagesParamId && parameters[referneceImagesParamId.id]) {
          const refImageOrImages = parameters[referneceImagesParamId.id];

          // Keep the reference images as-is (don't re-upload)
          modifiedParameters = {
            ...modifiedParameters,
            [referneceImagesParamId.id]: refImageOrImages,
          };
        }

        setParameters("imageGeneationParameters", modifiedParameters);

        // Set product reference images separately to maintain categorization
        if (productReferenceImages && productReferenceImages.length > 0) {
          setParameters("productReferenceImages", productReferenceImages);
        } else {
          setParameters("productReferenceImages", null);
        }

        onClose();

        // Only navigate to home page if not already there
        if (pathname !== "/") {
          router.push("/?scrollTo=a2i-input");
        }
        toast.info("Pre Selected Model and its parameters have been set.");
      }
    } catch (error) {
      console.log(error);
      toast.error(
        "An error occurred while trying to vary the image. Please try again."
      );
    } finally {
      setLoading((p) => ({ ...p, manualAuto: false }));
    }
  };

  const handleUpscaleManual = () => {
    onClose();
    openConceptVisual({
      source: "blanket",
      assetItems: [currentDisplayItem],
      asset: {
        currentAsset: currentDisplayItem,
        galleryActions: null,
      },
      defaultActiveTab: "upscaler",
    });
  };

  const handleUpscaleAuto = async () => {
    setLoading((p) => ({ ...p, upscaleAuto: true }));
    try {
      await upscaleImage(
        selectedBrandId!,
        {
          image_url: galleryItem.asset_url,
          creativity: 0,
          scale_factor: "2x",
          optimized_for: "standard",
          hdr: 0,
          resemblance: 0,
          fractality: 0,
          engine: "automatic",
          prompt: "",
          source_asset_id: currentDisplayItem.id,
        },
        selectedCampaignId
      );

      onClose();
      if (source === "media-gallery") {
        router.push("/?scrollTo=a2i-input");
      }
      toast.info("Started Upscaling of the Image.");
    } catch (error) {
      console.error("Error upscaling the image:", error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }
      toast.error("Error upscaling the image. Please try again.");
    } finally {
      setLoading((p) => ({ ...p, upscaleAuto: false }));
    }
  };

  const handleModifyEdit = () => {
    try {
      const defualtEditModel = models.find((model) => model.default_edit_model);

      if (!defualtEditModel) {
        throw new Error("No default edit model found");
      }

      setSelectedRemixModel(defualtEditModel);
      openConceptVisual({
        source: "blanket",
        assetItems: [currentDisplayItem],
        asset: {
          currentAsset: currentDisplayItem,
          galleryActions: null,
        },
        defaultActiveTab: "remix",
      });

      onClose();
    } catch (error) {
      console.log(error);
      toast.error(
        "An error occurred while trying to edit the image. Please try again."
      );
    }
  };

  const handleModifyReference = async () => {
    try {
      setLoading((p) => ({ ...p, modifyReference: true }));
      const model = models.find((m) => m.model === data?.parameters?.model);

      // Check whether the model supports reference images
      const fileParam = model
        ? model.parameters.find((p) => p.type === "file")
        : null;
      let imageReferenceModelId;

      if (!fileParam || isDisabled || !model) {
        const defaultImageReferenceModel = models.find(
          (m) => m.default_image_reference_model
        );

        imageReferenceModelId = defaultImageReferenceModel?.model;
      } else {
        imageReferenceModelId = model.model;
      }

      if (!imageReferenceModelId) {
        throw new Error("No model found that supports reference images");
      }

      setSelectedImageGenerationModelByModelId(imageReferenceModelId);

      // It is necessary to upload the image to our GCS bucket because the image URL might be deleted.
      const file = await urlToFile(galleryItem.asset_url);
      const url = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "brands",
        file,
        selectedBrandId
      );

      setParameters("referenceImage", url);

      onClose();

      // Only navigate to home page if not already there
      if (pathname !== "/") {
        router.push("/?scrollTo=a2i-input");
      }

      toast.info("Pre Selected Model and Reference Image have been set.");
    } catch (error) {
      console.log(error);
      toast.error(
        "An error occurred while trying to edit the image. Please try again."
      );
    } finally {
      setLoading((p) => ({ ...p, modifyReference: false }));
    }
  };

  const handleAnimateManual = () => {
    try {
      const defaultAnimationModel = models.find(
        (model) => model.default_animation_model
      );

      if (!defaultAnimationModel) {
        throw new Error("No default animation model found");
      }

      setSelectedVideoGenearationModel(defaultAnimationModel);
      openConceptVisual({
        source: "blanket",
        assetItems: [currentDisplayItem],
        asset: {
          currentAsset: currentDisplayItem,
          galleryActions: null,
        },
        defaultActiveTab: "video-generation",
      });

      onClose();
    } catch (error) {
      console.log(error);
      toast.error(
        "An error occurred while trying to animate the image. Please try again."
      );
    }
  };

  const handleAnimatePreset = async (preset: "dynamic" | "smooth") => {
    setLoading((p) => ({
      ...p,
      animateDynamic: preset === "dynamic" ? true : p.animateDynamic,
      animateSmooth: preset === "smooth" ? true : p.animateSmooth,
    }));
    try {
      const defaultAnimationModel = models.find(
        (model) => model.default_animation_model
      );

      if (!defaultAnimationModel) {
        throw new Error("No default animation model found");
      }
      const { defaultValues } = useDynamicModelSchema(defaultAnimationModel);
      await videoGenerationService(selectedBrandId!, {
        ...defaultValues,
        first_frame: currentDisplayItem.asset_url,
        prompt: data?.parameters?.prompt,
        model: defaultAnimationModel.model,
        source_asset_id: currentDisplayItem.id,
        campaign_id: selectedCampaignId,
        preset: preset,
      });

      onClose();
      if (source === "media-gallery") {
        router.push("/?scrollTo=a2i-input");
      }

      toast.info(`Started Video Generation with ${preset} Animation.`);
    } catch (error) {
      console.error("Error animating the image:", error);
      if (error instanceof PlatformApiError && error.statusCode === 403) {
        setShowInsufficientCreditsModal(true);
        return;
      }
      toast.error("Error animating the image. Please try again.");
    } finally {
      setLoading((p) => ({
        ...p,
        animateDynamic: preset === "dynamic" ? false : p.animateDynamic,
        animateSmooth: preset === "smooth" ? false : p.animateSmooth,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader className="sr-only">
        <DialogTitle>Expanded Image</DialogTitle>
        <DialogDescription>
          {data?.parameters?.prompt ??
            currentDisplayItem.input_prompt ??
            "No description available"}
        </DialogDescription>
      </DialogHeader>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none flex items-center justify-center focus:outline-none"
        onPointerDownOutside={(e) => {
          if (showInsufficientCreditsModal)
            e.preventDefault(); // revent outside click while credits modal open
          else onClose();
        }}
        onEscapeKeyDown={(e) => {
          if (showInsufficientCreditsModal)
            e.preventDefault(); // prevent esc close while credits modal open
          else onClose();
        }}
        hideCloseIcon
        overflowClassName="bg-black/80"
      >
        {source === "media-gallery" && isFetchingVersions ? (
          // Loading state while fetching versions
          <div className="flex justify-center items-stretch flex-1 min-w-[80dvw] min-h-[80dvh] max-w-[80dvw] max-h-[80dvh]">
            <div className="relative rounded-l-lg flex items-center justify-center w-[70%] bg-muted border-r">
              <Skeleton className="w-full h-full rounded-l-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="size-12 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-r-lg bg-background h-auto w-[30%] p-4 flex flex-col gap-y-4 overflow-y-auto">
              <div className="flex items-center justify-center flex-col gap-2 h-full">
                <Spinner className="size-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-stretch flex-1 min-w-[80dvw] min-h-[80dvh] max-w-[80dvw] max-h-[80dvh]">
            <div className="relative rounded-l-lg group flex items-center justify-center w-[70%] overflow-hidden bg-white border-r">
              <img
                src={currentDisplayItem.asset_url}
                alt={
                  data?.parameters?.prompt ??
                  currentDisplayItem.input_prompt ??
                  "Expanded image"
                }
                className="w-full h-full object-contain relative z-10"
              />
              <div
                className="absolute inset-0 bg-cover bg-center blur-lg scale-105 z-0"
                style={{
                  backgroundImage: `url(${currentDisplayItem.asset_url}`,
                }}
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-l-lg" />

                {/* Bottom Right - Actions (Download + Like) */}
                {(onDownload || onLike) && (
                  <div className="absolute bottom-2 right-3 flex items-center space-x-2">
                    {onDownload && (
                      <TooltipButton
                        tooltip="Download"
                        icon={<DownloadIcon className="!w-5 !h-5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload();
                        }}
                        className="text-white"
                      />
                    )}

                    {onLike && (
                      <TooltipButton
                        tooltip="Like"
                        icon={
                          <HeartIcon
                            className={cn("!w-5 !h-5", {
                              "text-red-500 fill-red-500": isLiked,
                            })}
                          />
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike();
                        }}
                        isActive={isLiked}
                        normalColor="text-white hover:text-red-500"
                        activeColor="text-red-500"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-r-lg bg-background h-auto w-[30%] p-4 flex flex-col gap-y-4 overflow-y-auto">
              {isFetchingParams ? (
                // Loading State
                <div className="flex items-center justify-center flex-col gap-2 h-full">
                  <Spinner className="size-8 text-muted-foreground" />
                </div>
              ) : (
                <>
                  {data?.parameters && (
                    <>
                      {/* Prompt */}
                      {data.parameters.prompt && (
                        <div className="space-y-2">
                          <p>Prompt</p>
                          <div className="relative">
                            <Textarea
                              value={data.parameters.prompt}
                              className="h-40 lg:h-60 focus:outline-none resize-none"
                              readOnly
                            />
                            <TooltipButton
                              className="absolute top-2 right-2 text-muted-foreground"
                              tooltip={copied ? "Copied!" : "Copy Prompt"}
                              onClick={handleCopyPrompt}
                              icon={
                                copied ? (
                                  <CheckIcon
                                    size={14}
                                    className="text-muted-foreground"
                                  />
                                ) : (
                                  <CopyIcon
                                    size={14}
                                    className="text-muted-foreground"
                                  />
                                )
                              }
                            />
                          </div>
                        </div>
                      )}
                      {referenceImages?.length > 0 && (
                        <div>
                          <p>Reference Image(s)</p>
                          <div className="mt-2 w-full overflow-x-auto">
                            <div className="flex flex-row gap-x-2 w-max">
                              {referenceImages?.map(
                                (img: string, idx: number) => (
                                  <ZoomableImage
                                    key={idx}
                                    src={img}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer flex-shrink-0"
                                    variant="default"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-muted-foreground">
                        {data.parameters.model}
                        {getDimensionAndAspectRatioFromParameters(
                          data.parameters
                        )}
                      </p>
                    </>
                  )}

                  {/* Metadata Action Buttons (always visible) */}
                  <div className="space-y-4 mt-4">
                    <h2 className="text-lg border-b pb-2">Creative Actions</h2>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="w-24">Vary</p>
                        <div className="flex flex-1 gap-x-2 items-start">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                asChild
                                className="disabled:pointer-events-auto"
                              >
                                <Button
                                  onClick={
                                    !isDisabled ? handleVaryAuto : undefined
                                  }
                                  disabled={isDisabled || loading.varyAuto}
                                  loading={!isDisabled && loading.varyAuto}
                                  className={isDisabled ? "opacity-50" : ""}
                                >
                                  Auto
                                </Button>
                              </TooltipTrigger>

                              {isDisabled && (
                                <TooltipContent className="w-40">
                                  The variation feature is available exclusively
                                  for images produced using image generation
                                  models.
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                asChild
                                className="disabled:pointer-events-auto"
                              >
                                <Button
                                  onClick={
                                    !isDisabled ? handleVaryManual : undefined
                                  }
                                  loading={loading.manualAuto}
                                  disabled={isDisabled || loading.manualAuto}
                                  className={isDisabled ? "opacity-50" : ""}
                                >
                                  Manual
                                </Button>
                              </TooltipTrigger>

                              {isDisabled && (
                                <TooltipContent className="w-40">
                                  The variation feature is available exclusively
                                  for images produced using image generation
                                  models.
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="w-24">Upscale</p>
                        <div className="flex flex-1 gap-2 items-start flex-wrap">
                          <Button
                            disabled={loading.upscaleAuto}
                            loading={loading.upscaleAuto}
                            onClick={handleUpscaleAuto}
                          >
                            Auto
                          </Button>
                          <Button onClick={handleUpscaleManual}>Manual</Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="w-24">Modify</p>
                        <div className="flex flex-1 gap-2 items-start flex-wrap">
                          <Button onClick={handleModifyEdit}>Edit</Button>
                          <Button
                            onClick={handleModifyReference}
                            loading={loading.modifyReference}
                            disabled={loading.modifyReference}
                          >
                            Reference
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="w-24">Animate</p>
                        <div className="flex flex-1 gap-2 items-start flex-wrap">
                          <Button
                            onClick={() => handleAnimatePreset("dynamic")}
                            disabled={loading.animateDynamic}
                            loading={loading.animateDynamic}
                          >
                            Dynamic
                          </Button>
                          <Button
                            onClick={() => handleAnimatePreset("smooth")}
                            disabled={loading.animateSmooth}
                            loading={loading.animateSmooth}
                          >
                            Smooth
                          </Button>
                          <Button onClick={handleAnimateManual}>Manual</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageWithMetadataModal;
