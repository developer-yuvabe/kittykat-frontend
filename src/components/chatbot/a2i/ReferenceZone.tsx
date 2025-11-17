import { LucideIcon, Plus, X } from "lucide-react";
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
  variant?: "default" | "tall";
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
}: ReferenceZoneProps) => {
  const isTall = variant === "tall";

  return (
    <div
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
        className={cn(
          "flex flex-wrap gap-2 items-start",
          isTall && "gap-3"
        )}
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
