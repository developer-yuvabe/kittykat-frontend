import React, { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DislikeIcon,
  ExpandIcon,
  LikeIcon,
  MoreIcon,
} from "@/components/ui/custom-icon";
import MoodboardDetail from "../MoodboardDetail";
import { updateCampaignMoodboard } from "@/services/api/brand.service";
import { MoodboardAsset } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MoodboardCardProps {
  moodboard: MoodboardAsset;
  campaignId: string;
  brandId: string;
  onExpand: (url: string) => void;
}

export const MoodboardCard: React.FC<MoodboardCardProps> = ({
  moodboard,
  campaignId,
  brandId,
  onExpand,
}) => {
  const moodboardId = moodboard.id || `moodboard-${moodboard.asset_url}`;
  const [isLiked, setIsLiked] = useState<boolean | undefined>(
    moodboard.is_liked
  );

  const handleCopy = (prompt: string, acknowledgement: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success(acknowledgement, { position: "top-right" });
  };

  const handleLikeDislike = (isLiked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(isLiked);
    updateCampaignMoodboard(brandId, campaignId, moodboardId, {
      is_liked: isLiked,
    })
      .then(() => {
        toast.success(isLiked ? "Image liked!" : "Image disliked!", {
          position: "top-right",
        });
      })
      .catch((error) => {
        setIsLiked(moodboard.is_liked);
        console.error("Error updating moodboard:", error);
        toast.error("Failed to update moodboard", {
          position: "top-right",
        });
      });
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col group">
      {/* Top Right Actions */}
      <div className="absolute top-1 right-2 z-10 flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExpand(moodboard.asset_url)}
          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
        >
          <ExpandIcon size={14} />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
            >
              <Copy size={14} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-xl p-4 max-h-[700px] overflow-y-scroll"
            side="right"
          >
            <Tabs defaultValue="base-prompt" className="w-full">
              <TabsList className="w-full ">
                <TabsTrigger value="base-prompt">Base Prompt</TabsTrigger>
                <TabsTrigger value="prompt">
                  Moodboard Enhanced Prompt
                </TabsTrigger>
                <TabsTrigger value="visual-description">
                  Visual description
                </TabsTrigger>
              </TabsList>
              <TabsContent value="base-prompt" className="w-full">
                <div className="space-y-2">
                  <h4 className="font-medium">Base Prompt</h4>
                  {moodboard.base_prompt ? (
                    <p className="text-sm text-gray-700">
                      {moodboard.base_prompt}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700">
                      No base prompt available.
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() =>
                      handleCopy(moodboard.input_prompt!, "Base prompt copied!")
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="prompt" className="w-full">
                <div className="space-y-2">
                  <h4 className="font-medium">Moodboard Enhanced Prompt</h4>
                  <p className="text-sm text-gray-700">
                    {moodboard.input_prompt}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() =>
                      handleCopy(moodboard.input_prompt!, "Prompt copied!")
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="visual-description">
                <div className="space-y-2">
                  <h4 className="font-medium">Visual Description</h4>
                  {moodboard.visual_description ? (
                    <p className="text-sm text-gray-700">
                      {moodboard.visual_description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700">
                      No visual description available.
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() =>
                      handleCopy(
                        moodboard.visual_description!,
                        "Visual description copied!"
                      )
                    }
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Description
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>

      {/* Image and Rating */}
      <div
        className="relative aspect-square flex items-center justify-center group mt-10"
        onClick={(e) => {
          e.stopPropagation();
          onExpand(moodboard.asset_url);
        }}
      >
        {/* Curvy gradient overlay at top-right */}
        {/* <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-black/50 to-transparent rounded-bl-[10%]"></div> */}
        {/* Bottom-to-top gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <img
          src={moodboard.asset_url || "/api/placeholder/600/600"}
          alt="Moodboard"
          className="w-full h-full object-contain transition-opacity duration-300"
          // onClick={() => onExpand(moodboard.asset_url)}
        />

        {/* Hover overlay for actions */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="flex justify-end p-2 bg-gradient-to-b from-black/80 pointer-events-auto">
            <Popover>
              <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                <MoreIcon size={28} color="#ffffff" />
              </PopoverTrigger>
              <PopoverContent
                className="w-68 h-max max-h-128 overflow-auto p-2"
                side="right"
              >
                <MoodboardDetail
                  moodboard={moodboard}
                  campaignId={campaignId}
                  brandId={brandId}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="bg-opacity-60 text-white py-3 px-4 flex items-center justify-between bg-gradient-to-t from-black/85 pointer-events-auto">
            <div className="text-sm font-medium shadow-2xl">
              Rate this image
            </div>
            <div className="flex space-x-2 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleLikeDislike(false, e)}
                className="p-1.5 rounded-full bg-opacity-50 hover:bg-opacity-70 text-white"
              >
                <DislikeIcon
                  size={16}
                  color={isLiked === false ? "#636AE8" : "white"}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleLikeDislike(true, e)}
                className="p-1.5 rounded-full bg-opacity-50 hover:bg-opacity-70 text-white"
              >
                <LikeIcon
                  size={16}
                  color={isLiked === true ? "#636AE8" : "white"}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-2 py-4 flex gap-x-2 justify-end bg-gray-50 mt-auto">
        <Button
          variant="default"
          size="sm"
          className="bg-[#636AE8FF] hover:bg-[#636AE8FF]"
        >
          Create Image
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-[#EA916EFF] hover:bg-[#EA916EFF]"
        >
          Remix
        </Button>
      </div>
    </div>
  );
};

export default MoodboardCard;
