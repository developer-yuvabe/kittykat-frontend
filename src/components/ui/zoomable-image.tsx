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
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation(); // Prevent any parent click
              handleDownload();
            }}
            tooltip="Download"
            variant="ghost"
            className="absolute top-2 right-2 text-white hover:text-black size-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DownloadIcon />
          </TooltipIconButton>
        </div>
      );
    }

    // variant === "overlay"
    return (
      <div className="relative group">
        <img {...baseImageProps} />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded" />

        {/* Top Right: Expand */}
        <TooltipIconButton
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          tooltip="Expand"
          variant="ghost"
          className="absolute top-2 right-2 text-white hover:text-black size-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExpandIcon />
        </TooltipIconButton>

        {/* Bottom Left: Download */}
        <TooltipIconButton
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          tooltip="Download"
          variant="ghost"
          className="absolute bottom-2 left-2 text-white hover:text-black size-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DownloadIcon />
        </TooltipIconButton>

        {/* Bottom Left Second Position: Copy (only if prompt exists and is not empty) */}
        {prompt && prompt.trim() && (
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            tooltip={copied ? "Copied!" : "Copy prompt"}
            variant="ghost"
            className="absolute bottom-2 left-12 text-white hover:text-black size-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <Check /> : <CopyIcon />}
          </TooltipIconButton>
        )}

        {/* Bottom Right: Like (conditionally rendered) */}
        {showLikeButton && (
          <TooltipIconButton
            onClick={(e) => {
              e.stopPropagation();
              handleLikeToggle();
            }}
            tooltip={isLiked ? "Unlike" : "Like"}
            variant="ghost"
            className="absolute bottom-2 right-2 text-white hover:text-black size-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <HeartIcon className={isLiked ? "fill-red-500 text-red-500" : ""} />
          </TooltipIconButton>
        )}
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
