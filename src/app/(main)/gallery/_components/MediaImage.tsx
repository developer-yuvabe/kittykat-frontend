import { GalleryItemResponse } from "@/types/gallery.types";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { PlayCircle, PauseCircle } from "lucide-react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleMediaClick = () => {
    onEditClick(item);
  };

  if (isVideo && !videoError) {
    return (
      <div className="absolute inset-0 w-full h-full group">
        <video
          ref={videoRef}
          src={item.preview_url || item.asset_url}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          muted
          autoPlay={false}
          loop
          playsInline
          onClick={handleMediaClick}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            display: videoLoaded ? "block" : "none",
          }}
        />

        {/* Play/Pause button overlay */}
        {videoLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <button
              className="pointer-events-auto"
              onClick={handleVideoToggle}
              aria-label={isVideoPlaying ? "Pause video" : "Play video"}
            >
              {isVideoPlaying ? (
                <PauseCircle className="w-16 h-16 text-white hover:scale-105 transition-transform opacity-0 group-hover:opacity-100" />
              ) : (
                <PlayCircle className="w-16 h-16 text-white hover:scale-105 transition-transform" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback to image rendering (either not a video or video failed to load)
  return (
    <Image
      src={item.preview_url || item.asset_url || "/placeholder.svg"}
      alt={item.asset_title}
      fill
      className="object-cover cursor-pointer"
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
      onLoad={onImageLoad}
      onError={(e) => {
        console.error("Image failed to load:", item.asset_url);
        // You could set a fallback image here
        e.currentTarget.src = "/placeholder.svg";
      }}
      quality={30}
      loading="lazy"
      onClick={() => onEditClick(item)}
      draggable={false} // Prevent native HTML drag
    />
  );
}
