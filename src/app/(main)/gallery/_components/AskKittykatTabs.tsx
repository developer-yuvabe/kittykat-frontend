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
  },
  {
    key: "in-paint",
    icon: <PaintBrushIcon className="w-6 h-6" />,
    label: "In-Paint Editing",
  },
  {
    key: "video-gen",
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
  return (
    <TabsList
      className="grid grid-cols-5 w-full bg-transparent h-max mb-0.5"
      variant="icon-grid"
    >
      {tabItems.map((item) => (
        <TabsTrigger key={item.key} value={item.key} variant="icon-grid">
          <div className="transition-colors">{item.icon}</div>
          <span className="text-xs mt-1">{item.label}</span>{" "}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
