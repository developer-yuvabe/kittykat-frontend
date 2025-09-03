"use client";
// Important: This component is not USED

import RemixImage, {
  RemixImageHandle,
} from "@/app/(main)/_components/remix/RemixImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix";
import { A2iImageDetail, A2iImageGeneration } from "@/types/types";
import { TabsContent } from "@radix-ui/react-tabs";
import { BrushIcon, ShirtIcon, VideoIcon, X } from "lucide-react";
import React, { useCallback, useRef } from "react";
import RemixControls from "./features/RemixControls";
import VideoGeneration from "./features/VideoGeneration";
import VirtualTryOn from "./features/VirtualTryOn";
import { useModelsStore } from "@/store/models.store";

const IMAGE_EDIT_FEATURES = [
  {
    key: "virtual-tryon",
    icon: <ShirtIcon className="w-6 h-6" />,
    label: "Virtual Try-On",
  },
  {
    key: "in-paint",
    icon: <BrushIcon className="w-6 h-6" />,
    label: "In-Paint Editing",
  },
  {
    key: "video-gen",
    icon: <VideoIcon className="w-6 h-6" />,
    label: "Video Generation",
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
  const { selectedRemixModel } = useModelsStore();
  const [currentFeature, setCurrentFeature] = React.useState(
    IMAGE_EDIT_FEATURES[0].key
  );
  const [brushSize, setBrushSize] = React.useState(50);
  const isRemixEnabled = currentFeature === "in-paint";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const remixImageRef = useRef<RemixImageHandle>(null);
  const remixHistory = useUndoRedoRemix();

  const handleBrushSizeChange = useCallback(
    (size: number) => {
      setBrushSize(size);
      if (remixImageRef.current && isRemixEnabled) {
        remixImageRef.current.setBrushSize?.(size); // Update canvas without callback loop
      }
    },
    [isRemixEnabled]
  );

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
            <DialogTitle>A2i Image Tools</DialogTitle>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="icon" onClick={() => onClose()}>
                <X />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-full flex gap-x-4 overflow-hidden">
          <div className="w-[40%] h-full flex items-center justify-center">
            {isRemixEnabled ? (
              <RemixImage
                ref={remixImageRef}
                imageRef={imageRef}
                canvasRef={canvasRef}
                offScreenCanvasRef={offScreenCanvasRef}
                url={image.url}
                remixHistory={remixHistory}
                brushSize={brushSize}
              />
            ) : (
              <img
                src={image.url}
                alt={parameters.prompt}
                className="block max-h-[85vh] object-contain w-max"
              />
            )}
          </div>
          <Tabs
            value={currentFeature}
            onValueChange={setCurrentFeature}
            className="w-[60%] h-full flex flex-col"
          >
            <TabsList
              className="grid grid-cols-3 w-full mb-8 bg-transparent h-20 flex-shrink-0"
              variant="icon-grid"
            >
              {IMAGE_EDIT_FEATURES.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  variant="icon-grid"
                >
                  <div className="transition-colors">{item.icon}</div>
                  <span className="text-xs mt-1">{item.label}</span>{" "}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 overflow-hidden min-h-0">
              <TabsContent
                value="virtual-tryon"
                className="h-full m-0 data-[state=active]:h-full"
              >
                <VirtualTryOn
                  productImage={image.url}
                  closeDialog={onClose}
                  source="a2i"
                />
              </TabsContent>

              <TabsContent
                value="in-paint"
                className="h-full m-0 data-[state=active]:h-full"
              >
                {selectedRemixModel && (
                  <RemixControls
                    image={{ url: image.url, size: parameters.size }}
                    closeDialog={() => onClose()}
                    canUndo={remixHistory.canUndo}
                    canRedo={remixHistory.canRedo}
                    onUndo={() => remixImageRef.current?.undo()}
                    onRedo={() => remixImageRef.current?.redo()}
                    onClear={() => remixImageRef.current?.clearCanvas()}
                    offScreenCanvasRef={offScreenCanvasRef}
                    brushSize={brushSize}
                    onBrushSizeChange={handleBrushSizeChange}
                    source="a2i"
                    key={selectedRemixModel.id}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="video-gen"
                className="h-full m-0 data-[state=active]:h-full"
              >
                <VideoGeneration baseImage={image.url} closeDialog={onClose} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default A2iImageEditFeatures;
