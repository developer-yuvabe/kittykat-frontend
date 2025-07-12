"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { A2iImagesWrapper } from "./A2iImagesWrapper";
import ReferenceMoodboard from "./ReferenceMoodboard";
import { Form } from "@/components/ui/form";
import { useImageGenForm } from "@/hooks/useImageGenForm";

interface A2iImagesSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  moodboardInformation: ThreadDetails["moodboard_information"];
}

const A2iImagesSection = function A2iImagesSection({
  a2iImageInformation,
  moodboardInformation,
}: A2iImagesSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const form = useImageGenForm();
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1 pb-0 mb-0">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center">
            {expanded ? (
              <ChevronDown className="text-[#6e7787] mr-2" size={20} />
            ) : (
              <ChevronRight className="text-[#6e7787] mr-2" size={20} />
            )}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-3 overflow-hidden">
                <ImageIcon className="text-white" size={24} />
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium">A2i Media</div>

                {!expanded && (
                  <div className="text-xs text-[#6e7787]">
                    Generate fashion images and videos with AI models
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <Form {...form}>
          <CardContent className="px-6  space-y-6">
            <ReferenceMoodboard
              referenceMoodboardId={a2iImageInformation?.reference_moodboard_id}
              prompts={a2iImageInformation?.prompts}
              moodboardInformation={moodboardInformation}
              form={form}
              formRef={formRef}
            />
            <A2iImagesWrapper
              form={form}
              formRef={formRef}
              generations={[...(a2iImageInformation?.generations || [])]}
            />
          </CardContent>
        </Form>
      )}
    </Card>
  );
};

export default A2iImagesSection;
