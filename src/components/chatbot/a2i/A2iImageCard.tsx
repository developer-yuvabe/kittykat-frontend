import ImageWithMetadataModal from "@/components/image-metadata/ImageWithMetadataModal";
import { Ripple } from "@/components/magicui/ripple";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon } from "@/components/ui/custom-icon";
import { TooltipButton } from "@/components/ui/tooltip-button";
import VideoWithMetadataModal from "@/components/video-metadata/VideoWithMetadataModal";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import {
  cn,
  convertParameterValue,
  handleDownloadImage,
  handleDownloadVideo,
} from "@/lib/utils";
import { deleteA2iImage } from "@/services/api/a2i.service";
import { retryGeneration } from "@/services/api/genration.service";
import { deleteA2iVideo } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { useConceptVisualStore } from "@/store/concept-visual.store";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import {
  CheckIcon,
  CopyIcon,
  HeartIcon,
  PauseCircle,
  PencilIcon,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import Image from "next/image";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useMetadataActionsStore } from "@/store/metadata-actions.store";
import { useModelsStore } from "@/store/models.store";
import { useBrandUpdatesStore } from "@/store/brand-updates.store";
import { useGenerationsStore } from "@/store/generations.store";
import { useA2iStore } from "@/store/a2i.store";

export type A2iImageCardProps = {
  image: A2iImageDetail | null;
  status: A2iImageGeneration["status"];
  generationId: A2iImageGeneration["id"];
  parameters: A2iImageGeneration["parameters"];
  type: A2iImageGeneration["type"];
  vtonParameters?: A2iImageGeneration["vton_parameters"];
  remixParameters?: A2iImageGeneration["remix_parameters"];
  upscaleParameters?: A2iImageGeneration["upscale_parameters"];
  video?: A2iImageGeneration["video"];
  createdAt: A2iImageGeneration["created_at"];
  updatedAt: A2iImageGeneration["updated_at"];
  dragListeners?: any;
  dragAttributes?: any;
  isDragging?: boolean;
  style?: CSSProperties;
  disableDrag?: boolean;
  isNSFW: boolean;
};

// 🔑 Control size for all overlay buttons
const OVERLAY_CONTROL_SIZE = 5;

