"use client";

import {
  ImageIcon2,
  PaintBrushIcon,
  VideoIcon,
} from "@/components/ui/custom-icon";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shirt, CatIcon } from "lucide-react";

export function AskKittykatTabs() {
  return (
    <TabsList className="grid w-full grid-cols-5 mb-8 bg-none h-20">
      <TabsTrigger value="virtual-tryon" className="flex flex-col gap-1 py-3">
        <Shirt />
        <span className="text-xs">Virtual Try-On</span>
      </TabsTrigger>
      <TabsTrigger value="in-paint" className="flex flex-col gap-1 py-3">
        <PaintBrushIcon />
        <span className="text-xs">In-Paint Editing</span>
      </TabsTrigger>
      <TabsTrigger value="video-gen" className="flex flex-col gap-1 py-3">
        <VideoIcon />
        <span className="text-xs">Video Generation</span>
      </TabsTrigger>
      <TabsTrigger value="upscaler" className="flex flex-col gap-1 py-3">
        <ImageIcon2 />
        <span className="text-xs">Image Upscaler</span>
      </TabsTrigger>
      <TabsTrigger value="ask-kittykat" className="flex flex-col gap-1 py-3">
        <CatIcon />
        <span className="text-xs">Ask KittyKat</span>
      </TabsTrigger>
    </TabsList>
  );
}
