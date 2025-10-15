import { GalleryItemResponse } from "@/types/gallery.types";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { PlayCircle, PauseCircle } from "lucide-react";
import { handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import ImageWithMetadataModal from "@/components/image-metadata/ImageWithMetadataModal";

interface MediaImageProps {
  item: GalleryItemResponse;
  onImageLoad: (event: any) => void;
  onEditClick: (item: GalleryItemResponse) => void;
  onToggleFavorite: () => void;
  isMediaSelectDialog?: boolean;
}

export function MediaImage({
  item,
  onImageLoad,
  onToggleFavorite,
  isMediaSelectDialog = false,
}: MediaImageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Check if the item is a video with more robust detection
  const isVideo =
    item.asset_type === "video" ||
    item.latest_version_asset_type === "video" ||
    // Also check URL extensions as fallback
    (item.asset_url && /\.(mp4|webm|mov|avi|mkv)$/i.test(item.asset_url)) ||
    (item.preview_url && /\.(mp4|webm|mov|avi|mkv)$/i.test(item.preview_url));

  useEffect(() => {
    if (isVideo && videoRef.current) {
      const video = videoRef.current;

      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleLoadedData = () => {
        setVideoLoaded(true);
        setVideoError(false);
        // Create a synthetic event that mimics an image load event
        const syntheticEvent = {
          target: {
            naturalWidth: video.videoWidth || 1920,
            naturalHeight: video.videoHeight || 1080,
          },
        };
        onImageLoad(syntheticEvent);
      };
      const handleError = () => {
        console.error("Video failed to load:", item.asset_url);
        setVideoError(true);
        setVideoLoaded(false);
      };

      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("loadedmetadata", handleLoadedData);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("loadedmetadata", handleLoadedData);
        video.removeEventListener("error", handleError);
      };
    }
  }, [isVideo, onImageLoad, item.asset_url]);

  const handleVideoToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleImageClick = () => {
    if (!isMediaSelectDialog) {
      setShowImageModal(true);
    }
  };

  const handleVideoClick = (e?: React.MouseEvent) => {
    if (isMediaSelectDialog) {
      // In media select dialog, let the parent handle the click
      return;
    }
    if (e) {
      e.stopPropagation();
    }
    if (videoRef && videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    if (isVideo) {
      handleDownloadVideo(item.asset_url || item.preview_url || "");
    } else {
      handleDownloadImage(item.asset_url || item.preview_url || "");
    }
  };

  const { updateAutoFillSuggestionCache } = useMoodboardQuery({});

  const handleFavoriteClick = () => {
    const newIsFavourite = !item.is_favourite;
    onToggleFavorite();
    updateAutoFillSuggestionCache(item.id, newIsFavourite);
  };

  if (isVideo && !videoError) {
    return (
      <div
        className="relative w-full h-full"
        onClick={handleVideoClick}
        title={isMediaSelectDialog ? undefined : "Click to fullscreen"}
        style={{ cursor: isMediaSelectDialog ? "default" : "pointer" }}
      >
        <video
          ref={videoRef}
          src={item.preview_url || item.asset_url}
          className="object-contain w-full h-full"
          muted
          autoPlay
          loop
          style={{
            display: videoLoaded ? "block" : "none",
          }}
        />
        {videoLoaded && (
          <button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center rounded-full hover:bg-black/20 transition-colors"
            onClick={handleVideoToggle}
          >
            {isVideoPlaying ? (
              <PauseCircle className="w-16 h-16 text-white z-20 hover:scale-105 transition-transform opacity-0 group-hover:opacity-100" />
            ) : (
              <PlayCircle className="w-16 h-16 text-white z-20 hover:scale-105 transition-transform" />
            )}
          </button>
        )}
      </div>
    );
  }

  // Fallback to image rendering (either not a video or video failed to load)
  return (
    <>
      <Image
        src={item.preview_url || item.asset_url || "/placeholder.svg"}
        alt={item.asset_title}
        fill
        className="object-cover"
        style={{ cursor: isMediaSelectDialog ? "default" : "pointer" }}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        onLoad={onImageLoad}
        onError={(e) => {
          console.error("Image failed to load:", item.asset_url);
          // You could set a fallback image here
          e.currentTarget.src = "/placeholder.svg";
        }}
        quality={30}
        loading="lazy"
        onClick={handleImageClick}
        draggable={false} // Prevent native HTML drag
      />

      {showImageModal && (
        <ImageWithMetadataModal
          isOpen={showImageModal}
          galleryItem={{
            ...item,
            asset_url: item.preview_url || item.asset_url,
          }}
          onClose={() => setShowImageModal(false)}
          onDownload={handleDownload}
          onLike={handleFavoriteClick}
          isLiked={item.is_favourite || false}
          source="media-gallery"
        />
      )}
    </>
  );
}
