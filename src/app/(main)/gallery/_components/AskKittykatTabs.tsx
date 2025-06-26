"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shirt, Paintbrush, Video, ArrowUp, Bot } from "lucide-react";

export function AskKittykatTabs() {
  return (
    <TabsList className="grid w-full grid-cols-5 mb-8 bg-none h-20">
      <TabsTrigger value="virtual-tryon" className="flex flex-col gap-1 py-3">
        <Shirt className="w-4 h-4" />
        <span className="text-xs">Virtual Try-On</span>
      </TabsTrigger>
      <TabsTrigger value="in-paint" className="flex flex-col gap-1 py-3">
        <Paintbrush className="w-4 h-4" />
        <span className="text-xs">In-Paint Editing</span>
      </TabsTrigger>
      <TabsTrigger value="video-gen" className="flex flex-col gap-1 py-3">
        <Video className="w-4 h-4" />
        <span className="text-xs">Video Generation</span>
      </TabsTrigger>
      <TabsTrigger value="upscaler" className="flex flex-col gap-1 py-3">
        <ArrowUp className="w-4 h-4" />
        <span className="text-xs">Image Upscaler</span>
      </TabsTrigger>
      <TabsTrigger value="ask-kittykat" className="flex flex-col gap-1 py-3">
        <Bot className="w-4 h-4" />
        <span className="text-xs">Ask KittyKat</span>
      </TabsTrigger>
    </TabsList>
  );
}
