// import React, { useState } from "react";
// import { PinIcon, LikeIcon, DislikeIcon } from "@/components/ui/custom-icon";
// import { CircleX, Copy, Expand, Info, Check } from "lucide-react";
// import { ImageModal } from "../../shared/ImageModal";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Button } from "@/components/ui/button";
// import { capitalizeKey } from "@/lib/langgraph.utils";
// import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
// import { toast } from "sonner";

// type ImageDisplayProps = {
//   src: string;
//   alt: string;
//   className?: string;
//   onSelect?: () => void;
//   onGoToGenerator?: () => void;
//   isLiked?: boolean | null;
//   handleLikeDislike?: (liked: boolean) => void;
//   prompt?: string;
//   metadata?: Record<string, any>;
// };

// export const ImageDisplay: React.FC<ImageDisplayProps> = ({
//   src,
//   alt,
//   className = "",
//   isLiked,
//   handleLikeDislike,
//   prompt = "",
//   metadata = {},
// }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [copied, setCopied] = useState(false);
//   const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
//   const [metadataPopoverOpen, setMetadataPopoverOpen] = useState(false);

//   const handleCopyPrompt = async () => {
//     try {
//       await navigator.clipboard.writeText(prompt);
//       setCopied(true);
//       toast.success("Copied to clipboard!", {
//         position: "top-right",
//       });
//       setTimeout(() => setCopied(false), 2000);
//     } catch (err) {
//       console.error("Failed to copy text: ", err);
//       toast.error("Failed to copy", {
//         position: "top-right",
//       });
//     }
//   };

//   const formatMetadataValue = (value: any): string => {
//     if (
//       typeof value === "string" &&
//       value.includes("T") &&
//       value.includes("Z")
//     ) {
//       return new Date(value).toLocaleString();
//     }
//     return String(value);
//   };

//   return (
//     <div className={`relative group ${className}`}>
//       {/* Top Action Icons */}
//       <div className="flex justify-end gap-x-1 pb-2">
//         <TooltipIconButton tooltip="Remove">
//           <CircleX size={20} className="cursor-pointer" />
//         </TooltipIconButton>
//         {/* Expand Icon with Modal Trigger */}
//         <TooltipIconButton tooltip="Expand">
//           <Expand
//             size={20}
//             className="cursor-pointer"
//             onClick={() => setIsModalOpen(true)}
//           />
//         </TooltipIconButton>
//         {/* Copy Icon with Popover */}
//         <Popover open={copyPopoverOpen} onOpenChange={setCopyPopoverOpen}>
//           <PopoverTrigger asChild>
//             <TooltipIconButton tooltip="Copy Prompt">
//               <Copy className="cursor-pointer" />
//             </TooltipIconButton>
//           </PopoverTrigger>
//           <PopoverContent className="w-80">
//             <div className="space-y-3">
//               <div className="text-sm font-medium">Prompt</div>
//               <div className="text-sm bg-muted p-3 rounded border max-h-32 overflow-y-auto">
//                 {prompt}
//               </div>
//               <Button
//                 onClick={handleCopyPrompt}
//                 className="w-full"
//                 variant="default"
//               >
//                 {copied ? (
//                   <>
//                     <Check size={16} className="mr-2" />
//                     Copied!
//                   </>
//                 ) : (
//                   <>
//                     <Copy size={16} className="mr-2" />
//                     Copy Prompt
//                   </>
//                 )}
//               </Button>
//             </div>
//           </PopoverContent>
//         </Popover>
//         <TooltipIconButton tooltip="Pin">
//           <PinIcon size={20} className="cursor-pointer" />
//         </TooltipIconButton>
//         {/* Metadata Info Icon */}
//         <Popover
//           open={metadataPopoverOpen}
//           onOpenChange={setMetadataPopoverOpen}
//         >
//           <PopoverTrigger asChild>
//             <TooltipIconButton tooltip="Info">
//               <Info className="cursor-pointer" />
//             </TooltipIconButton>
//           </PopoverTrigger>
//           <PopoverContent className="max-h-72 max-w-5xl overflow-y-scroll">
//             <div className="space-y-3">
//               <div className="text-sm font-medium border-b pb-2">
//                 Image Metadata
//               </div>
//               <div className="space-y-2">
//                 {Object.entries(metadata)
//                   .filter(([key]) => key.toLowerCase() !== "prompt")
//                   .map(([key, value]) => (
//                     <div key={key} className="flex justify-between items-start">
//                       <span className="text-sm capitalize font-medium">
//                         {capitalizeKey(key)}
//                       </span>
//                       <span className="text-sm text-right max-w-32 break-words">
//                         {formatMetadataValue(value)}
//                       </span>
//                     </div>
//                   ))}
//               </div>
//             </div>
//           </PopoverContent>
//         </Popover>
//       </div>

