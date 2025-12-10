import { LucideIcon, Plus, SkipBack, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ZoomableImage from "@/components/ui/zoomable-image";
import { useMemo } from "react";
import { useA2iStore } from "@/store/a2i.store";

interface VideoFrameZoneProps {
  zone: "first" | "last";
  icon?: LucideIcon;
  title: string;
  description: string;
  assets: string[];
  selectedOtherType?: "start" | "end";
  onSelectType?: (type: "start" | "end") => void;

  isSelected: boolean;
  onClick: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, url: string, assetType?: string) => void;
  onRemoveImage: (url: string) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  onPaste?: (e: React.ClipboardEvent) => void;
  setFrame: (zone: "start" | "end", url: string | null) => void;
}

export const VideoFrameZone = ({
  zone,
  icon: Icon,
  title,
  description,
  assets,
  selectedOtherType,
  onSelectType,
  isSelected,
  onClick,
  onDrop,
  onDragStart,
  onRemoveImage,
  onAddClick,
  showAddButton = false,
  onPaste,
  setFrame,
}: VideoFrameZoneProps) => {
  const { otherFrames } = useA2iStore();

  // ---- Extract frames for FIRST zone ----
  const firstZoneFrames = useMemo(
    () => otherFrames.filter((f) => f.zone === "first"),
    [otherFrames]
  );
  const firstStartFrame = firstZoneFrames.find((f) => f.type === "start")?.url;
  const firstEndFrame = firstZoneFrames.find((f) => f.type === "end")?.url;

  // ---- Extract frames for LAST zone ----
  const lastZoneFrames = useMemo(
    () => otherFrames.filter((f) => f.zone === "last"),
    [otherFrames]
  );
  const lastStartFrame = lastZoneFrames.find((f) => f.type === "start")?.url;
  const lastEndFrame = lastZoneFrames.find((f) => f.type === "end")?.url;

  const startFrame = zone === "first" ? firstStartFrame : lastStartFrame;
  const endFrame = zone === "first" ? firstEndFrame : lastEndFrame;

  const hasOtherFrames = !!startFrame || !!endFrame;

  const getSelectedFrame = () => {
    if (!selectedOtherType) return null;
    return selectedOtherType === "start" ? startFrame : endFrame;
  };

  const selectedFrameUrl = getSelectedFrame();

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

        {/* Toggle buttons (Only when otherFrames exist) */}
        {hasOtherFrames && (
          <div className="flex items-center gap-4">
            {/* First Frame Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectType?.("start");
                if (startFrame) {
                  if (zone === "first") setFrame("start", startFrame);
                  else setFrame("end", startFrame);
                }
              }}
              className={cn(
                "text-xs flex flex-col items-center gap-1",
                selectedOtherType === "start"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <SkipBack className="w-4 h-4" />
              First Frame
            </button>

            {/* Last Frame Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectType?.("end");
                if (endFrame) {
                  if (zone === "first") setFrame("start", endFrame);
                  else setFrame("end", endFrame);
                }
              }}
              className={cn(
                "text-xs flex flex-col items-center gap-1",
                selectedOtherType === "end"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <SkipForward className="w-4 h-4" />
              Last Frame
            </button>
          </div>
        )}
      </div>

      {/* Image Section */}
      <div className="flex flex-wrap gap-2 items-start">
        {/* When extracted frames exist → show only selected frame */}
        {hasOtherFrames && selectedFrameUrl && (
          <div className="relative rounded-lg shrink-0 w-16 h-16">
            <ZoomableImage
              src={selectedFrameUrl}
              alt={`${selectedOtherType} frame`}
              className="w-full h-full object-cover rounded-lg"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(selectedFrameUrl);
              }}
              className="p-1 absolute -top-2 -right-2 bg-primary rounded-full text-white hover:bg-destructive z-10"
            >
              <X className="h-2 w-2" />
            </button>
          </div>
        )}

        {/* Fallback → normal images if no otherFrames */}
        {!hasOtherFrames &&
          assets.map((url) => (
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

        {/* Add button if empty and no extracted frames */}
        {!hasOtherFrames &&
          assets.length === 0 &&
          showAddButton &&
          onAddClick && (
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
