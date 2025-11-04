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
}: ReferenceZoneProps) => {
  return (
    <div
      className={cn(
        "flex-1 border rounded-xl p-4 bg-background cursor-pointer transition-all min-w-0",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex flex-row items-center gap-2 mb-2 justify-between">
        <div className="flex flex-row items-center gap-2 min-w-0">
          <Icon className="h-5 w-5 shrink-0" />
          <div className="text-start min-w-0">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
        {type === "product" && images.length > 0 && onToggleMagic && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <TooltipButton
              tooltip={
                isMagicEnabled
                  ? "Disable magic enhance"
                  : "Enable magic enhance"
              }
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

      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div
            key={url}
            className="relative w-20 h-20 rounded-lg shrink-0"
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
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-background/50 hover:bg-background"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
