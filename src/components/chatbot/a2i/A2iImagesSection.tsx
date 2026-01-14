"use client";

import { CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type {
  ThreadA2iImage,
  ThreadCampaign,
  ThreadDetails,
} from "@/types/types";
import { ChevronRight, Image } from "lucide-react";
import { useRef, useState } from "react";
import { A2iImagesWrapper } from "./A2iImagesWrapper";
import ReferenceMoodboard from "./ReferenceMoodboard";

import { Button } from "@/components/ui/button";
import { popVariants } from "@/lib/motion.utils";
import { AnimatePresence, motion } from "framer-motion";
import A2iAdvancedPromptGenerator from "./A2iAdvancedPromptGenerator";
import { AppConfig } from "@/config/app.config";
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
  const [expanded, setExpanded] = useState(
    AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW
  );
  const formRef = useRef<HTMLDivElement | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-x-4 items-center">
          <Button
            variant="outline"
            size="icon"
            className={
              expanded
                ? "rotate-90 transition-transform"
                : "transition-transform"
            }
            onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
          >
            {<ChevronRight />}
          </Button>
          <div className="w-14 h-14 rounded-lg bg-brand-gradient text-white flex items-center justify-center">
            <Image />
          </div>
          <div>
            <h4 className="font-light text-sm">Concept Visual Media</h4>
            <p className="font-bold text-2xl">Creative Studio</p>
          </div>
        </div>

        {expanded && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium text-[#6e7787]">
              Advanced Mode
            </span>
            <Switch
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
          </div>
        )}
      </div>

      {expanded && (
        <AnimatePresence>
          <motion.div
            initial="collapsed"
            animate="open"
            className="overflow-hidden"
            exit="collapsed"
            variants={popVariants}
          >
            <CardContent className="px-6  space-y-6">
              {isAdvancedMode ? (
                <A2iAdvancedPromptGenerator
                  referenceMoodboardId={
                    a2iImageInformation?.reference_moodboard_id
                  }
                  prompts={a2iImageInformation?.prompts}
                  moodboardInformation={moodboardInformation}
                  formRef={formRef}
                  currentCampaign={currentCampaign}
                  referenceMoodboardAssets={
                    a2iImageInformation?.reference_moodboard_assets
                  }
                />
              ) : (
                <ReferenceMoodboard
                  referenceMoodboardId={
                    a2iImageInformation?.reference_moodboard_id
                  }
                  prompts={a2iImageInformation?.prompts}
                  moodboardInformation={moodboardInformation}
                  formRef={formRef}
                  currentCampaign={currentCampaign}
                  referenceMoodboardAssets={
                    a2iImageInformation?.reference_moodboard_assets
                  }
                  showBorder={true}
                />
              )}
              <A2iImagesWrapper
                formRef={formRef}
                generations={[...(a2iImageInformation?.generations || [])]}
                referenceMoodboardId={
                  a2iImageInformation?.reference_moodboard_id
                }
                currentCampaign={currentCampaign}
              />
            </CardContent>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default A2iImagesSection;
