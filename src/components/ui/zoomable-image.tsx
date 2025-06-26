import React, { DetailedHTMLProps, ImgHTMLAttributes, useState } from "react";
import { ImageModal } from "../shared/ImageModal";

export default function ZoomableImage({
  src,
  alt,
  className,
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <img
        src={typeof src === "string" ? src : URL.createObjectURL(src)}
        alt={alt}
        onClick={() => setIsOpen(true)}
        className={`hover:cursor-zoom-in ${
          className
            ? className
            : "object-contain cursor-pointer rounded pt-2 h-[400px] w-full "
        }`}
      />
      <ImageModal
        imageUrl={typeof src === "string" ? src : URL.createObjectURL(src)}
        alt={alt}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
