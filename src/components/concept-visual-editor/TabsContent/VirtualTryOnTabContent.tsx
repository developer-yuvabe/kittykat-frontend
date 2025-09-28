import VirtualTryOn from "@/components/chatbot/a2i/features/VirtualTryOn";
import { GalleryItemResponse } from "@/types/gallery.types";
import React from "react";

type VirtualTryOnTabContentProps = {
  currentAssetVersion: GalleryItemResponse | null;
};

const VirtualTryOnTabContent = ({
  currentAssetVersion,
}: VirtualTryOnTabContentProps) => {
  return <VirtualTryOn modelImage={currentAssetVersion?.asset_url} />;
};

export default VirtualTryOnTabContent;
