import React, { useState } from "react";
import { PinIcon, LikeIcon, DislikeIcon } from "@/components/ui/custom-icon";
import { CircleX, Copy, ExpandIcon } from "lucide-react";
import { ImageModal } from "../../shared/ImageModal";

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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={`relative group ${className}`}>
      {/* Top Action Icons */}
      <div className="flex justify-end gap-x-2 pb-2">
        <CircleX size={20} className="cursor-pointer" />

        {/* Expand Icon with Modal Trigger */}
        <ExpandIcon
          size={20}
          className="cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />

        <Copy size={20} className="cursor-pointer" />
        <PinIcon size={20} className="cursor-pointer" />
      </div>

      {/* Main Image */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <img src={src} alt={alt} className="w-full h-full" />
      </div>

      {/* Like/Dislike Hover Bar */}
      <div className="absolute bottom-0 w-full py-3 px-4 flex text-white items-center justify-between bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="text-sm font-medium shadow-2xl">Rate this image</div>
        <div className="flex space-x-5">
          <DislikeIcon
            onClick={() => handleLikeDislike?.(false)}
            size={16}
            color={isLiked === false ? "#636AE8" : "white"}
          />
          <LikeIcon
            onClick={() => handleLikeDislike?.(true)}
            size={16}
            color={isLiked === true ? "#636AE8" : "white"}
          />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={src}
        onClose={() => setIsModalOpen(false)}
        alt={alt}
        isOpen={isModalOpen}
      />
    </div>
  );
};
