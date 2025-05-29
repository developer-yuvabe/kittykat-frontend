import { PinIcon } from "@/components/ui/custom-icon";
import { CircleX, Copy, ExpandIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { LikeIcon, DislikeIcon } from "@/components/ui/custom-icon";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
      <CircleX size={20} />
      <Dialog>
        <DialogTrigger asChild>
          <ExpandIcon size={20} className="cursor-pointer" />
        </DialogTrigger>
        <DialogContent
          className="p-0 max-w-[90vw] border rounded-none focus:border-none border-none max-h-[90vh] flex items-center justify-center"
          hideCloseIcon={true}
        >
          <VisuallyHidden>
            <DialogTitle>Expanded Image</DialogTitle>
          </VisuallyHidden>
          <img
            src={src}
            alt={alt}
            className="w-auto h-auto max-w-full max-h-full object-contain"
          />
        </DialogContent>
      </Dialog>
      <Copy size={20} />
      <PinIcon size={20} />
    </div>

    <img src={src} alt={alt} className="w-full h-full" />

    {/* Rating Bar: visible only on hover */}
    <div className="absolute bottom-0 w-full py-3 px-4 flex text-white items-center justify-between text-wh bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="text-sm font-medium shadow-2xl">Rate this image</div>
      <div className="flex space-x-5">
        <DislikeIcon
          onClick={() => handleLikeDislike?.(false)}
          size={16}
          color={isLiked === false ? "#636AE8" : "white"}
        />

        <LikeIcon
          size={16}
          color={isLiked === true ? "#636AE8" : "white"}
          onClick={() => handleLikeDislike?.(true)}
        />
      </div>
    </div>
  </div>
);
