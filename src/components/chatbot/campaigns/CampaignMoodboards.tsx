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
import { Button } from "@/components/ui/button";

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

          {/* Expanded image modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/50 bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  src={expandedImage}
                  alt="Expanded moodboard"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <Button
                  variant="outline"
                  className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 p-0"
                  onClick={() => setExpandedImage(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
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
