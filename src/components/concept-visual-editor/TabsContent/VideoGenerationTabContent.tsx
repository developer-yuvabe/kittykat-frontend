import VideoGeneration from "@/components/chatbot/a2i/features/VideoGeneration";
import { GalleryItemResponse } from "@/types/gallery.types";
import React from "react";

type VideoGenerationTabContentProps = {
  versionsRef: React.RefObject<HTMLDivElement | null>;
  currentAssetVersion: GalleryItemResponse | null;
};

const VideoGenerationTabContent = ({
  versionsRef,
}: VideoGenerationTabContentProps) => {
  return <VideoGeneration heightRef={versionsRef} />;
};

export default VideoGenerationTabContent;
