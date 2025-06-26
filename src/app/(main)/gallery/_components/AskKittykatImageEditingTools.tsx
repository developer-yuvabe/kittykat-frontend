"use client";

import { TabsContent } from "@/components/ui/tabs";
import { Shirt, Paintbrush, Video, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

interface ToolTab {
  value: string;
  icon: ReactNode;
  message: string;
}

const tools: ToolTab[] = [
  {
    value: "virtual-tryon",
    icon: <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
    message: "Virtual Try-On feature coming soon",
  },
  {
    value: "in-paint",
    icon: <Paintbrush className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
    message: "In-Paint Editing feature coming soon",
  },
  {
    value: "video-gen",
    icon: <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
    message: "Video Generation feature coming soon",
  },
  {
    value: "upscaler",
    icon: <ArrowUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />,
    message: "Image Upscaler feature coming soon",
  },
];

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

export function AskKittykatImageEditingTools() {
  return (
    <>
      {tools.map((tool) => (
        <TabsContent key={tool.value} value={tool.value} className="flex-1 p-4">
          <FeatureComingSoon icon={tool.icon} message={tool.message} />
        </TabsContent>
      ))}
    </>
  );
}
