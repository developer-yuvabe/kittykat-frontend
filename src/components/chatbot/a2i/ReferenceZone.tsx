import { LucideIcon, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import ZoomableImage from "@/components/ui/zoomable-image";
import { TooltipButton } from "@/components/ui/tooltip-button";
import {
  MagicEnabledIcon,
  MagicDisabledIcon,
} from "@/components/ui/custom-icon";

interface ReferenceZoneProps {
  type: "master" | "product";
  icon: LucideIcon;
  title: string;
  description: string;
  images: string[];
  isSelected: boolean;
  onClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, url: string) => void;
  onRemoveImage: (url: string) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  isMagicEnabled?: boolean;
  onToggleMagic?: () => void;
  variant?: "default" | "tall" | "carousel";
  onPaste?: (e: React.ClipboardEvent) => void;
}

export const ReferenceZone = ({
  type,
  icon: Icon,
  title,
  description,
  images,
  isSelected,
  onClick,
  onDrop,
  onDragStart,
  onRemoveImage,
  onAddClick,
  showAddButton = false,
  isMagicEnabled,
  onToggleMagic,
  variant = "default",
  onPaste,
}: ReferenceZoneProps) => {
  const isTall = variant === "tall";
  const isCarousel = variant === "carousel";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (isCarousel) {
    return (
      <div
        id="reference-zone"
        className={cn(
          "border rounded-xl bg-background cursor-pointer transition-all flex flex-row items-stretch overflow-hidden",
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50",
          "w-full min-h-16 h-auto"
        )}
        onClick={onClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
      >
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-between p-6 border-r border-border min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-3 min-w-0">
              <Icon className="shrink-0 h-6 w-6" />
              <div className="flex flex-col min-w-0 justify-center gap-1">
                <p className="font-semibold leading-tight text-sm">{title}</p>
                <p className="text-muted-foreground leading-snug text-xs">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {type === "product" && images.length > 0 && onToggleMagic && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <TooltipButton
                tooltip="Product Reference Prompt Enhance"
                icon={
                  isMagicEnabled ? (
                    <MagicEnabledIcon color="#7F55E0" size={22} />
                  ) : (
                    <MagicDisabledIcon color="#6B5FBA" size={22} />
                  )
                }
                size="md"
                className="px-2 py-2"
                onClick={onToggleMagic}
              />
            </div>
          )}
        </div>

        {/* Right Side - Image Carousel */}
        {images.length > 0 ? (
          <div className="w-40 flex items-center justify-between px-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="p-1 hover:bg-background rounded-lg transition-colors z-10"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="flex-1 flex justify-center items-center px-2 min-w-0">
              <div
                className="relative rounded-lg w-20 h-20 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ZoomableImage
                  src={images[currentImageIndex]}
                  alt={`${title} reference`}
                  className="w-full h-full object-cover rounded-lg"
                  variant="default"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(images[currentImageIndex]);
                  }}
                  className="p-1 absolute -top-2 -right-2 bg-primary rounded-full text-white hover:bg-destructive z-10"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="p-1 hover:bg-background rounded-lg transition-colors z-10"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="w-40 flex items-center justify-center">
            {showAddButton && onAddClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddClick();
                }}
                className="rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-background/50 hover:bg-background w-24 h-24"
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="reference-zone"
      className={cn(
        "flex-1 border rounded-xl bg-background cursor-pointer transition-all min-w-0 flex flex-col",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50",
        isTall ? "p-6 min-h-40" : "p-4"
      )}
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={0}
    >
      {/* Header */}
      <div
        className={cn(
          "flex flex-row items-center justify-between gap-3 mb-4",
          isTall && "mb-6"
        )}
      >
        <div className="flex flex-row items-center gap-3 min-w-0">
          <Icon className={cn("shrink-0", isTall ? "h-6 w-6" : "h-5 w-5")} />
          <div
            className={cn(
              "flex flex-col min-w-0 justify-center",
              isTall ? "gap-1" : "gap-0.5"
            )}
          >
            <p
              className={cn(
                "font-semibold leading-tight",
                isTall ? "text-base" : "text-sm"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-muted-foreground leading-snug",
                isTall ? "text-sm" : "text-xs"
              )}
            >
              {description}
            </p>
          </div>
        </div>

        {type === "product" && images.length > 0 && onToggleMagic && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <TooltipButton
              tooltip="Product Reference Prompt Enhance"
              icon={
                isMagicEnabled ? (
                  <MagicEnabledIcon color="#7F55E0" size={22} />
                ) : (
                  <MagicDisabledIcon color="#6B5FBA" size={22} />
                )
              }
              size="md"
              className="px-2 py-2"
              onClick={onToggleMagic}
            />
          </div>
        )}
      </div>

      {/* Image Section */}
      <div
        className={cn("flex flex-wrap gap-2 items-start", isTall && "gap-3")}
      >
        {images.map((url) => (
          <div
            key={url}
            className={cn("relative rounded-lg shrink-0  w-16 h-16")}
            draggable
            onDragStart={(e) => onDragStart(e, url)}
            onClick={(e) => e.stopPropagation()}
          >
            <ZoomableImage
              src={url}
              alt={`${title} reference`}
              className="w-full h-full object-cover rounded-lg"
              variant="default"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(url);
              }}
              className="p-1 absolute -top-2 -right-2 bg-primary rounded-full text-white hover:bg-destructive z-10"
            >
              <X className="h-2 w-2" />
            </button>
          </div>
        ))}

        {images.length === 0 && showAddButton && onAddClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            className={cn(
              "rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-background/50 hover:bg-background",
              isTall ? "w-24 h-24" : "w-20 h-20"
            )}
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
