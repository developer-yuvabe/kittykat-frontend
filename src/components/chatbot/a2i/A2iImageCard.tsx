import { MediaEditorDialog } from "@/app/(main)/gallery/_components/MediaEditorDialog";
import { Ripple } from "@/components/magicui/ripple";
import { ImageModal } from "@/components/shared/ImageModal";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon } from "@/components/ui/custom-icon";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { cn, handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { deleteA2iImage } from "@/services/api/a2i.service";
import { retryGeneration } from "@/services/api/genration.service";
import { deleteA2iVideo } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import {
  A2iImageDetail,
  A2iImageGeneration,
  ThreadDetails,
} from "@/types/types";
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
  dragListeners?: any;
  dragAttributes?: any;
  isDragging?: boolean;
  style?: CSSProperties;
  disableDrag?: boolean;
  isNSFW: boolean;
  campaignInformation: ThreadDetails["campaign_information"];
  selectedCampaignIndex: number;
};

// 🔑 Control size for all overlay buttons
const OVERLAY_CONTROL_SIZE = 5;

const A2iImageCard = ({
  image,
  status,
  parameters,
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
  campaignInformation,
  selectedCampaignIndex,
}: A2iImageCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [showEditFeatures, setShowEditFeatures] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { selectedBrandId } = useBrandStore();
  const videoRef = video ? useRef<HTMLVideoElement>(null) : null;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const currentCampaign = useMemo(
    () =>
      campaignInformation && campaignInformation[selectedCampaignIndex]
        ? campaignInformation[selectedCampaignIndex]
        : null,
    [campaignInformation, selectedCampaignIndex]
  );

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
    if ((image || video) && parameters.prompt) {
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

    toast.promise(deletePromise, {
      loading: "Deleting...",
      success: "Deleted successfully!",
      error: "Could not delete item. Please try again.",
    });

    deletePromise.finally(() => {
      setIsDeleting(false);
    });
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
    }
  };

  const handleVideoClick = () => {
    if (videoRef && videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
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
      {image && (
        <div
          className="relative w-full h-full cursor-pointer group/image hover:brightness-110 transition-all duration-200 z-10"
          onClick={handleItemClick}
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

      {video && (
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={handleVideoClick}
          title="Click to fullscreen"
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
              {parameters.prompt}
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
                  src={remixParameters.base_image}
                  alt="Base"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
            {(video || parameters.start_image || parameters.first_frame) && (
              <div className="flex gap-4">
                <img
                  src={parameters.start_image || parameters.first_frame}
                  className="w-16 h-16 object-cover rounded-md"
                />
                {parameters.last_frame && (
                  <img
                    src={parameters.last_frame}
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

        {status === "completed" && !showEditFeatures && (
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
            {status === "failed" && (
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
                setShowDeleteDialog(true);
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
        {(image || video) && (
          <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 pointer-events-auto">
            {/* Concept Visual Editor (Pen) Icon */}
            <TooltipButton
              tooltip="Concept Visual Editor"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditFeatures((prev) => !prev);
              }}
              icon={
                <PencilIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              }
            />

            {/* Copy Prompt Icon */}
            {parameters.prompt && (
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
          </div>
        )}

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
              normalColor="text-white hover:text-red-300"
              activeColor="text-red-500"
              className="transition-all duration-300"
            />
          </div>
        )}
      </div>

      {galleryItem?.data && !galleryItem.isFetching && (
        <MediaEditorDialog
          galleryActions={galleryActions}
          item={{
            ...galleryItem.data,
            // Ensure input_prompt is populated from parameters.prompt if missing
            input_prompt: galleryItem.data.input_prompt || parameters.prompt,
          }}
          open={showEditFeatures}
          onOpenChange={setShowEditFeatures}
          totalItems={1}
          currentIndex={0}
          campaignId={currentCampaign?.id || null}
        />
      )}

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

      {image && (
        <ImageModal
          imageUrl={image.url}
          alt={parameters.prompt}
          isOpen={showImageModal}
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
        />
      )}
    </div>
  );
};

const A2iImagePlaceholderCard = () => {
  return <div className="border bg-muted min-w-60 aspect-square" />;
};

export { A2iImageCard, A2iImagePlaceholderCard };
