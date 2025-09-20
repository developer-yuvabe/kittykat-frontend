import React, {
  DetailedHTMLProps,
  VideoHTMLAttributes,
  useState,
  useRef,
  useEffect,
} from "react";
import { VideoModal } from "../shared/VideoModal"; // Assuming you have this
import { cn, handleDownloadVideo } from "@/lib/utils"; // Assuming you have handleDownloadVideo
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { ExpandIcon, DownloadIcon } from "@/components/ui/custom-icon";
import {
  CopyIcon,
  HeartIcon,
  Check,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

interface ZoomableVideoProps
  extends Omit<
    DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>,
    "src"
  > {
  src: string; // Now required and strictly a string URL
  isLiked?: boolean;
  onLike?: () => void;
  prompt?: string;
  variant?: "default" | "overlay" | "download";
}

export default function ZoomableVideo({
  src,
  className,
  isLiked: isLikedProp,
  onLike,
  prompt,
  variant = "default",
  ...videoProps
}: ZoomableVideoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!src) return null;

  const videoUrl = src;
  const copyText = prompt ?? "";

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

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyText) {
      navigator.clipboard.writeText(copyText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownloadVideo(videoUrl);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const showLikeButton =
    typeof isLikedProp === "boolean" && typeof onLike === "function";
  const isLiked = showLikeButton ? isLikedProp : localLiked;

  const handleLikeToggle = () => {
    if (showLikeButton) {
      onLike?.();
    } else {
      setLocalLiked((prev) => !prev);
    }
  };

  const handleVideoClick = () => {
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

  // Render based on variant
  const renderVideo = () => {
    const baseVideoProps = {
      ref: videoRef,
      src: videoUrl,
      className: className,
      muted: true,
      autoPlay: false,
      loop: true,
    };

    if (variant === "default") {
      return (
        <div className="relative">
          {/* Clicking the video itself → fullscreen */}
          <video {...baseVideoProps} onClick={handleVideoClick} />

          {/* Play/Pause button → only icon in the center, not full overlay */}
          <button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation(); // prevent fullscreen
              togglePlayPause();
            }}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <PauseCircle className="w-5 h-5 text-white hover:scale-110 transition-transform" />
            ) : (
              <PlayCircle className="w-5 h-5 text-white hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      );
    }

    if (variant === "download") {
      return (
        <div className="relative">
          <video {...baseVideoProps} onClick={togglePlayPause} />
          <button
            className="absolute inset-0 flex items-center justify-center"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <PauseCircle className="w-16 h-16 text-white hover:scale-105 transition-transform opacity-0 hover:opacity-100" />
            ) : (
              <PlayCircle className="w-16 h-16 text-white hover:scale-105 transition-transform" />
            )}
          </button>
          <button
            className="absolute -top-1 left-12 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1 hover:bg-white"
            onClick={handleDownload}
          >
            <DownloadIcon className="w-4 h-4 text-gray-700 hover:text-black" />
          </button>
        </div>
      );
    }

    // variant === "overlay"
    return (
      <div className={"relative group"}>
        <video {...baseVideoProps} />

        {/* Play/Pause Button - Always visible for videos */}
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? (
            <PauseCircle className="w-16 h-16 text-white hover:scale-105 transition-transform opacity-0 group-hover:opacity-100" />
          ) : (
            <PlayCircle className="w-16 h-16 text-white hover:scale-105 transition-transform" />
          )}
        </button>

        {/* Overlay - Same as image */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 rounded-lg" />

          <div className="absolute inset-0 flex justify-between flex-col p-2 pointer-events-none">
            {/* Top Right: Expand */}
            <div className="flex justify-end">
              <TooltipIconButton
                onClick={handleExpand}
                tooltip="Expand"
                variant="ghost"
                className="text-white hover:text-black size-7 pointer-events-auto"
              >
                <ExpandIcon />
              </TooltipIconButton>
            </div>

            {/* Bottom: Left icons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <TooltipIconButton
                  onClick={handleDownload}
                  tooltip="Download"
                  variant="ghost"
                  className="text-white hover:text-black size-7 pointer-events-auto"
                >
                  <DownloadIcon />
                </TooltipIconButton>
                {copyText && (
                  <TooltipIconButton
                    onClick={handleCopy}
                    tooltip="Copy"
                    variant="ghost"
                    className="text-white hover:text-black size-7 pointer-events-auto"
                  >
                    {copied ? <Check /> : <CopyIcon />}
                  </TooltipIconButton>
                )}
              </div>

              {/* Bottom Right: Like (conditionally rendered) */}
              {showLikeButton && (
                <TooltipIconButton
                  onClick={handleLikeToggle}
                  tooltip="Like"
                  variant="ghost"
                  className="text-white hover:text-red-500 size-7 pointer-events-auto"
                >
                  <HeartIcon
                    className={cn({
                      "text-red-500 fill-red-500": isLiked,
                    })}
                  />
                </TooltipIconButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderVideo()}

      {/* Modal */}
      <VideoModal
        videoUrl={videoUrl}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDownload={() => handleDownloadVideo(videoUrl)}
        onLike={handleLikeToggle}
        isLiked={isLiked}
      />
    </>
  );
}
