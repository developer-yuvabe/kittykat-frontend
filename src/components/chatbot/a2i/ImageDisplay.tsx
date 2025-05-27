import { PinIcon } from "@/components/ui/custom-icon";
import { CircleX, Copy, ExpandIcon } from "lucide-react";
import React from "react";
import { ActionButtonsRow } from "./ActionButtonsRow";

type ImageDisplayProps = {
  src: string;
  alt: string;
  className?: string;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
};

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  className = "",
  onSelect,
  onGoToGenerator,
}) => (
  <div className={`  `}>
    <div className="flex justify-end  gap-x-2 pb-2">
      <CircleX size={20} />
      <ExpandIcon size={20} />
      <Copy size={20} />
      <PinIcon size={20} />
    </div>
    <img src={src} alt={alt} className="w-full h-full " />
  </div>
);
