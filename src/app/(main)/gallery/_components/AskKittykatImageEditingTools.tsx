"use client";

import RemixControls, {
  RemixControlsProps,
} from "@/components/chatbot/a2i/features/RemixControls";
import VideoGeneration from "@/components/chatbot/a2i/features/VideoGeneration";
import VirtualTryOn from "@/components/chatbot/a2i/features/VirtualTryOn";
import { TabsContent } from "@/components/ui/tabs";
import { GalleryItemResponse } from "@/types/gallery.types";
import { Shirt, Paintbrush, Video, ArrowUp } from "lucide-react";
import { ReactNode } from "react";
import ImageUpscaler from "@/components/chatbot/a2i/features/ImageUpscaler";
import { useModelsStore } from "@/store/models.store";

interface ToolTab {
  value: string;
  icon: ReactNode;
  message: string;
  customComponent?: ReactNode;
}

function FeatureComingSoon({
  icon,
  message,
}: {
  icon: ReactNode;
  message: string;
}) {
  return (
    <div className="text-center text-gray-500 mt-8">
      {icon}
      <p>{message}</p>
    </div>
  );
}

export function AskKittykatImageEditingTools({
  item,
  remixControls,
}: {
  item: GalleryItemResponse;
  remixControls: RemixControlsProps;
}) {
  const { selectedRemixModel } = useModelsStore();
  const tools: ToolTab[] = [
    {
      value: "virtual-tryon",
      icon: <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
      message: "Virtual Try-On feature coming soon",
      customComponent: (
        <VirtualTryOn
          productImage={item.asset_url}
          closeDialog={remixControls.closeDialog}
          brandId={item.brand_id}
          source="media-gallery"
          campaignId={remixControls.campaignId}
        />
      ),
    },
    {
      value: "in-paint",
      icon: <Paintbrush className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
      message: "In-Paint Editing feature coming soon",
      customComponent: selectedRemixModel ? (
        <RemixControls
          image={remixControls.image}
          brushSize={remixControls.brushSize}
          canRedo={remixControls.canRedo}
          canUndo={remixControls.canUndo}
          offScreenCanvasRef={remixControls.offScreenCanvasRef}
          onBrushSizeChange={remixControls.onBrushSizeChange}
          onClear={remixControls.onClear}
          onRedo={remixControls.onRedo}
          onUndo={remixControls.onUndo}
          closeDialog={remixControls.closeDialog}
          brandId={item.brand_id}
          source="media-gallery"
          campaignId={remixControls.campaignId}
        />
      ) : (
        <> </>
      ),
    },
    {
      value: "video-gen",
      icon: <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
      message: "Video Generation feature coming soon",
      customComponent: (
        <VideoGeneration
          key={item.asset_url}
          closeDialog={remixControls.closeDialog}
          baseImage={item.asset_url}
          campaignId={remixControls.campaignId}
        />
      ),
    },
    {
      value: "upscaler",
      icon: <ArrowUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
      message: "Image Upscaler feature coming soon",
      customComponent: (
        <ImageUpscaler
          closeDialog={remixControls.closeDialog}
          brandId={item.brand_id}
          source="media-gallery"
          initialImage={item.asset_url}
          campaignId={remixControls.campaignId}
        />
      ),
    },
  ];

  return (
    <>
      {tools.map((tool) => (
        <TabsContent key={tool.value} value={tool.value} className="flex-1 p-2">
          {tools.map((tool) => (
            <TabsContent
              key={tool.value}
              value={tool.value}
              className="flex-1 p-2 h-full"
            >
              {tool.customComponent ? (
                tool.customComponent
              ) : (
                <FeatureComingSoon icon={tool.icon} message={tool.message} />
              )}
            </TabsContent>
          ))}
        </TabsContent>
      ))}
    </>
  );
}
