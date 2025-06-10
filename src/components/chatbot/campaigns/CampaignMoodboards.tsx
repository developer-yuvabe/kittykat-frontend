import { ContentSection } from "@/components/shared/ContentSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import { Agents, ThreadBrand, ThreadCampaign } from "@/types/types";
import React, { useState } from "react";
import { MoodboardCard } from "./MoodboardCard";
import { ImageModal } from "../../shared/ImageModal";

interface CampaignMoodboardProps {
  currentCampaign: ThreadCampaign | undefined;
  brandId: string;
  campaignId: string;
  brandInformation: ThreadBrand | undefined;
}

export const CampaignMoodboard: React.FC<CampaignMoodboardProps> = ({
  currentCampaign,
  brandId,
  campaignId,
  brandInformation,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!currentCampaign?.moodboards || currentCampaign?.moodboards?.length === 0)
    return null;

  const moodboards = currentCampaign.moodboards;

  return (
    <ContentSection
      title="Campaign Moodboards"
      content={
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {moodboards.map((moodboard, index) => (
                <CarouselItem
                  key={moodboard.id || index}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <MoodboardCard
                    moodboard={moodboard}
                    campaignId={campaignId}
                    brandId={brandId}
                    onExpand={() => setExpandedImage(moodboard.asset_url)}
                    brandInformation={brandInformation}
                    campaignInformation={currentCampaign}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative transform-none mx-2" />
              <CarouselNext className="relative transform-none mx-2" />
            </div>
          </Carousel>

          {expandedImage && (
            <ImageModal
              imageUrl={expandedImage}
              onClose={() => setExpandedImage(null)}
              alt="Expanded moodboard"
              isOpen={!!expandedImage}
            />
          )}
        </div>
      }
      context={{
        agentId: Agents.CAMPAIGN_AGENT,
        data: {
          moodboards,
          expandedImage,
        },
      }}
    />
  );
};
