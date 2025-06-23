import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { UploadedImage } from "@/types/moodboard.types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoodboardReferenceDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
  uploadedImages?: UploadedImage[];
}

export const MoodboardReferenceDropzone = ({
  onDrop,
  uploadedImages = [], // fallback to empty array
}: MoodboardReferenceDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/bmp": [".bmp"],
    },
  });

  const hasImages = uploadedImages.length > 0;

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors ${
          hasImages ? "p-2" : ""
        }`}
      >
        <CardContent className={`transition-all ${hasImages ? "p-4" : "p-8"}`}>
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer ${
              isDragActive ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-xl font-medium text-gray-900 mb-2">
                  Drop files here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported format: PNG, JPG
                </p>
                <p className="text-sm text-gray-400 mb-4">OR</p>
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Browse files
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasImages && (
        <Carousel className="w-full relative">
          <CarouselContent className="justify-center">
            {uploadedImages.map((img) => (
              <CarouselItem
                key={img.id}
                className="basis-auto px-2 w-24 group relative"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="aspect-square overflow-hidden rounded-md border border-gray-200 relative">
                        <Image
                          src={img.url}
                          alt={img.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Optional delete button */}
                        {/* <button
                          onClick={() => console.log("delete", img.id)} // Replace with delete handler
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button> */}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">{img.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      )}
    </div>
  );
};
