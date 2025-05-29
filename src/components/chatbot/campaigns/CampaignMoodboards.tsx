import { ContentSection } from "@/components/shared/ContentSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import { Agents, MoodboardAsset } from "@/types/types";
import React, { useState } from "react";
import { MoodboardCard } from "./MoodboardCard";
import { ImageModal } from "../../shared/ImageModal";

interface CampaignMoodboardProps {
  moodboards: MoodboardAsset[];
  brandId: string;
  campaignId: string;
}

export const CampaignMoodboard: React.FC<CampaignMoodboardProps> = ({
  moodboards,
  brandId,
  campaignId,
}) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!moodboards || moodboards.length === 0) return null;

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
