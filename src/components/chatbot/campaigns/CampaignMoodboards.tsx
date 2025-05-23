import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import { usePinnedContextStore } from "@/store/usePinnedContextStore";
import MoodboardDetail from "../MoodboardDetail";
import { BsPinAngle } from "react-icons/bs";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSection } from "@/components/shared/ContentSection";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Copy, Ellipsis, Expand, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import React from "react";
import { MoodboardAsset } from "@/types/types";

interface CampaignMoodboardProps {
  moodboards: MoodboardAsset[];
}

export const CampaignMoodboard: React.FC<CampaignMoodboardProps> = ({
  moodboards,
}) => {
  console.log(moodboards);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [pinnedImages, setPinnedImages] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(
    null
  );
  const { addPinnedItem, removePinnedItem, isPinned, getPinnedItemId } =
    usePinnedContextStore();
  console.log(moodboards);
  // Skip rendering if no moodboards
  if (!moodboards || moodboards.length === 0) return null;

  const handleExpand = (url: string) => {
    setExpandedImage(expandedImage === url ? null : url);
  };

  const handlePin = (url: string, title: string = "Pinned Image") => {
    if (isPinned(url)) {
      // Get the ID of the pinned item to remove it
      const itemId = getPinnedItemId(url);
      if (itemId) {
        removePinnedItem();
        toast.success("Image unpinned", { position: "top-right" });
      }
    } else {
      // Add the item to pinned items
      addPinnedItem(title, url);
      toast.success("Image pinned to collection", { position: "top-right" });
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard!", { position: "top-right" });
  };

  // Mock function to handle like/dislike - now just visual, no state changes
  const handleLikeDislike = (isLiked: boolean) => {
    toast.success(isLiked ? "Image liked!" : "Image disliked!", {
      position: "top-right",
    });
  };

  return (
    <ContentSection
      title="Campaign Moodboards"
      content={
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {moodboards.map((moodboard, index) => {
                const moodboardId = moodboard.id || `moodboard-${index}`;
                const isShowingFeedback = feedbackSubmitted === moodboardId;

                return (
                  <CarouselItem
                    key={moodboardId}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col group">
                      {/* Action Buttons Container */}
                      <div className="absolute top-2 right-2 z-10 flex space-x-1">
                        <TooltipIconButton
                          tooltip="Expand"
                          side="top"
                          onClick={() => handleExpand(moodboard.asset_url)}
                          className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                        >
                          <Expand size={16} />
                        </TooltipIconButton>

                        <Popover>
                          <PopoverTrigger asChild>
                            <TooltipIconButton
                              tooltip="Copy prompt"
                              side="top"
                              className="bg-white p-1 rounded-full shadow hover:bg-gray-100"
                            >
                              <Copy size={16} />
                            </TooltipIconButton>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-xl p-4 max-h-[700px] overflow-y-scroll"
                            side="right"
                          >
                            <div className="space-y-2">
                              <h4 className="font-medium">Image Prompt</h4>
                              <p className="text-sm text-gray-700">
                                {moodboard.input_prompt}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() =>
                                  handleCopyPrompt(moodboard.input_prompt!)
                                }
                              >
                                <Copy className="mr-2 h-4 w-4" /> Copy Prompt
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        <TooltipIconButton
                          tooltip={
                            pinnedImages.includes(moodboard.asset_url)
                              ? "Unpin"
                              : "Pin"
                          }
                          side="top"
                          onClick={() => handlePin(moodboard.asset_url)}
                          className={`p-1 rounded-full shadow ${
                            pinnedImages.includes(moodboard.asset_url)
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          <BsPinAngle size={16} />
                        </TooltipIconButton>
                      </div>

                      {/* Image Container */}
                      <div className="relative aspect-square flex items-center justify-center mt-10">
                        <div className="absolute top-0 right-1 z-10 flex space-x-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Ellipsis className="text-white" size={36} />
                            </PopoverTrigger>
                            <PopoverContent className="w-68 p-2" side="right">
                              <MoodboardDetail moodboard={moodboard} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <img
                          src={
                            moodboard.asset_url || "/api/placeholder/600/600"
                          }
                          alt={`Moodboard ${index + 1}`}
                          className="w-full h-full object-contain"
                          onClick={() => handleExpand(moodboard.asset_url)}
                        />

                        {/* Feedback notification */}
                        {isShowingFeedback && (
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
                            Feedback submitted!
                          </div>
                        )}

                        {/* Rating Section - now visible on hover and positioned at bottom of image */}
                        <div className="absolute bottom-0 left-0 right-0  bg-opacity-60 text-white py-3 px-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="text-sm font-medium">
                            Rate this image
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLikeDislike(true)}
                              className="p-1.5 rounded-full  bg-opacity-50 hover:bg-opacity-70 text-white transition-colors"
                              aria-label="Like"
                            >
                              <ThumbsUp size={16} />
                            </button>
                            <button
                              onClick={() => handleLikeDislike(false)}
                              className="p-1.5 rounded-full  bg-opacity-50 hover:bg-opacity-70 text-white transition-colors"
                              aria-label="Dislike"
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Regenerate Button */}
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
                  </CarouselItem>
                );
              })}
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
      context={{ moodboards, expandedImage, pinnedImages, feedbackSubmitted }}
    />
  );
};
