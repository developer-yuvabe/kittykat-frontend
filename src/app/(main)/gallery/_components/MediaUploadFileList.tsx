import { MediaWithStatus } from "@/types/gallery.types";
import { MediaUploadFileItem } from "./MediaUploadFileItem";

// 5. MediaUploadFileList (list of uploading/uploaded files)
interface MediaUploadFileListProps {
  mediaWithStatus: MediaWithStatus[];
  onRemoveItem: (index: number) => void;
}

export function MediaUploadFileList({
  mediaWithStatus,
  onRemoveItem,
}: MediaUploadFileListProps) {
  return (
    <div className="mt-4 w-full max-w-md">
      <p className="text-xs font-medium text-gray-700 mb-1">Media:</p>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {mediaWithStatus.map((mediaItem, index) => (
          <MediaUploadFileItem
            key={index}
            mediaItem={mediaItem}
            index={index}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
}
