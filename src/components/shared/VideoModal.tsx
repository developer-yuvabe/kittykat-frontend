// VideoModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useRef, useState, useEffect } from "react";
import { DownloadIcon } from "../ui/custom-icon";
import { HeartIcon, PlayCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

interface VideoModalProps {
  videoUrl: string;
  onClose: () => void;
  isOpen: boolean;
  onDownload?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  videoUrl,
  onClose,
  isOpen,
  onDownload,
  onLike,
  isLiked,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader className="sr-only">
        <DialogTitle>Expanded Video</DialogTitle>
        <DialogDescription>Video player modal</DialogDescription>
      </DialogHeader>
      <DialogContent
        className="p-0 border-none bg-transparent shadow-none [&>button]:hidden w-[80vw] max-h-[80vh] max-w-screen-xl flex items-center justify-center cursor-zoom-out"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div
          className="relative rounded-lg shadow-2xl inline-block group"
          onClick={onClose}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="object-contain rounded-lg max-h-[90vh] max-w-[90vw] w-auto h-auto"
            muted
            loop
            playsInline
            onClick={togglePlayPause}
          />

          {/* Play/Pause Button - Always visible for videos */}
          <button
            className="absolute inset-0 flex items-center justify-center"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <PauseCircle className="w-20 h-20 text-white hover:scale-105 transition-transform opacity-0 group-hover:opacity-100" />
            ) : (
              <PlayCircle className="w-20 h-20 text-white hover:scale-105 transition-transform" />
            )}
          </button>

          {/* Hover Overlay */}
          <div className="absolute inset-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            {(onDownload || onLike) && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />
            )}

            {/* Bottom Left - Download Button with Tooltip */}
            {onDownload && (
              <div className="absolute bottom-2 left-3">
                <TooltipIconButton
                  tooltip="Download"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="text-white hover:text-black"
                >
                  <DownloadIcon className="!w-5 !h-5" />
                </TooltipIconButton>
              </div>
            )}

            {/* Bottom Right - Like Button with Tooltip */}
            {onLike && (
              <div className="absolute bottom-2 right-3">
                <TooltipIconButton
                  tooltip="Like"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  className="text-white hover:text-red-500"
                >
                  <HeartIcon
                    className={cn("!w-5 !h-5", {
                      "text-red-500 fill-red-500": isLiked,
                    })}
                  />
                </TooltipIconButton>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// utils.ts - Add this to your existing utils file
export const handleDownloadVideo = (videoUrl: string, filename?: string) => {
  try {
    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = videoUrl;

    // Set the download attribute with filename
    const videoFilename = filename || `video_${Date.now()}.mp4`;
    link.download = videoFilename;

    // Temporarily add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL if it was created from a File/Blob
    if (videoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrl);
    }
  } catch (error) {
    console.error("Download failed:", error);

    // Fallback: open in new tab
    try {
      window.open(videoUrl, "_blank");
    } catch (fallbackError) {
      console.error("Fallback download failed:", fallbackError);
    }
  }
};

// Alternative more robust download function with fetch (for cross-origin videos)
export const handleDownloadVideoWithFetch = async (
  videoUrl: string,
  filename?: string
) => {
  try {
    // Fetch the video
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error("Network response was not ok");

    // Convert to blob
    const blob = await response.blob();

    // Create object URL
    const objectUrl = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || `video_${Date.now()}.mp4`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Download failed:", error);

    // Fallback to simple download
    handleDownloadVideo(videoUrl, filename);
  }
};