const A2iImageCard = ({
  image,
  status,
  parameters,
  type,
  generationId,
  remixParameters,
  upscaleParameters,
  dragListeners,
  dragAttributes,
  vtonParameters,
  isDragging,
  style,
  disableDrag,
  video,
  isNSFW,
}: A2iImageCardProps) => {
  const { data, setData } = useBrandUpdatesStore();
  const { addOptimisticallyDeletedGenerationId } = useGenerationsStore();
  const [copied, setCopied] = useState(false);
  const { openConceptVisual } = useConceptVisualStore();
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { selectedBrandId } = useBrandStore();
  const videoRef = video ? useRef<HTMLVideoElement>(null) : null;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const {
    models,
    setSelectedImageGenerationModel,
    setSelectedVideoGenearationModel,
    setSelectedRemixModel,
  } = useModelsStore();

  const { setParameters } = useMetadataActionsStore();
  const router = useRouter();
  const pathname = usePathname();

  const { setStartFrame, setEndFrame, setBaseImageUrl } = useA2iStore();

  const galleryActions = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    ITEMS_PER_PAGE,
    true,
    "A2iImageCard"
  );

  const id = video?.id ?? image?.id;
  const galleryItem = id ? galleryActions.useGalleryItem(id) : undefined;

  // Memoize the item prop to prevent unnecessary re-renders in MediaEditorDialog
  const stableItem = useMemo(() => {
    if (!galleryItem?.data) return null;
    return {
      ...galleryItem.data,
      // Ensure input_prompt is populated from parameters.prompt if missing
      input_prompt: galleryItem.data.input_prompt || parameters.prompt,
    };
  }, [galleryItem?.data, parameters.prompt]);

  const [isLiked, setIsLiked] = useState(
    galleryItem?.data?.is_favourite || false
  );

  useEffect(() => {
    if (videoRef && videoRef.current) {
      const handlePlayPause = () => {
        if (videoRef.current) {
          setIsVideoPlaying(!videoRef.current.paused);
        }
      };

      videoRef.current.addEventListener("play", handlePlayPause);
      videoRef.current.addEventListener("pause", handlePlayPause);

      return () => {
        videoRef.current?.removeEventListener("play", handlePlayPause);
        videoRef.current?.removeEventListener("pause", handlePlayPause);
      };
    }
  }, [videoRef]);

  const handleDownload = () => {
    if (image) handleDownloadImage(image.url);
    if (video) handleDownloadVideo(video.url);
  };

  const handleCopyPrompt = () => {
    if (parameters.prompt) {
      navigator.clipboard.writeText(parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleRemoveItem = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false); // Close dialog immediately

    const deletePromise = (async () => {
      // Delete the A2I generation first
      if (video) {
        await deleteA2iVideo(selectedBrandId!, generationId);
      } else {
        await deleteA2iImage(selectedBrandId!, generationId, image?.id ?? null);
      }

      // If there's a corresponding gallery item, delete it as well
      const itemId = video?.id ?? image?.id;
      if (itemId && galleryItem?.data) {
        try {
          galleryActions.deleteItem(itemId);
        } catch (galleryError) {
          console.warn(
            "Failed to delete gallery item, but A2I generation was deleted:",
            galleryError
          );
        }
      }
    })();

    if (status !== "failed") {
      toast.promise(deletePromise, {
        loading: "Deleting...",
        success: "Deleted successfully!",
        error: "Could not delete item. Please try again.",
      });

      deletePromise.finally(() => {
        setIsDeleting(false);
      });
    } else {
      // Optimistic deletion for failed items

      setData({
        ...data,
        a2i_image_information: data?.a2i_image_information
          ? {
              ...data.a2i_image_information,
              generations: data.a2i_image_information.generations.filter(
                (gen) => gen.id !== generationId
              ),
            }
          : undefined,
      });

      addOptimisticallyDeletedGenerationId(generationId);
    }
  };

  const handleReUse = async () => {
    try {
      // Video
      const isVideoOutput = type === "video" || type == "video_generation";
      if (isVideoOutput) {
        const model = models.find((m) => m.model === parameters.model);
        if (!model) {
          toast.error("No model found for this video.");
          return;
        }
        // Convert all parameters based on model parameter definitions
        const videoParams = { ...parameters };
        model.parameters?.forEach((paramDef) => {
          const paramId = paramDef.id;
          if (
            videoParams[paramId] !== undefined &&
            videoParams[paramId] !== null
          ) {
            videoParams[paramId] = convertParameterValue(
              videoParams[paramId],
              paramDef
            );
          }
        });

        // Set model and parameters
        setSelectedVideoGenearationModel(model);
        setParameters("videoParameters", videoParams);

        const firstFrameParam = model.parameters?.find(
          (param) => param.type === "first_frame"
        );

        const lastFrameParam = model.parameters?.find(
          (param) => param.type === "last_frame"
        );

        if (firstFrameParam?.id) {
          setStartFrame(videoParams[firstFrameParam.id]);
        }
        if (lastFrameParam?.id) {
          setEndFrame(videoParams[lastFrameParam.id]);
        }

        toast.info("Video setup restored in Video Generation tab.");
        return;
      }

      // Remix Images
      const isEditorOutput = type === "remix";

      if (isEditorOutput) {
        try {
          const model = models.find(
            (m) => m.model === parameters.model && m.type === "remix"
          );
          if (!model) {
            toast.error("No model found for this remix image.");
            return;
          }

          // Validate that base image exists
          const baseInputImageUrl = parameters.base_image || parameters.image;
          if (!baseInputImageUrl) {
            toast.error("Base input not available — cannot reuse this image.");
            return;
          }

          //  Convert all remix parameters based on model definitions
          const convertedRemixParams = { ...parameters };

          model.parameters?.forEach((paramDef) => {
            const id = paramDef.id;
            if (convertedRemixParams[id] !== undefined) {
              convertedRemixParams[id] = convertParameterValue(
                convertedRemixParams[id],
                paramDef
              );
            }
          });

          // Store full parameters for remix
          setSelectedRemixModel(model);
          setParameters("remixParameters", convertedRemixParams);
          if (showImageModal) setShowImageModal(false);

          setBaseImageUrl(
            convertedRemixParams.base_image ||
              convertedRemixParams.image ||
              null
          );

          toast.info("Remix model and parameters have been restored.");
          return;
        } catch (error) {
          console.log(error);
          toast.error(
            "An error occurred while trying to reuse the remix image. Please try again."
          );
          return;
        }
      }

      const model = models.find((m) => m.model === parameters.model);
      if (!model) {
        toast.error("No model found for this image.");
        return;
      }

      setSelectedImageGenerationModel(model);

      const referenceParam = model.parameters.find((p) => p.type === "file");
      const modifiedParameters = { ...parameters };

      if (referenceParam && parameters[referenceParam.id]) {
        modifiedParameters[referenceParam.id] = parameters[referenceParam.id];
      }

      setParameters("imageGeneationParameters", modifiedParameters);

      const productReferenceImages = parameters.product_reference_images || [];
      setParameters(
        "productReferenceImages",
        productReferenceImages.length > 0 ? productReferenceImages : null
      );

      if (pathname !== "/") router.push("/?scrollTo=a2i-input");

      toast.info("Image setup restored in Concept Visual Generator.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to restore setup. Please try again.");
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);

    toast.promise(retryGeneration(generationId, selectedBrandId!), {
      loading: "Retrying generation...",
      success: "Generation retried successfully!",
      error: "Failed to retry generation. Please try again.",
      finally: () => {
        setIsRetrying(false);
      },
    });
  };

  useEffect(() => {
    setIsLiked(galleryItem?.data?.is_favourite || false);
  }, [galleryItem?.data?.is_favourite]);

  const handleItemClick = () => {
    if (image) {
      setShowImageModal(true);
    } else if (video) {
      setShowVideoModal(true);
    }
  };

  return (
    <div
      className={cn(
        "relative border bg-muted min-w-60 aspect-square group transition-all duration-200 ease-in-out",
        isDragging && "scale-[1.03] shadow-xl"
      )}
      style={style}
    >
      {status === "completed" && image && (
        <div
          className="relative w-full h-full cursor-pointer group/image hover:brightness-110 transition-all duration-200 z-10"
          onClick={handleItemClick}
          draggable
          onDragStart={(e) => {
            try {
              e.dataTransfer.setData("assetUrl", image.url);
              e.dataTransfer.setData("source", "a2i");
              // image.id is used in many places as gallery item id
              if (image.id) e.dataTransfer.setData("galleryItemId", image.id);
              e.dataTransfer.effectAllowed = "copy";
            } catch (err) {
              console.warn("drag start dataTransfer failed", err);
            }
          }}
        >
          <Image
            src={image.url}
            alt={parameters.prompt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* Zoom hint */}
        </div>
      )}

      {status === "completed" && video && (
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={() => setShowVideoModal(true)} // Open modal
          title="Click to view metadata"
          draggable
          onDragStart={(e) => {
            try {
              e.dataTransfer.setData("assetUrl", video.url);
              e.dataTransfer.setData("source", "a2i");
              // image.id is used in many places as gallery item id
              if (video.id) e.dataTransfer.setData("galleryItemId", video.id);
              e.dataTransfer.setData("assetType", "video");
              e.dataTransfer.effectAllowed = "copy";
            } catch (err) {
              console.warn("drag start dataTransfer failed", err);
            }
          }}
        >
          <video
            ref={videoRef}
            src={video.url}
            className="object-contain w-full h-full"
            muted
            autoPlay
            loop
          />
          <button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center rounded-full hover:bg-black/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef && videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              }
            }}
          >
            {isVideoPlaying ? (
              <PauseCircle className="w-16 h-16 text-white z-20 hover:scale-105 transition-transform opacity-0 group-hover:opacity-100" />
            ) : (
              <PlayCircle className="w-16 h-16 text-white z-20 hover:scale-105 transition-transform" />
            )}
          </button>
        </div>
      )}

      {status !== "completed" && (
        <>
          <Ripple
            numCircles={status === "failed" ? 0 : 8}
            mainCircleSize={10}
            className={cn({
              "bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 animate-none":
                status === "failed",
            })}
          />
          <div className="flex flex-col items-center justify-center gap-2 h-full px-10">
            <p className="text-sm text-center overflow-hidden text-ellipsis line-clamp-5 max-h-40">
              {status === "enhancing_prompt"
                ? "Enhancing prompt..."
                : parameters.prompt}
            </p>
            {vtonParameters && (
              <div className="flex gap-6">
                <img
                  src={vtonParameters.model_image}
                  alt="Model"
                  className="w-16 h-16 object-cover rounded-md"
                />
                <img
                  src={vtonParameters.product_image}
                  alt="Garment"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}

            {upscaleParameters && (
              <div className="flex gap-6">
                <img
                  src={upscaleParameters.base_image}
                  alt="Base image"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
            {remixParameters && (
              <div className="flex gap-6">
                <img
                  src={remixParameters.base_image || remixParameters.image}
                  alt="Base"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
            {(type == "video_generation" || type == "video") && (
              <div className="flex gap-4">
                {(parameters.first_frame ||
                  parameters.start_image ||
                  parameters.image) && (
                  <img
                    src={
                      parameters.start_image ||
                      parameters.first_frame ||
                      parameters.image
                    }
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
                {(parameters.last_frame || parameters.end_image) && (
                  <img
                    src={parameters.last_frame || parameters.end_image}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
              </div>
            )}
            {status === "failed" && (
              <div className="flex flex-col gap-y-2 items-center">
                <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground">
                  Failed
                </Badge>
              </div>
            )}
            {status === "failed" && isNSFW && (
              <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground absolute bottom-4">
                NSFW detected
              </Badge>
            )}
          </div>
        </>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />

        {status === "completed" && (
          <div
            className={cn(
              "w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute z-30 pointer-events-auto",
              !disableDrag && "opacity-60 hover:opacity-100"
            )}
            {...(dragAttributes || {})}
            {...(dragListeners || {})}
          />
        )}

        {/* Delete Button - Top Right */}
        {status !== "processing" && (
          <div className="absolute top-2 right-2 z-30 pointer-events-auto flex items-center gap-2">
            {status === "failed" &&
              process.env.NEXT_PUBLIC_ENVIRONMENT !== "prod" && (
                <TooltipButton
                  tooltip="Retry generation"
                  size="sm"
                  className={cn(isRetrying && "opacity-50 cursor-not-allowed")}
                  onClick={handleRetry}
                  icon={
                    <RotateCcw
                      size={12}
                      className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                    />
                  }
                />
              )}
            <TooltipButton
              tooltip={`Delete ${
                image ? "image" : video ? "video" : "generation"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (status === "failed") handleRemoveItem();
                else setShowDeleteDialog(true);
              }}
              icon={
                <X
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              }
            />
          </div>
        )}

        {/* Direct Action Icons - Bottom Left */}
        <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 pointer-events-auto">
          {/* Concept Visual Editor — only when image/video exists */}
          {(image || video) && (
            <TooltipButton
              tooltip="Concept Visual Editor"
              onClick={(e) => {
                e.stopPropagation();
                openConceptVisual({
                  source: "concept-visual-media",
                  assetItems: stableItem ? [stableItem] : [],
                  asset: {
                    currentAsset: stableItem!,
                    galleryActions: galleryActions,
                  },
                });
              }}
              icon={
                <PencilIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              }
            />
          )}

          {/*Always show copy prompt button when prompt exists */}
          {parameters.prompt && status !== "processing" && (
            <TooltipButton
              tooltip={copied ? "Copied!" : "Copy Prompt"}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPrompt();
              }}
              icon={
                copied ? (
                  <CheckIcon
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                ) : (
                  <CopyIcon
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                )
              }
            />
          )}
          {/*  Re-Use Icon */}
          {parameters &&
            !upscaleParameters &&
            !vtonParameters &&
            status !== "processing" && ( // hide when still generating
              <TooltipButton
                tooltip="Re-use"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReUse();
                }}
                icon={
                  <RotateCcw
                    className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                  />
                }
              />
            )}
        </div>

        {/* Download and Favorite Buttons - Bottom Right */}
        {(image || video) && (
          <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 pointer-events-auto">
            <TooltipButton
              tooltip="Download"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              icon={
                <DownloadIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              }
            />
            <TooltipButton
              tooltip={isLiked ? "Unlike" : "Like"}
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked((prev) => !prev);
                const id = image?.id || video?.id;
                if (id) {
                  galleryActions.toggleFavorite(id);
                }
              }}
              icon={
                <HeartIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
              }
              isActive={isLiked}
              normalColor="text-white"
              activeColor="text-red-500"
              className="transition-all duration-300"
            />
          </div>
        )}
      </div>

      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete ${image ? "image" : video ? "video" : "generation"}`}
        description={`Are you sure you want to delete this ${
          image ? "image" : video ? "video" : "generation"
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleRemoveItem}
        isLoading={isDeleting}
        danger
      />

      {showImageModal && stableItem && (
        <ImageWithMetadataModal
          isOpen={showImageModal}
          generation={{
            parameters,
            type,
          }}
          galleryItem={stableItem}
          onClose={() => setShowImageModal(false)}
          onDownload={handleDownload}
          onLike={() => {
            setIsLiked((prev) => !prev);
            const id = image?.id;
            if (id) {
              galleryActions.toggleFavorite(id);
            }
          }}
          isLiked={isLiked}
          source="concept-visual-media"
        />
      )}

      {/*  VIDEO MODAL */}
      {showVideoModal && stableItem && (
        <VideoWithMetadataModal
          galleryItem={stableItem}
          generation={{ type, parameters }}
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          onDownload={handleDownload}
          onLike={() => {
            setIsLiked((prev) => !prev);
            const id = video?.id;
            if (id) {
              galleryActions.toggleFavorite(id);
            }
          }}
          isLiked={isLiked}
          source="concept-visual-media"
        />
      )}
    </div>
  );
};

interface A2iImagePlaceholderCardProps {
  loading?: boolean;
}

const A2iImagePlaceholderCard = ({
  loading = false,
}: A2iImagePlaceholderCardProps) => {
  return (
    <div
      className={`border min-w-60 aspect-square  overflow-hidden relative ${
        loading ? "bg-gray-300 animate-pulse" : "bg-muted"
      }`}
    />
  );
};

export { A2iImageCard, A2iImagePlaceholderCard };
