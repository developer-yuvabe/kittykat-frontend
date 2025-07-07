"use client";

import React, { useRef, useState, useEffect } from "react";
import ZoomableImage from "@/components/ui/zoomable-image";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { PlayCircle, PauseCircle } from "lucide-react";

import { useUndoRedoRemix } from "@/hooks/useUndoRedoRemix"; // Assuming used in parent
import RemixImage from "../../_components/remix/RemixImage";

interface AskKittykatImageSectionProps {
  item: GalleryItemResponse;
  galleryActions: GalleryActions;
  isRemixEnabled: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  offScreenCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  remixHistory?: ReturnType<typeof useUndoRedoRemix>;
  brushSize?: number;
}

const VideoPlayer: React.FC<{
  src: string;
  isLiked: boolean;
  onLike: () => void;
}> = ({ src, isLiked, onLike }) => {
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        className="object-contain w-full h-full cursor-pointer rounded-lg"
        style={{ maxHeight: "80vh" }}
        muted
        autoPlay
        loop
        playsInline
        onClick={togglePlayPause}
      />
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
    </div>
  );
};

export const AskKittykatImageSection: React.FC<
  AskKittykatImageSectionProps
> = ({
  item,
  galleryActions,
  isRemixEnabled,
  imageRef,
  canvasRef,
  offScreenCanvasRef,
  remixHistory,
  brushSize = 20,
}) => {
  const isVideo = item.asset_type === "video";

  const renderMedia = () => {
    if (isVideo) {
      return (
        <VideoPlayer
          src={item.asset_url}
          isLiked={item.is_favourite ?? false}
          onLike={() => galleryActions.toggleFavorite(item.id)}
        />
      );
    }

    // For images, check if remix is enabled
    if (
      isRemixEnabled &&
      remixHistory &&
      imageRef &&
      canvasRef &&
      offScreenCanvasRef
    ) {
      return (
        <RemixImage
          imageRef={imageRef}
          canvasRef={canvasRef}
          offScreenCanvasRef={offScreenCanvasRef}
          url={item.asset_url}
          remixHistory={remixHistory}
          brushSize={brushSize}
        />
      );
    }

    // Default image rendering
    return (
      <ZoomableImage
        src={item.asset_url}
        key={item.asset_url}
        className="object-contain rounded-lg max-h-[80vh]"
        variant="overlay"
        isLiked={item.is_favourite}
        onLike={() => galleryActions.toggleFavorite(item.id)}
      />
    );
  };

  return (
    <div className="flex-1 p-6 relative flex items-center justify-center min-h-0">
      <div className="w-full h-[80%] flex items-center justify-center">
        {renderMedia()}
      </div>
    </div>
  );
};
