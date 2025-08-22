import { Loader2 } from "lucide-react";

interface MediaGalleryStatusDisplayProps {
  galleryStatus: "pending" | "error" | "success";
  galleryItemsLength: number;
}

export function MediaGalleryStatusDisplay({
  galleryStatus,
  galleryItemsLength,
}: MediaGalleryStatusDisplayProps) {
  if (galleryStatus === "pending") {
    return (
      <div className="flex justify-center min-h-96 items-center py-36 2xl:py-60">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (galleryStatus === "error") {
    return (
      <div className="flex justify-center min-h-96 items-center py-20">
        <p className="text-red-500">Error loading gallery items</p>
      </div>
    );
  }

  if (galleryItemsLength === 0) {
    return (
      <div className="flex justify-center min-h-96 items-center py-20">
        <p className="text-gray-500">No items found</p>
      </div>
    );
  }

  return null;
}
