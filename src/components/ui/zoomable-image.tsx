import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import React, { DetailedHTMLProps, ImgHTMLAttributes } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function ZoomableImage({
  src,
  alt,
  className,
}: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>) {
  if (!src) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={`hover:cursor-zoom-in ${
            className
              ? className
              : "object-contain cursor-pointer rounded pt-2 h-[400px] w-full "
          }`}
        />
      </DialogTrigger>
      <DialogContent className="p-0 bg-transparent border-0 border-none max-w-7xl ">
        <DialogHeader className="hidden">
          <VisuallyHidden>
            <DialogTitle>Zoomed Image</DialogTitle>
            <DialogDescription />
          </VisuallyHidden>
        </DialogHeader>
        <DialogClose asChild>
          <div className="relative h-[calc(100vh-220px)] w-full overflow-clip rounded-md bg-transparent shadow-md cursor-crosshair">
            <Image
              src={typeof src === "string" ? src : URL.createObjectURL(src)}
              fill
              alt={alt || ""}
              className="object-contain w-full h-full"
            />
          </div>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
