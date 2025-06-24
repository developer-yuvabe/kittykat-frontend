import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Image } from "lucide-react";
import { useState } from "react";
import { ThreadA2iImage } from "@/types/types";
import { A2iImagesWrapper } from "./A2iImagesWrapper";
import ReferenceMoodboard from "./ReferenceMoodboard";

interface A2iImagesSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
}

export default function A2iImagesSection({
  a2iImageInformation,
}: A2iImagesSectionProps) {
  const [expanded, setExpanded] = useState(true);

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
          <CardContent className="px-6  space-y-6">
            <ReferenceMoodboard
              referenceMoodboardId={a2iImageInformation?.reference_moodboard_id}
              prompts={a2iImageInformation?.prompts}
            />
            <A2iImagesWrapper
              generations={[...(a2iImageInformation?.generations || [])]}
            />
          </CardContent>
        )}
      </Card>
    </>
  );
}
