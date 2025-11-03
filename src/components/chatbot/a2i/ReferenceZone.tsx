import { X } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ZoomableImage from "@/components/ui/zoomable-image";

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
}

export const ReferenceZone = ({
  icon: Icon,
  title,
  description,
  images,
  isSelected,
  onClick,
  onDrop,
  onDragStart,
  onRemoveImage,
}: ReferenceZoneProps) => {
  return (
    <div
      className={cn(
        "flex-1 border rounded-xl p-4 bg-background cursor-pointer transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex flex-row items-center gap-2 mb-2">
        <Icon className="h-5 w-5" />
        <div className="text-start">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div
            key={url}
            className="relative w-20 h-20 rounded-lg"
            draggable
            onDragStart={(e) => onDragStart(e, url)}
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
      </div>
    </div>
  );
};
