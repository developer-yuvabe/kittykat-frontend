import { GalleryItemResponse } from "@/types/gallery.types";

interface MediaImageDetailsProps {
  item: GalleryItemResponse;
}

// Image Details Component
export function MediaImageDetails({ item }: MediaImageDetailsProps) {
  if (!item.dimensions || !item.media_format || !item.asset_source) {
    return null;
  }

  return (
    <div className="bg-[#F3F4F6] font-bold text-sm p-4 rounded-md">
      <div className="space-y-1">
        <p className="text-gray-800">
          Size: {`${item.dimensions.width}x${item.dimensions.height}`}
        </p>
        <p className="text-gray-800">Format: {item.media_format}</p>
        <p className="text-gray-800">Source: {item.asset_source}</p>
      </div>
    </div>
  );
}
