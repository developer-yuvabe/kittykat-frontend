import { Ripple } from "@/components/magicui/ripple";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadIcon, ExpandIcon } from "@/components/ui/custom-icon";
import { cn, handleDownloadImage } from "@/lib/utils";
import { A2iImageGeneration } from "@/types/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import A2iImageEditFeatures from "./A2iImageEditFeatures";

const A2iImagePlaceholderCard = () => {
  return <div className="border bg-muted min-w-60 aspect-square"> </div>;
};

const A2iImageCard = ({ generation }: { generation: A2iImageGeneration }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEditFeatures, setShowEditFeatures] = useState(false);
  const images = generation.images ?? [];
  const currentImage = images[currentIndex] ?? null;

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleDownload = () => {
    if (currentImage) {
      handleDownloadImage(currentImage.url);
    }
  };

  return (
    <div className="relative border bg-muted min-w-60 aspect-square group">
      {currentImage && (
        <Image
          src={currentImage.url}
          alt={"A2i Image"}
          fill
          className="object-contain"
        />
      )}

      {generation.status !== "completed" && (
        <Ripple
          numCircles={generation.status === "failed" ? 0 : 8}
          mainCircleSize={10}
          className={cn({
            "bg-gradient-to-r from-destructive/30 via-destructive/20 to-destructive/30 animate-none":
              generation.status === "failed",
          })}
        />
      )}

      {generation.status !== "completed" && (
        <div className="flex flex-col items-center justify-center gap-2 h-full px-10">
          {
            <p className="text-sm text-center">
              {generation.parameters.prompt}
            </p>
          }
          {generation.status === "failed" && (
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
        {/* {generation.status !== "processing" && (
          <TooltipIconButton
            tooltip="Delete image"
            variant={"ghost"}
            className="absolute top-2 left-2 text-white hover:text-black"
          >
            <X />
          </TooltipIconButton>
        )} */}

        {/* Top Right */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 flex space-x-2">
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="size-6 p-1 text-white hover:text-black"
            >
              <ChevronLeft />
            </Button>
            <Button
              size={"icon"}
              variant={"ghost"}
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="size-6 p-1 text-white hover:text-black"
            >
              <ChevronRight />
            </Button>
          </div>
        )}

        {/* Bottom Right */}
        {currentImage && (
          <TooltipIconButton
            onClick={handleDownload}
            tooltip="Download"
            variant={"ghost"}
            className="absolute bottom-2 right-2 text-white hover:text-black"
          >
            <DownloadIcon />
          </TooltipIconButton>
        )}

        {/* Bottom Left */}
        {currentImage && (
          <TooltipIconButton
            onClick={() => setShowEditFeatures(true)}
            variant={"ghost"}
            tooltip="Expand"
            className="absolute bottom-2 left-2 text-white hover:text-black"
          >
            <ExpandIcon />
          </TooltipIconButton>
        )}
      </div>

      {showEditFeatures && currentImage && (
        <A2iImageEditFeatures
          image={currentImage}
          onClose={() => setShowEditFeatures(false)}
        />
      )}
    </div>
  );
};

export { A2iImageCard, A2iImagePlaceholderCard };
