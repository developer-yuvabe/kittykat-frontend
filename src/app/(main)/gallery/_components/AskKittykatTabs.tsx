"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon2,
  PaintBrushIcon,
  VideoIcon,
} from "@/components/ui/custom-icon";
import { Shirt, CatIcon } from "lucide-react";

const tabItems = [
  {
    key: "virtual-tryon",
    icon: <Shirt className="w-6 h-6" />,
    label: "Virtual Try-On",
    imageOnly: true,
  },
  {
    key: "in-paint",
    icon: <PaintBrushIcon className="w-6 h-6" />,
    label: "In-Paint Editing",
    imageOnly: true,
  },
  {
    key: "video-gen",
    icon: <VideoIcon className="w-6 h-6" />,
    label: "Video Generation",
    imageOnly: true,
  },
  {
    key: "upscaler",
    icon: <ImageIcon2 className="w-6 h-6" />,
    label: "Image Upscaler",
    imageOnly: true,
  },
  {
    key: "ask-kittykat",
    icon: <CatIcon className="w-6 h-6" />,
    label: "Kittykat Experts",
    imageOnly: false,
  },
];

interface AskKittykatTabsProps {
  isVideoAsset?: boolean;
  isConceptVisualEditor?: boolean;
}

export function AskKittykatTabs({
  isVideoAsset = false,
  isConceptVisualEditor = false,
}: AskKittykatTabsProps) {
  return (
    <TabsList
      className="grid grid-cols-5 w-full bg-transparent h-max mb-0.5"
      variant="icon-grid"
    >
      {tabItems.map((item) => {
        const isDisabled =
          (isVideoAsset && item.imageOnly) ||
          (isConceptVisualEditor && item.key === "ask-kittykat");

        return (
          <TabsTrigger
            key={item.key}
            value={item.key}
            variant="icon-grid"
            disabled={isDisabled}
            className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
            title={
              isDisabled
                ? item.key === "ask-kittykat"
                  ? "Kittykat Experts is disabled in Concept Visual Editor"
                  : "This feature is only available for images"
                : ""
            }
          >
            <div className="transition-colors">{item.icon}</div>
            <span className="text-xs mt-1">{item.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
