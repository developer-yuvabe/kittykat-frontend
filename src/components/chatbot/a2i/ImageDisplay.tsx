import { PinIcon } from "@/components/ui/custom-icon";
import { CircleX, Copy, ExpandIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { LikeIcon, DislikeIcon } from "@/components/ui/custom-icon";
type ImageDisplayProps = {
  src: string;
  alt: string;
  className?: string;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
  isLiked?: boolean | null;
  handleLikeDislike?: (liked: boolean) => void;
};

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  className = "",
  onSelect,
  onGoToGenerator,
  isLiked,
  handleLikeDislike,
}) => (
  <div className={`relative group ${className}`}>
    <div className="flex justify-end gap-x-2 pb-2">
      <CircleX size={20} className="text-[#6e7787] hover:text-[#171a1f]" />
      <ExpandIcon size={20} className="text-[#6e7787] hover:text-[#171a1f]" />
      <Copy size={20} className="text-[#6e7787] hover:text-[#171a1f]" />
      <PinIcon size={20} className="text-[#6e7787] hover:text-[#171a1f]" />
    </div>

    <img src={src} alt={alt} className="w-full h-full" />

    {/* Rating Bar: visible only on hover */}
    <div className="absolute bottom-0 w-full bg-opacity-60 text-white py-3 px-4 flex items-center justify-between bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="text-sm font-medium shadow-2xl">Rate this image</div>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleLikeDislike?.(false)}
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
          onClick={() => handleLikeDislike?.(true)}
          className="p-1.5 rounded-full bg-opacity-50 hover:bg-opacity-70 text-white"
        >
          <LikeIcon size={16} color={isLiked === true ? "#636AE8" : "white"} />
        </Button>
      </div>
    </div>
  </div>
);
