import { ComponentProps } from "react";
import type { Photo } from "react-photo-album";

type OverlayProps = ComponentProps<"div"> & {
  photo: Photo;
  width: number;
  height: number;
  padding?: string;
  isPlaceholder?: boolean;
};

export default function Overlay({
  photo: { src, alt, srcSet },
  width,
  height,
  padding,
  isPlaceholder = false,
  style,
  ...rest
}: OverlayProps) {
  if (isPlaceholder) {
    return (
      <div
        style={{
          padding,
          width,
          height,
          ...style,
        }}
        {...rest}
      >
        <div className="w-[150px] h-[180px] bg-neutral-300 flex flex-col items-center justify-center rounded border-2  border-neutral-400"></div>
      </div>
    );
  }

  return (
    <div style={{ padding, ...style }} {...rest}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={`${width}px`}
        srcSet={srcSet
          ?.map((image) => `${image.src} ${image.width}w`)
          .join(", ")}
      />
    </div>
  );
}
