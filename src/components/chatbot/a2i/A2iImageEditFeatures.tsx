"use client";

import React from "react";
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
import Remix from "./features/Remix";
import { BrushIcon, VideoRecorderIcon } from "@/components/ui/custom-icon";
import VideoGeneration from "./features/VideoGeneration";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    name: "Virtual Try-On",
    icon: ShirtIcon,
    component: VirtualTryOn,
  },
  {
    name: "In-Paint Editing",
    icon: BrushIcon,
    component: Remix,
  },
  {
    name: "Video Generation",
    icon: VideoRecorderIcon,
    component: VideoGeneration,
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
            <img
              src={image.url}
              alt={parameters.prompt}
              className="block max-h-[85vh] object-contain border w-max"
            />
          </div>
          <div className="w-[60%] h-full flex flex-col">
            <div className="flex w-full h-max">
              {FEATURES.map((feature) => {
                return (
                  <button
                    onClick={() => setCurrentFeature(feature)}
                    key={feature.name}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-2 p-4 text-muted-foreground hover:bg-muted cursor-pointer transition-colors hover:border-b-4",
                      {
                        "text-primary border-b-4 border-primary":
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
            <div className="overflow-y-auto p-4">
              <currentFeature.component />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default A2iImageEditFeatures;
