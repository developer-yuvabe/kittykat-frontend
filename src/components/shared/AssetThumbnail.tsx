import Image from "next/image";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { isVideoUrl } from "@/lib/utils";

interface AssetThumbnailProps {
  assetUrl: string;
  galleryItem?: GalleryItemResponse;
  alt?: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Reusable component for displaying asset thumbnails (images or videos)
 * Automatically detects if the asset is a video and renders appropriate element
 */
export const AssetThumbnail = ({
  assetUrl,
  galleryItem,
  alt = "Asset thumbnail",
  className = "w-full h-full object-cover",
  sizes,
  fill = false,
  width,
  height,
}: AssetThumbnailProps) => {
  // Check if the asset is a video
  const isVideo =
    galleryItem?.asset_type === "video" ||
    galleryItem?.latest_version_asset_type === "video" ||
    isVideoUrl(assetUrl);

  // Get the appropriate thumbnail URL
  const thumbnailUrl = isVideo
    ? galleryItem?.preview_url || assetUrl
    : assetUrl;

  if (!thumbnailUrl) return null;

  if (isVideo) {
    return (
      <video
        src={thumbnailUrl}
        className={className}
        muted
        autoPlay
        loop
        playsInline
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={thumbnailUrl}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={thumbnailUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
    />
  );
};
