// 6. MediaUploadFileItem (individual file status item)
import { Button } from "@/components/ui/button";
import { getStatusColor, getStatusIcon } from "@/lib/gallery.utils";
import { MediaWithStatus } from "@/types/gallery.types";
import { Link, X } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadFileItemProps {
  mediaItem: MediaWithStatus;
  index: number;
  onRemove: (index: number) => void;
}

export function MediaUploadFileItem({
  mediaItem,
  index,
  onRemove,
}: MediaUploadFileItemProps) {
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "error":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "uploading":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div
      className={`flex items-center justify-between text-xs py-2 px-3 rounded-md border ${getStatusBgColor(
        mediaItem.status
      )}`}
    >
      <div className="flex items-center min-w-0 flex-1">
        {getStatusIcon(mediaItem.status)}
        <span
          className={`ml-2 truncate ${getStatusColor(mediaItem.status)}`}
          title={
            mediaItem.type === "url" ? mediaItem.originalUrl : mediaItem.name
          }
        >
          {mediaItem.type === "url" && <Link className="inline w-3 h-3 mr-1" />}
          {mediaItem.name}
        </span>
      </div>
      <div className="flex items-center ml-2">
        {mediaItem.status === "error" && (
          <span className="text-xs text-red-500 mr-2" title={mediaItem.error}>
            Failed
          </span>
        )}
        {mediaItem.status === "success" && mediaItem.url && (
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-xs text-blue-500 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(mediaItem.url!);
              toast.success("URL copied to clipboard");
            }}
          >
            Copy URL
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-auto ml-1"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