//       {/* Main Image */}
//       <div
//         onClick={(e) => {
//           e.stopPropagation();
//           setIsModalOpen(true);
//         }}
//       >
//         <img src={src} alt={alt} className="w-full h-full" />
//       </div>

//       {/* Like/Dislike Hover Bar */}
//       <div className="absolute bottom-0 w-full py-3 px-4 flex items-center justify-between text-white bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//         <div className="text-sm font-medium shadow-2xl">Rate this image</div>
//         <div className="flex space-x-5">
//           <DislikeIcon
//             onClick={() => handleLikeDislike?.(false)}
//             size={16}
//             color={isLiked === false ? "#636AE8" : "white"}
//           />
//           <LikeIcon
//             onClick={() => handleLikeDislike?.(true)}
//             size={16}
//             color={isLiked === true ? "#636AE8" : "white"}
//           />
//         </div>
//       </div>

//       {/* Image Modal */}
//       <ImageModal
//         imageUrl={src}
//         onClose={() => setIsModalOpen(false)}
//         alt={alt}
//         isOpen={isModalOpen}
//       />
//     </div>
//   );
// };

import React, { useState } from "react";
import { PinIcon, LikeIcon, DislikeIcon } from "@/components/ui/custom-icon";
import { CircleX, Copy, Expand, Info, Check } from "lucide-react";
import { ImageModal } from "../../shared/ImageModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type ImageDisplayProps = {
  src: string;
  alt: string;
  className?: string;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
  isLiked?: boolean | null;
  handleLikeDislike?: (liked: boolean) => void;
  prompt?: string;
  metadata?: Record<string, any>;
  checkbox?: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  };
};

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  src,
  alt,
  className = "",
  isLiked,
  handleLikeDislike,
  prompt = "",
  metadata = {},
  checkbox,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyPopoverOpen, setCopyPopoverOpen] = useState(false);
  const [metadataPopoverOpen, setMetadataPopoverOpen] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Copied to clipboard!", {
        position: "top-right",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy", {
        position: "top-right",
      });
    }
  };

  const formatMetadataValue = (value: any): string => {
    if (
      typeof value === "string" &&
      value.includes("T") &&
      value.includes("Z")
    ) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Top Action Icons */}
      <div className="flex justify-end gap-x-1 pb-2">
        <TooltipIconButton tooltip="Remove">
          <CircleX size={20} className="cursor-pointer" />
        </TooltipIconButton>
        {/* Expand Icon with Modal Trigger */}
        <TooltipIconButton tooltip="Expand">
          <Expand
            size={20}
            className="cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        </TooltipIconButton>
        {/* Copy Icon with Popover */}
        <Popover open={copyPopoverOpen} onOpenChange={setCopyPopoverOpen}>
          <PopoverTrigger asChild>
            <TooltipIconButton tooltip="Copy Prompt">
              <Copy className="cursor-pointer" />
            </TooltipIconButton>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="text-sm font-medium">Prompt</div>
              <div className="text-sm bg-muted p-3 rounded border max-h-32 overflow-y-auto">
                {prompt}
              </div>
              <Button
                onClick={handleCopyPrompt}
                className="w-full"
                variant="default"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <TooltipIconButton tooltip="Pin">
          <PinIcon size={20} className="cursor-pointer" />
        </TooltipIconButton>
        {/* Metadata Info Icon */}
        <Popover
          open={metadataPopoverOpen}
          onOpenChange={setMetadataPopoverOpen}
        >
          <PopoverTrigger asChild>
            <TooltipIconButton tooltip="Info">
              <Info className="cursor-pointer" />
            </TooltipIconButton>
          </PopoverTrigger>
          <PopoverContent className="max-h-72 max-w-5xl overflow-y-scroll">
            <div className="space-y-3">
              <div className="text-sm font-medium border-b pb-2">
                Image Metadata
              </div>
              <div className="space-y-2">
                {Object.entries(metadata)
                  .filter(([key]) => key.toLowerCase() !== "prompt")
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-sm capitalize font-medium">
                        {capitalizeKey(key)}
                      </span>
                      <span className="text-sm text-right max-w-32 break-words">
                        {formatMetadataValue(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
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

      {checkbox && (
        <div className="absolute top-9 left-0 z-10 w-full text-white bg-gradient-to-b from-black/85">
          <Checkbox
            checked={checkbox.checked}
            onCheckedChange={checkbox.onCheckedChange}
            className="mt-2 ml-2"
          />
        </div>
      )}

      {/* Like/Dislike Hover Bar */}

      <div className="absolute bottom-0 w-full py-3 px-4 flex items-center justify-between text-white bg-gradient-to-t from-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
