import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronRight, CirclePlus } from "lucide-react";
import { MdOutlineCampaign } from "react-icons/md";
import { DynamicContentSection } from "../DynamicSection";
import { Agents, ThreadDetails } from "@/types/types";
import { CampaignColors } from "./CampaignColors";
import { CampaignMoodboard } from "./CampaignMoodboards";
import { CampaignOverview } from "./CampaignOverview";
import CampaignSelector from "./CampaignSelector";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@langchain/langgraph-sdk";
import { motion } from "framer-motion";

export const CampaignSection: React.FC<{
  campaignInformation: ThreadDetails["campaign_information"];
  brandId: string;
}> = ({ campaignInformation, brandId }) => {
  if (!campaignInformation || !campaignInformation.length) return null;

  const stream = useStreamContext();
  const latestCampaignInformation = campaignInformation.length - 1;

  const [expanded, setExpanded] = useState(true);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(
    latestCampaignInformation
  );

  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    // Trigger fade by incrementing key when campaignInformation length changes
    setFadeKey((prev) => prev + 1);
    setSelectedCampaignIndex(campaignInformation.length - 1);
  }, [campaignInformation.length]);

  const currentCampaign = campaignInformation[selectedCampaignIndex];
  console.log("current campaign info", currentCampaign);
  const dynamicData = currentCampaign?.dynamic;

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
                // setSelectedCampaignIndex={setSelectedCampaignIndex}
                setSelectedCampaignIndex={(index) => {
                  setFadeKey((prev) => prev + 1); // Trigger fade on campaign change
                  setSelectedCampaignIndex(index);
                }}
              />
              <TooltipIconButton
                size="lg"
                className="p-4"
                tooltip="New Campaign"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  const newHumanMessage: Message = {
                    id: uuidv4(),
                    type: "human",
                    content: [
                      {
                        type: "text",
                        text: `Let's create a new campaign!`,
                      },
                    ],
                  };

                  stream.submit(
                    {
                      messages: [newHumanMessage],
                    },
                    {
                      streamMode: ["values"],
                      optimisticValues: (prev) => ({
                        ...prev,
                        messages: [...(prev.messages ?? []), newHumanMessage],
                      }),
                    }
                  );
                }}
              >
                <CirclePlus className="size-5" />
              </TooltipIconButton>
            </div>
          )}
        </div>
      </CardHeader>
      {expanded && (
        <div>
          <CardContent>
            <motion.div
              key={fadeKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="pt-0 pb-6"
            >
              <div className="mt-1 space-y-6">
                <CampaignOverview
                  title={currentCampaign?.campaign?.title}
                  description={currentCampaign?.campaign?.description}
                  tone={currentCampaign?.campaign?.tone}
                />
                <CampaignColors colors={currentCampaign?.colors || []} />

                <DynamicContentSection
                  dynamicData={dynamicData ?? {}}
                  agentId={Agents.CAMPAIGN_AGENT}
                />

                <CampaignMoodboard
                  moodboards={currentCampaign.moodboards || []}
                  brandId={brandId}
                  campaignId={currentCampaign.id}
                />
              </div>
            </motion.div>
          </CardContent>
        </div>
      )}
    </Card>
  );
};
