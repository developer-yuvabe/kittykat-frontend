import React, {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  useState,
  useRef,
} from "react";
import { ImageModal } from "../shared/ImageModal";
import { cn, handleDownloadImage } from "@/lib/utils";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { ExpandIcon, DownloadIcon } from "@/components/ui/custom-icon";
import { CopyIcon, HeartIcon, Check } from "lucide-react";

interface ZoomableImageProps
  extends DetailedHTMLProps<
    ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  isLiked?: boolean;
  onLike?: () => void;
  prompt?: string;
  variant?: "default" | "overlay" | "download";
}

export default function ZoomableImage({
  src,
  alt,
  className,
  isLiked: isLikedProp,
  onLike,
  prompt,
  variant = "default",
}: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  if (!src) return null;

  const imageUrl = typeof src === "string" ? src : URL.createObjectURL(src);
  const copyText = prompt ?? alt ?? "";

  const handleCopy = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    handleDownloadImage(imageUrl);
  };

  const showLikeButton =
    typeof isLikedProp === "boolean" && typeof onLike === "function";
  const isLiked = showLikeButton ? isLikedProp : localLiked;

  const handleLikeToggle = () => {
    if (showLikeButton) {
      onLike?.();
    } else {
      setLocalLiked((prev) => !prev);
    }
  };

  // Render based on variant
  const renderImage = () => {
    const baseImageProps = {
      ref: imageRef,
      src: imageUrl,
      alt,
      onClick: () => setIsOpen(true),
      className: cn(
        "hover:cursor-zoom-in object-contain rounded w-full",
        variant === "download" && "select-none",
        className
      ),
    };

    if (variant === "default") {
      return <img {...baseImageProps} />;
    }
    if (variant === "download") {
      return (
        <div className="relative">
          <img {...baseImageProps} />
          <button
            className="absolute -top-1 left-12 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation(); // Prevent any parent click
              handleDownload();
            }}
          >
            <DownloadIcon className="w-4 h-4 text-gray-700 hover:text-black" />
          </button>
        </div>
      );
    }

    // variant === "overlay"
    return (
      <div className={"relative group"}>
        <img {...baseImageProps} />

        {/* Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />

          <div className="absolute inset-0 flex justify-between flex-col p-2">
            {/* Top Right: Expand */}
            <div className="flex justify-end">
              <TooltipIconButton
                onClick={() => setIsOpen(true)}
                tooltip="Expand"
                variant="ghost"
                className="text-white hover:text-black size-7"
              >
                <ExpandIcon />
              </TooltipIconButton>
            </div>

            {/* Bottom: Left icons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <TooltipIconButton
                  onClick={handleDownload}
                  tooltip="Download"
                  variant="ghost"
                  className="text-white hover:text-black size-7"
                >
                  <DownloadIcon />
                </TooltipIconButton>
                <TooltipIconButton
                  onClick={handleCopy}
                  tooltip="Copy"
                  variant="ghost"
                  className="text-white hover:text-black size-7"
                >
                  {copied ? <Check /> : <CopyIcon />}
                </TooltipIconButton>
              </div>

              {/* Bottom Right: Like (conditionally rendered) */}
              {showLikeButton && (
                <TooltipIconButton
                  onClick={handleLikeToggle}
                  tooltip="Like"
                  variant="ghost"
                  className="text-white hover:text-red-500 size-7"
                >
                  <HeartIcon
                    className={cn({
                      "text-red-500 fill-red-500": isLiked,
                    })}
                  />
                </TooltipIconButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderImage()}

      {/* Modal */}
      <ImageModal
        imageUrl={imageUrl}
        alt={alt}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDownload={handleDownload}
        onLike={handleLikeToggle}
        isLiked={isLiked}
      />
    </>
  );
}
