import { Ripple } from "@/components/magicui/ripple";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, ExpandIcon } from "@/components/ui/custom-icon";
import { cn, handleDownloadImage } from "@/lib/utils";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import { Check, CopyIcon, HeartIcon, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import A2iImageEditFeatures from "./A2iImageEditFeatures";
import { Button } from "@/components/ui/button";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { toast } from "sonner";
import { deleteA2iImage, toggleA2iImageLike } from "@/services/api/a2i.service";
import { useBrandStore } from "@/store/brand.store";

export type A2iImageCardProps = {
  image: A2iImageDetail | null;
  status: A2iImageGeneration["status"];
  generationId: A2iImageGeneration["id"];
  parameters: A2iImageGeneration["parameters"];
};

const A2iImageCard = ({
  image,
  status,
  parameters,
  generationId,
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
  };

  const handleCopyPrompt = () => {
    if (image && parameters.prompt) {
      navigator.clipboard.writeText(parameters.prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLikeToggle = () => {
    if (image) {
      const prevLikeStatus = isLiked;

      setIsLiked((p) => !p);

      toggleA2iImageLike(
        selectedBrandId!,
        generationId,
        image.id,
        !isLiked
      ).catch((error) => {
        console.error("Error toggling like status:", error);
        toast.error("Could not update like status. Please try again.", {
          position: "bottom-right",
        });

        // Revert the like status if the API call fails
        setIsLiked(prevLikeStatus);
      });
    }
  };

  const handleRemoveImage = async () => {
    setIsDeleting(true);
    try {
      await deleteA2iImage(selectedBrandId!, generationId, image?.id || null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting moodboard:", error);
      toast.error("Could not delete image at the moment. Please try again.", {
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
          {status === "failed" && (
            <Badge className="bg-destructive/40 text-destructive border-destructive text-destructive-foreground">
              Failed
            </Badge>
          )}
        </div>
      )}

      {/* Image Actions */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30"></div>

        {/* Top Left */}
        {status !== "processing" && (
          <TooltipIconButton
            onClick={() => setShowDeleteDialog(true)}
            tooltip="Delete image"
            variant={"ghost"}
            className="absolute top-2 left-2 text-white hover:text-black"
          >
            <X />
          </TooltipIconButton>
        )}

        {/* Top Right */}
        {image && (
          <TooltipIconButton
            onClick={() => setShowEditFeatures(true)}
            tooltip="Go to image editor"
            variant={"ghost"}
            className="absolute top-2 right-2 text-white hover:text-black"
          >
            <ExpandIcon />
          </TooltipIconButton>
        )}

        {/* Bottom Right */}
        {image && (
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
        {image && (
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

      {showEditFeatures && (
        <A2iImageEditFeatures
          image={image!}
          onClose={() => setShowEditFeatures(false)}
        />
      )}

      <ReusableAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete image generation"
        description={`Are you sure you want to delete the image generation? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleRemoveImage}
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
