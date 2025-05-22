import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MdOutlineCampaign } from "react-icons/md";
import { DynamicContentSection } from "../DynamicSection";
import { ThreadDetails } from "@/types/types";
import { CampaignColors } from "./CampaignColors";
import { CampaignMoodboard } from "./CampaignMoodboards";
import { CampaignOverview } from "./CampaignOverview";
import CampaignSelector from "./CampaignSelector";

export const CampaignSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
}> = ({ campaignInformation }) => {
  if (!campaignInformation || !campaignInformation.length) return null;

  const [expanded, setExpanded] = useState(true);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(0);

  const currentCampaign = campaignInformation[selectedCampaignIndex];
  // console.log("Current Campaign Moodboard:", currentCampaign.moodboards);

  return (
    <Card className="bg-white rounded-2xl relative shadow-sm mb-4">
      <CardHeader className="py-1">
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
            {!expanded ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-3 overflow-hidden">
                  <span className="text-white font-bold">
                    <MdOutlineCampaign size={24} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Campaigns</div>
                  <div className="text-xs text-[#6e7787]">
                    Set-up and work on your brand campaigns
                  </div>
                </div>
              </div>
            ) : (
              <div className="">
                <div className="font-bold">
                  Campaign:{" "}
                  {currentCampaign?.campaign?.title ?? "Unnamed Campaign"}
                </div>
              </div>
            )}
          </div>
          {expanded && (
            <div className="absolute right-3 top-6 flex gap-x-2">
              <CampaignSelector
                campaigns={campaignInformation}
                selectedCampaignIndex={selectedCampaignIndex}
                setSelectedCampaignIndex={setSelectedCampaignIndex}
              />
            </div>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-6">
          <div className="mt-1 space-y-6">
            <CampaignOverview
              title={currentCampaign?.campaign?.title}
              description={currentCampaign?.campaign?.description}
              tone={currentCampaign?.campaign?.tone}
            />
            <CampaignColors colors={currentCampaign?.colors || []} />

            <DynamicContentSection
              dynamicData={Object.fromEntries(
                Object.entries(currentCampaign || {}).filter(
                  ([key]) =>
                    !["id", "campaign", "colors", "moodboards"].includes(key)
                )
              )}
            />
            <CampaignMoodboard campaign={currentCampaign || {}} />
          </div>
        </CardContent>
      )}
    </Card>
  );
};
