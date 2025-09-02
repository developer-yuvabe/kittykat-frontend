"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ThreadA2iImage, ThreadDetails } from "@/types/types";
import { A2iImagesWrapper } from "./A2iImagesWrapper";
import ReferenceMoodboard from "./ReferenceMoodboard";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "@/services/api/models.service";
import { useModelsStore } from "@/store/models.store";
import { useVideoGenStore } from "@/store/video-gen.store";

interface A2iImagesSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  moodboardInformation: ThreadDetails["moodboard_information"];
  campaignInformation: ThreadDetails["campaign_information"];
  selectedCampaignIndex: number;
}

const A2iImagesSection = function A2iImagesSection({
  a2iImageInformation,
  moodboardInformation,
  campaignInformation,
  selectedCampaignIndex,
}: A2iImagesSectionProps) {
  const { setGenerations } = useVideoGenStore();
  const { setModels, setIsModelsFetched } = useModelsStore();
  useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      try {
        const fetchedModels = await getModels();
        setModels(fetchedModels);
        return fetchedModels;
      } finally {
        setIsModelsFetched(true);
      }
    },
  });
  const [expanded, setExpanded] = useState(true);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      a2iImageInformation?.generations &&
      a2iImageInformation.generations.length > 0
    ) {
      setGenerations(a2iImageInformation.generations);
    }
  }, [a2iImageInformation?.generations]);

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
            campaignInformation={campaignInformation}
            selectedCampaignIndex={selectedCampaignIndex}
          />
          <A2iImagesWrapper
            formRef={formRef}
            generations={[...(a2iImageInformation?.generations || [])]}
            referenceMoodboardId={a2iImageInformation?.reference_moodboard_id}
            campaignInformation={campaignInformation}
            selectedCampaignIndex={selectedCampaignIndex}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default A2iImagesSection;
