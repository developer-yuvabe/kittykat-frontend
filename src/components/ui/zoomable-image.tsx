import React, {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  useState,
  useRef,
} from "react";
import { ImageModal } from "../shared/ImageModal";
import { cn, handleDownloadImage } from "@/lib/utils";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { DownloadIcon } from "@/components/ui/custom-icon";
import { CopyIcon, HeartIcon, Check } from "lucide-react";

// 🔑 Control size for all overlay buttons (matching MediaOverlay)
const OVERLAY_CONTROL_SIZE = 5;

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

  // Only use prompt for copying, no alt fallback
  const copyText = prompt || "";

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
        <div className="relative group">
          <img {...baseImageProps} />
          <TooltipButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent any parent click
              handleDownload();
            }}
            tooltip="Download"
            icon={
              <DownloadIcon
                className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
              />
            }
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      );
    }

    // variant === "overlay"
    return (
      <div className="relative group overflow-hidden rounded">
        <img {...baseImageProps} />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded pointer-events-none" />

        {/* Bottom Left: Copy (only if prompt exists and is not empty) */}
        {prompt && prompt.trim() && (
          <TooltipButton
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            tooltip={copied ? "Copied!" : "Copy prompt"}
            icon={
              copied ? (
                <Check
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              ) : (
                <CopyIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
                />
              )
            }
            className="absolute bottom-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        )}

        {/* Download and Heart Buttons - Bottom Right (matching MediaOverlay) */}
        <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TooltipButton
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            tooltip="Download"
            icon={
              <DownloadIcon
                className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE}`}
              />
            }
          />

          {showLikeButton && (
            <TooltipButton
              onClick={(e) => {
                e.stopPropagation();
                handleLikeToggle();
              }}
              tooltip={isLiked ? "Unlike" : "Like"}
              icon={
                <HeartIcon
                  className={`h-${OVERLAY_CONTROL_SIZE} w-${OVERLAY_CONTROL_SIZE} ${
                    isLiked ? "fill-current" : ""
                  }`}
                />
              }
              isActive={isLiked}
              normalColor="text-white hover:text-red-300"
              activeColor="text-red-500"
              className="transition-all duration-300"
            />
          )}
        </div>

        {/* Bottom Gradient (matching MediaOverlay) */}
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent rounded-b" />
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
        onLike={
          variant === "download" || variant === "default"
            ? undefined
            : handleLikeToggle
        }
        isLiked={
          variant === "download" || variant === "default" ? undefined : isLiked
        }
      />
    </>
  );
}
