// Media Image Component

import { GalleryItemResponse } from "@/types/gallery.types";
import Image from "next/image";

interface MediaImageProps {
  item: GalleryItemResponse;
  onImageLoad: (event: any) => void;
  onEditClick: (item: GalleryItemResponse) => void;
}

export function MediaImage({
  item,
  onImageLoad,
  onEditClick,
}: MediaImageProps) {
  return (
    <div>
      <Image
        src={item.preview_url || item.asset_url || "/placeholder.svg"}
        alt={item.asset_title}
        fill
        className="object-contain cursor-pointer"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        onLoad={onImageLoad}
        quality={30}
        loading="lazy"
        onClick={() => {
          onEditClick(item);
        }}
      />
    </div>
  );
}
