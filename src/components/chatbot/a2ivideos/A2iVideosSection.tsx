import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Image } from "lucide-react";
import { ThreadA2iImage, ThreadCampaign } from "@/types/types";
import { ReferenceA2iImage } from "./ReferenceImage";
import EnhancedParameterConfiguration from "./EnhancedParameterConfiguration";
import { A2IImages } from "../a2i/A2iImages";
import { useBrandStore } from "@/store/brand.store";

interface A2iVideosSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  campaignInformation: ThreadCampaign[] | undefined;
}

export default function A2iVideosSection({
  a2iImageInformation,
  campaignInformation,
}: A2iVideosSectionProps) {
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
                  <div className="text-sm font-medium">A2i Videos</div>
                  {!expanded && (
                    <div className="text-xs text-[#6e7787]">
                      Create and modify A2i videos
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
            <ReferenceA2iImage
              a2iImageInformation={a2iImageInformation}
              brandId={selectedBrandId || ""}
            />

            {/* 8. Core Parameters */}
            <EnhancedParameterConfiguration
              a2iImageInformation={a2iImageInformation}
              brandId={selectedBrandId || ""}
            />

            {/* <A2IImages generatedImages={a2iImageInformation?.images || []} /> */}
          </CardContent>
        )}
      </Card>
    </>
  );
}
