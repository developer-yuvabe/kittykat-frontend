"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ImageIcon2,
  PaintBrushIcon,
  VideoIcon,
} from "@/components/ui/custom-icon";
import { Shirt, CatIcon } from "lucide-react";
import { ConceptVisualTabs } from "@/types/concept-visual-editor.types";
import React from "react";
import { useConceptVisualStore } from "@/store/concept-visual.store";

const tabItems: {
  key: ConceptVisualTabs;
  icon: React.ReactNode;
  label: string;
}[] = [
  {
    key: "vton",
    icon: <Shirt className="w-6 h-6" />,
    label: "Virtual Try-On",
  },
  {
    key: "remix",
    icon: <PaintBrushIcon className="w-6 h-6" />,
    label: "In-Paint Editing",
  },
  {
    key: "video-generation",
    icon: <VideoIcon className="w-6 h-6" />,
    label: "Video Generation",
  },
  {
    key: "upscaler",
    icon: <ImageIcon2 className="w-6 h-6" />,
    label: "Image Upscaler",
  },
  {
    key: "ask-kittykat",
    icon: <CatIcon className="w-6 h-6" />,
    label: "Kittykat Experts",
  },
];

export function AskKittykatTabs() {
  const { source, currentAsset } = useConceptVisualStore();
  return (
    <TabsList
      className="grid grid-cols-5 w-full bg-transparent h-max mb-0.5"
      variant="icon-grid"
    >
      {tabItems.map((item) => {
        const isDisabled =
          (currentAsset?.asset_type === "video" &&
            item.key === "video-generation") ||
          (source === "blanket" && item.key === "ask-kittykat");

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
