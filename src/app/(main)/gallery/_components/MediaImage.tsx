import { GalleryItemResponse } from "@/types/gallery.types";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { PlayCircle, PauseCircle } from "lucide-react";
import { handleDownloadImage, handleDownloadVideo } from "@/lib/utils";
import { useMoodboardQuery } from "@/hooks/useMoodboardQuery";
import ImageWithMetadataModal from "@/components/image-metadata/ImageWithMetadataModal";
import VideoWithMetadataModal from "@/components/video-metadata/VideoWithMetadataModal";
import { useGalleryFilterStore } from "@/store/gallery-filter.store";

interface MediaImageProps {
  item: GalleryItemResponse;
  onImageLoad: (event: any) => void;
  onEditClick?: (item: GalleryItemResponse) => void;
  onToggleFavorite: () => void;
  isMediaSelectDialog?: boolean;
  isEasySelectionMode?: boolean;
}

export function MediaImage({
  item,
  onImageLoad,
  onToggleFavorite,
  isMediaSelectDialog = false,
  isEasySelectionMode = false,
}: MediaImageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const isAutoPlay = useGalleryFilterStore((state) => state.isAutoPlay);

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

  useEffect(() => {
    const video = videoRef.current;
    if (video && isAutoPlay) {
      video.muted = true; // ensure autoplay policy compliance
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay failed:", err);
        });
      }
    } else if (video && !isAutoPlay) {
      video.pause();
    }
  }, [isAutoPlay]);

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
    // Don't open modal in media select dialog or easy selection mode
    if (!isMediaSelectDialog && !isEasySelectionMode) {
      setShowImageModal(true);
    }
  };

  const handleVideoClick = () => {
    // Don't open modal in easy selection mode
    if (!isEasySelectionMode) {
      setShowVideoModal(true);
    }
  };

  const handleDownload = () => {
    if (isVideo) {
      handleDownloadVideo(item.preview_url || item.asset_url || "");
    } else {
      handleDownloadImage(item.preview_url || item.asset_url || "");
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
      <>
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={handleVideoClick}
          title="Click to view metadata"
        >
          {isAutoPlay ? (
            <video
              ref={videoRef}
              src={item.preview_url || item.asset_url}
              className="object-contain w-full h-full"
              muted
              autoPlay={isAutoPlay}
              loop={isAutoPlay}
              style={{
                display: videoLoaded ? "block" : "none",
              }}
            />
          ) : (
            <video
              ref={videoRef}
              src={item.preview_url || item.asset_url}
              className="object-contain w-full h-full"
              muted
              style={{
                display: videoLoaded ? "block" : "none",
              }}
            />
          )}
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

        {/* ✅ Video Metadata Modal */}
        {showVideoModal && (
          <VideoWithMetadataModal
            isOpen={showVideoModal}
            galleryItem={{
              ...item,
              asset_url: item.preview_url || item.asset_url,
            }}
            onClose={() => setShowVideoModal(false)}
            onDownload={handleDownload}
            onLike={handleFavoriteClick}
            isLiked={item.is_favourite || false}
            source="media-gallery"
          />
        )}
      </>
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
          galleryItem={item}
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
