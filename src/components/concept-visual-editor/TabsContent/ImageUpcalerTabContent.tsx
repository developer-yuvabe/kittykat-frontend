import ImageUpscaler from "@/components/chatbot/a2i/features/ImageUpscaler";
import { GalleryItemResponse } from "@/types/gallery.types";
import React from "react";

type ImageUpcalerTabContentProps = {
  currentAssetVersion: GalleryItemResponse | null;
};

const ImageUpcalerTabContent = ({
  currentAssetVersion,
}: ImageUpcalerTabContentProps) => {
  return <ImageUpscaler initialImage={currentAssetVersion?.asset_url} />;
};

export default ImageUpcalerTabContent;
