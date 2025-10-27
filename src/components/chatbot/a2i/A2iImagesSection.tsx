"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type {
  ThreadA2iImage,
  ThreadCampaign,
  ThreadDetails,
} from "@/types/types";
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { A2iImagesWrapper } from "./A2iImagesWrapper";
import ReferenceMoodboard from "./ReferenceMoodboard";
import { useQueryState } from "nuqs";

interface A2iImagesSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  moodboardInformation: ThreadDetails["moodboard_information"];
  campaignInformation: ThreadDetails["campaign_information"];
  currentCampaign: ThreadCampaign | null;
}

const A2iImagesSection = function A2iImagesSection({
  a2iImageInformation,
  moodboardInformation,
  currentCampaign,
}: A2iImagesSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [scrollTo, setScrollTo] = useQueryState("scrollTo");

  // scroll on mount if query param matches
  useEffect(() => {
    if (scrollTo === "a2i") {
      const observer = new MutationObserver(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
          setScrollTo(null);
          observer.disconnect();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [scrollTo, setScrollTo]);

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
                <div className="text-sm font-medium">Concept Visual Media</div>

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
        <CardContent className="px-6  space-y-6">
          <ReferenceMoodboard
            referenceMoodboardId={a2iImageInformation?.reference_moodboard_id}
            prompts={a2iImageInformation?.prompts}
            moodboardInformation={moodboardInformation}
            formRef={formRef}
            currentCampaign={currentCampaign}
            referenceMoodboardAssets={
              a2iImageInformation?.reference_moodboard_assets
            }
          />
          <A2iImagesWrapper
            formRef={formRef}
            generations={[...(a2iImageInformation?.generations || [])]}
            referenceMoodboardId={a2iImageInformation?.reference_moodboard_id}
            currentCampaign={currentCampaign}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default A2iImagesSection;
