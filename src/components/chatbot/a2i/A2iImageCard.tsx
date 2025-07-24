import { Ripple } from "@/components/magicui/ripple";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExpandIcon } from "@/components/ui/custom-icon";
import { cn, handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import {
  Check,
  CopyIcon,
  HeartIcon,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { toast } from "sonner";
import { deleteA2iImage } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import { CSSProperties } from "react";
import { deleteA2iVideo } from "@/services/api/video-gen.service";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import { MediaEditorDialog } from "@/app/(main)/gallery/_components/MediaEditorDialog";

export type A2iImageCardProps = {
  image: A2iImageDetail | null;
  status: A2iImageGeneration["status"];
  generationId: A2iImageGeneration["id"];
  parameters: A2iImageGeneration["parameters"];
  type: A2iImageGeneration["type"];
  vtonParameters?: A2iImageGeneration["vton_parameters"];
  remixParameters?: A2iImageGeneration["remix_parameters"];
  video?: A2iImageGeneration["video"];
  dragListeners?: any;
  dragAttributes?: any;
  isDragging?: boolean;
  style?: CSSProperties;
  disableDrag?: boolean;
  isNSFW: boolean;
};

const A2iImageCard = ({
  image,
  status,
  parameters,
  generationId,
  remixParameters,
  dragListeners,
  dragAttributes,
  vtonParameters,
  isDragging,
  style,
  disableDrag,
  video,
  isNSFW,
}: A2iImageCardProps) => {
  const [copied, setCopied] = useState(false);

  const [showEditFeatures, setShowEditFeatures] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedBrandId } = useBrandStore();
  const videoRef = video ? useRef<HTMLVideoElement>(null) : null;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

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
    try {
      if (video) {
        await deleteA2iVideo(selectedBrandId!, generationId);
      } else {
        await deleteA2iImage(selectedBrandId!, generationId, image?.id ?? null);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Could not delete image at the moment. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setIsLiked(galleryItem?.data?.is_favourite || false);
  }, [galleryItem?.data?.is_favourite]);

  return (
    <div
      className={cn(
        "relative border bg-muted min-w-60 aspect-square group transition-all duration-200 ease-in-out",
        isDragging && "scale-[1.03] shadow-xl"
      )}
      style={style}
    >
      {image && (
        <Image
          src={image.url}
          alt={parameters.prompt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      )}

      {video && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={video.url}
            className="object-contain w-full h-full"
            muted
            autoPlay
            loop
          />
          <button
            className="absolute inset-0 flex items-center justify-center"
            onClick={() => {
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
            {remixParameters && (
              <div className="flex gap-6">
                <img
                  src={remixParameters.base_image}
                  alt="Base"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
            {video && (
              <div className="flex gap-6">
                <img
                  src={video.url}
                  alt="Video"
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
            {status === "failed" && (
              <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground">
                Failed
              </Badge>
            )}
            {status === "failed" && isNSFW && (
              <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground absolute bottom-4">
                NSFW detected
              </Badge>
            )}
          </div>
        </>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />

        {status === "completed" && !showEditFeatures && (
          <div
            className={cn(
              "w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute",
              !disableDrag && "opacity-60 hover:opacity-100"
            )}
            {...(dragAttributes || {})}
            {...(dragListeners || {})}
          />
        )}

        {status !== "processing" && (
          <TooltipIconButton
            onClick={() => setShowDeleteDialog(true)}
            tooltip={`Delete ${
              image ? "image" : video ? "video" : "generation"
            }`}
            variant={"ghost"}
            className="absolute top-2 left-2 text-white hover:text-black"
          >
            <X />
          </TooltipIconButton>
        )}

        {(image || video) && (
          <Button
            onClick={() => {
              setShowEditFeatures((prev) => !prev);
            }}
            size={"icon"}
            variant={"ghost"}
            className="absolute top-2 right-2 size-7 text-white hover:text-black"
          >
            <ExpandIcon />
          </Button>
        )}

        {(image || video) && (
          <Button
            onClick={() => {
              setIsLiked((prev) => !prev);
              const id = image?.id || video?.id;
              if (id) {
                galleryActions.toggleFavorite(id);
              }
            }}
            size={"icon"}
            variant={"ghost"}
            className="hover:bg-transparent absolute bottom-2 right-2 size-7 hover:text-current"
          >
            <HeartIcon
              className={cn("text-white", {
                "text-red-500 fill-red-500": isLiked,
              })}
            />
          </Button>
        )}

        {(image || video) && (
          <div className="flex items-center gap-x-2 absolute bottom-2 left-2">
            <TooltipIconButton
              onClick={handleDownload}
              tooltip="Download"
              variant={"ghost"}
              className="text-white hover:text-black size-7"
            >
              <DownloadIcon />
            </TooltipIconButton>
            {parameters.prompt && (
              <TooltipIconButton
                onClick={handleCopyPrompt}
                tooltip="Copy prompt"
                variant={"ghost"}
                className="text-white hover:text-black"
              >
                {copied ? <Check /> : <CopyIcon />}
              </TooltipIconButton>
            )}
          </div>
        )}
      </div>

      {galleryItem?.data && !galleryItem.isFetching && (
        <MediaEditorDialog
          galleryActions={galleryActions}
          item={galleryItem.data}
          open={showEditFeatures}
          onOpenChange={setShowEditFeatures}
          totalItems={1}
          currentIndex={0}
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
    </div>
  );
};

const A2iImagePlaceholderCard = () => {
  return <div className="border bg-muted min-w-60 aspect-square" />;
};

export { A2iImageCard, A2iImagePlaceholderCard };
