"use client";

import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import { ShirtIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import VirtualTryOn from "./features/VirtualTryOn";
import RemixControls from "./features/RemixControls";
import { BrushIcon, VideoRecorderIcon } from "@/components/ui/custom-icon";
import VideoGeneration from "./features/VideoGeneration";
import { cn } from "@/lib/utils";
import RemixImage, {
  RemixImageHandle,
} from "@/app/(main)/_components/remix/RemixImage";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";

const FEATURES = [
  {
    name: "Virtual Try-On",
    icon: ShirtIcon,
  },
  {
    name: "In-Paint Editing",
    icon: BrushIcon,
  },
  {
    name: "Video Generation",
    icon: VideoRecorderIcon,
  },
];

const A2iImageEditFeatures = ({
  image,
  parameters,
  onClose,
  open,
}: {
  open: boolean;
  image: A2iImageDetail;
  parameters: A2iImageGeneration["parameters"];
  onClose: () => void;
}) => {
  const [currentFeature, setCurrentFeature] = React.useState(FEATURES[0]);
  const isRemixEnabled = currentFeature.name === "In-Paint Editing";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="p-4 h-[100dvh] w-[100dvw] max-w-[100dvw]! min-w-full rounded-none shadow-xl overflow-hidden flex flex-col justify-between"
        hideCloseIcon
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2">
            <DialogTitle>A2i Image Tools </DialogTitle>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="icon" onClick={() => onClose()}>
                <X />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-full flex gap-x-4">
          <div className="w-[40%] h-full flex items-center justify-center">
            {isRemixEnabled ? (
              <RemixImage
                ref={remixImageRef}
                imageRef={imageRef}
                canvasRef={canvasRef}
                offScreenCanvasRef={offScreenCanvasRef}
                url={image.url}
                remixHistory={remixHistory}
              />
            ) : (
              <img
                src={image.url}
                alt={parameters.prompt}
                className="block max-h-[85vh] object-contain w-max"
              />
            )}
          </div>
          <div className="w-[60%] h-full flex flex-col">
            <div className="flex w-full h-max">
              {FEATURES.map((feature) => {
                return (
                  <button
                    onClick={() => setCurrentFeature(feature)}
                    key={feature.name}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-2 p-4 text-muted-foreground bg-muted cursor-pointer transition-colors border-b-4 hover:bg-primary/10 hover:border-primary",
                      {
                        "text-primary border-b-4 border-primary bg-primary/20":
                          currentFeature.name === feature.name,
                      }
                    )}
                  >
                    <feature.icon className="w-6 h-6" />
                    <span className="text-lg font-semibold">
                      {feature.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="overflow-y-auto p-4 h-full">
              {currentFeature.name === "Virtual Try-On" && (
                <VirtualTryOn productImage={image.url} closeDialog={onClose} />
              )}
              {currentFeature.name === "In-Paint Editing" && (
                <RemixControls
                  image={{ url: image.url, size: parameters.size }}
                  closeDialog={() => onClose()}
                  canUndo={remixHistory.canUndo}
                  canRedo={remixHistory.canRedo}
                  onUndo={() => remixImageRef.current?.undo()}
                  onRedo={() => remixImageRef.current?.redo()}
                  onClear={() => remixImageRef.current?.clearCanvas()}
                  offScreenCanvasRef={offScreenCanvasRef}
                />
              )}

              {currentFeature.name === "Video Generation" && (
                <VideoGeneration />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default A2iImageEditFeatures;
