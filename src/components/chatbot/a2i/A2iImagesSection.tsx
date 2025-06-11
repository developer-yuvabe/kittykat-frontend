import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Image } from "lucide-react";
import { ReferenceImage } from "./ReferenceImage";

import { A2IImages } from "./A2iImages";
import EnhancedParameterConfiguration from "./EnhancedParameterConfiguration";
import { ThreadA2iImage, ThreadCampaign } from "@/types/types";
import { useBrandStore } from "@/store/brand.store";

interface A2iImagesSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  campaignInformation: ThreadCampaign[] | undefined;
}

export default function A2iImagesSection({
  a2iImageInformation,
  campaignInformation,
}: A2iImagesSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { selectedBrandId } = useBrandStore();

  return (
    <>
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
                  <Image className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">A2i Images</div>
                  {!expanded && (
                    <div className="text-xs text-[#6e7787]">
                      Generate fashion images with AI models
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="px-6  space-y-6">
            {/* 1. Reference Image */}
            <ReferenceImage
              campaignInformation={campaignInformation}
              a2iImageInformation={a2iImageInformation}
              brandId={selectedBrandId || ""} // Ensure brandId is defined
            />

            {/* 8. Core Parameters */}
            <EnhancedParameterConfiguration
              a2iImageInformation={a2iImageInformation}
              brandId={selectedBrandId || ""} // Ensure brandId is defined
            />

            <A2IImages
              generatedImages={a2iImageInformation?.images || []}
              campaignId={a2iImageInformation?.reference_campaign_id || ""}
              brandId={selectedBrandId || ""}
            />
          </CardContent>
        )}
      </Card>
    </>
  );
}
