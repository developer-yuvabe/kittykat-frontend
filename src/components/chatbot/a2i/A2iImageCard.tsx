import { Ripple } from "@/components/magicui/ripple";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExpandIcon } from "@/components/ui/custom-icon";
import { cn, handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import { Check, CopyIcon, HeartIcon, PlayCircle, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import A2iImageEditFeatures from "./A2iImageEditFeatures";
import { Button } from "@/components/ui/button";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { toast } from "sonner";
import { deleteA2iImage, toggleA2iImageLike } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  deleteA2iVideo,
  toggleA2iVideoLike,
} from "@/services/api/video-gen.service";

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
  video,
}: A2iImageCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(image?.is_liked || false);
  const [showEditFeatures, setShowEditFeatures] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedBrandId } = useBrandStore();

  const handleDownload = () => {
    if (image) {
      handleDownloadImage(image.url);
    }
    if (video) {
      handleDownloadVideo(video.url);
    }
  };

  const handleCopyPrompt = () => {
    if ((image || video) && parameters.prompt) {
      navigator.clipboard.writeText(parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // const handleLikeToggle = () => {
  //   if (image) {
  //     const prevLikeStatus = isLiked;

  //     setIsLiked((p) => !p);

  //     toggleA2iImageLike(
  //       selectedBrandId!,
  //       generationId,
  //       image.id,
  //       !isLiked
  //     ).catch((error) => {
  //       console.error("Error toggling like status:", error);
  //       toast.error("Could not update like status. Please try again.", {
  //         position: "bottom-right",
  //       });

  //       // Revert the like status if the API call fails
  //       setIsLiked(prevLikeStatus);
  //     });
  //   }
  // };

  const handleLikeToggle = () => {
    const prevLikeStatus = isLiked;
    setIsLiked((p) => !p);

    const toggleFn = image
      ? () =>
          toggleA2iImageLike(selectedBrandId!, generationId, image.id, !isLiked)
      : video
      ? () => toggleA2iVideoLike(selectedBrandId!, generationId, !isLiked)
      : null;

    if (!toggleFn) return;

    toggleFn().catch((error) => {
      console.error("Error toggling like status:", error);
      toast.error("Could not update like status. Please try again.", {
        position: "bottom-right",
      });
      setIsLiked(prevLikeStatus); // Revert on failure
    });
  };

  // const handleRemoveImage = async () => {
  //   setIsDeleting(true);
  //   try {
  //     await deleteA2iImage(selectedBrandId!, generationId, image?.id || null);
  //     setShowDeleteDialog(false);
  //   } catch (error) {
  //     console.error("Error deleting moodboard:", error);
  //     toast.error("Could not delete image at the moment. Please try again.", {
  //       position: "bottom-right",
  //     });
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const handleRemoveItem = async () => {
    setIsDeleting(true);
    try {
      if (image) {
        await deleteA2iImage(selectedBrandId!, generationId, image.id);
      } else if (video) {
        await deleteA2iVideo(selectedBrandId!, generationId);
      }

      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Could not delete item at the moment. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative border bg-muted min-w-60 aspect-square group">
      {image && (
        <Image
          src={image.url}
          alt={parameters.prompt}
          fill
          className="object-contain"
        />
      )}

      {video && (
        <div className="relative w-full h-full">
          <video
            src={video.url}
            className="object-contain w-full h-full"
            muted
          />

          <Dialog>
            <DialogTrigger asChild>
              <button className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white z-20 hover:scale-105 transition-transform" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-full aspect-video p-0 shadow-md">
              <video
                src={video.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {status !== "completed" && (
        <Ripple
          numCircles={status === "failed" ? 0 : 8}
          mainCircleSize={10}
          className={cn({
            "bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 animate-none":
              status === "failed",
          })}
        />
      )}

      {status !== "completed" && (
        <div className="flex flex-col items-center justify-center gap-2 h-full px-10">
          {<p className="text-sm text-center">{parameters.prompt}</p>}
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
                alt="Model"
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
        </div>
      )}

      {/* Image Actions */}
      {/* {image && ( */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30"></div>

        {/* Top Center */}
        {status === "completed" && (
          <div
            className="w-16 h-1 bg-white rounded-full cursor-grab hover:w-20 transition-all top-2 -translate-x-1/2 left-1/2 absolute"
            {...dragAttributes}
            {...dragListeners}
          />
        )}

        {/* Top Left */}
        {/* {status !== "processing" && (
          <TooltipIconButton
            onClick={() => setShowDeleteDialog(true)}
            tooltip="Delete image"
            variant={"ghost"}
            className="absolute top-2 left-2 text-white hover:text-black"
          >
            <X />
          </TooltipIconButton>
        )} */}

        {(image || video) && status !== "processing" && (
          <TooltipIconButton
            onClick={() => setShowDeleteDialog(true)}
            tooltip={`Delete ${image ? "image" : "video"}`}
            variant={"ghost"}
            className="absolute top-2 left-2 text-white hover:text-black"
          >
            <X />
          </TooltipIconButton>
        )}

        {/* Top Right */}
        {image && (
          <Button
            onClick={() => setShowEditFeatures((prev) => !prev)}
            size={"icon"}
            variant={"ghost"}
            className="absolute top-2 right-2 size-7 text-white hover:text-black"
          >
            <ExpandIcon />
          </Button>
        )}

        {/* Bottom Right */}
        {/* {image && (
          <Button
            onClick={handleLikeToggle}
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
        )} */}
        {(image || video) && (
          <Button
            onClick={handleLikeToggle}
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

        {/* Bottom Left */}
        {(image || video) && (
          <div className="flex items-center gap-x-2 absolute bottom-2 left-2">
            <TooltipIconButton
              onClick={handleDownload}
              tooltip="Download"
              variant={"ghost"}
              className="text-white hover:text-black"
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
      {/* )} */}

      {image && (
        <A2iImageEditFeatures
          image={image}
          open={showEditFeatures}
          onClose={() => setShowEditFeatures(false)}
          parameters={parameters}
        />
      )}

      {/* <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete image generation"
        description={`Are you sure you want to delete the image generation? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleRemoveImage}
        isLoading={isDeleting}
        danger
      /> */}
      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`Delete ${image ? "image" : "video"} generation`}
        description={`Are you sure you want to delete this ${
          image ? "image" : "video"
        } generation? This action cannot be undone.`}
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
  return <div className="border bg-muted min-w-60 aspect-square"> </div>;
};

export { A2iImageCard, A2iImagePlaceholderCard };
