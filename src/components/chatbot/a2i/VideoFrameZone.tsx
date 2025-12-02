import { LucideIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ZoomableImage from "@/components/ui/zoomable-image";

interface VideoFrameZoneProps {
  type: "start" | "end";
  icon?: LucideIcon;
  title: string;
  description: string;
  assets: string[];
  isSelected: boolean;
  onClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, url: string) => void;
  onRemoveImage: (url: string) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  onPaste?: (e: React.ClipboardEvent) => void;
}

export const VideoFrameZone = ({
  type,
  icon: Icon,
  title,
  description,
  assets,
  isSelected,
  onClick,
  onDrop,
  onDragStart,
  onRemoveImage,
  onAddClick,
  showAddButton = false,
  onPaste,
}: VideoFrameZoneProps) => {
  return (
    <div
      id="reference-zone"
      className={cn(
        "flex-1 border rounded-xl bg-background cursor-pointer transition-all min-w-0 flex flex-col",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50",
        "p-4"
      )}
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onPaste={onPaste}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-3 mb-4">
        <div className="flex flex-row items-center gap-3 min-w-0">
          {Icon && <Icon className="shrink-0 h-5 w-5" />}
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <p className="font-semibold leading-tight text-sm">{title}</p>
            <p className="text-muted-foreground leading-snug text-xs">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="flex flex-wrap gap-2 items-start">
        {assets.map((url) => (
          <div
            key={url}
            className="relative rounded-lg shrink-0 w-16 h-16"
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

        {assets.length === 0 && showAddButton && onAddClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            className="rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center bg-background/50 hover:bg-background w-20 h-20"
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
