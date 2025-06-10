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
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";


interface MoodboardCardProps {
  moodboard: MoodboardAsset;
  campaignId: string;
  brandId: string;
  onExpand: (url: string) => void;
  campaignInformation: ThreadCampaign | undefined;
  brandInformation: ThreadBrand | undefined;
}

export const MoodboardCard: React.FC<MoodboardCardProps> = ({
  moodboard,
  campaignId,
  brandId,
  onExpand,
  brandInformation,
  campaignInformation,
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

  const [, setReferanceImageLoading] = useQueryState("loading", parseAsBoolean);
  const [, setReferenceImage] = useQueryState("scrollTo", parseAsString);
  const stream = useStreamContext();

  const { selectedBrandId } = useBrandStore();
  const { user } = useUserStore();

  const a2iRequestText = `Let's create an A2I image for my campaign.<kittykat-do-not-render>
I’m working on the brand "${brandInformation?.static?.brand}" under the campaign "${campaignInformation?.campaign?.title}". I really like the moodboard titled "${moodboard.asset_title}". It has the following visual description: "${moodboard.visual_description}".

For context:
- A **moodboard** is a set of inspiration images used to define visual themes, typically in a bento grid style.
- An **A2I image** is a single creative output.

I only want **one image** generated unless I explicitly ask for more. The moodboard should serve as inspiration only.

✅ Do **not** explain this distinction (e.g., avoid saying things like “Since an A2I image is a single, polished visual...” or similar) in your response. The user already understands this. 

❗ Instead, ask me how I’d like to proceed with generating the next A2I image. Use this background to start a conversation, but don’t trigger any tools yet.

agentHint: use A2I_IMAGES_AGENT for this request
</kittykat-do-not-render>`;

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 h-full flex flex-col group">
      {/* Top Right Actions */}
      <div className="flex py-2 gap-x-1 justify-end px-2">
        <TooltipIconButton
          tooltip="Expand"
          onClick={(e) => {
            e.stopPropagation();
            onExpand(moodboard.asset_url);
          }}
        >
          <ExpandIcon size={14} />
        </TooltipIconButton>

        <Popover>
          <PopoverTrigger asChild>
            <TooltipIconButton tooltip="Copy">
              <Copy size={14} />
            </TooltipIconButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-xl p-4 max-h-[500px] overflow-y-scroll"
            side="right"
          >
            <div className="space-y-2">
              <h4 className="font-medium">Moodboard prompt</h4>
              <p className="text-sm text-gray-700">{moodboard.input_prompt}</p>
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
          </PopoverContent>
        </Popover>
      </div>

      {/* Image and Rating */}
      <div
        className="relative aspect-square flex items-center justify-center group border-l border-r"
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
      <div className="px-2 py-2 flex gap-x-2 justify-end bg-gray-50 mt-auto">
        <Button
          variant="default"
          size="sm"
          className="bg-[#636AE8FF] hover:bg-[#636AE8FF] cursor-pointer"
          onClick={async () => {
            setReferanceImageLoading(true);
            setReferenceImage("reference");

            await Promise.all([
              updateReferenceMoodboardId(brandId, moodboard.id),
              updateReferenceCampaignId(brandId, campaignId),
            ]);
            if (user) {
              submitOptimisticMessage({
                stream,
                text: a2iRequestText,
                userId: user?.id,
                currentBrandContextId: selectedBrandId,
              });
            }
            await new Promise((resolve) => setTimeout(resolve, 800));

            setReferanceImageLoading(null);
          }}
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
