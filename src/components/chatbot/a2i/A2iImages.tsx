// components/A2IImages.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDisplay } from "./ImageDisplay";
import { ActionButtonsRow } from "./ActionButtonsRow";
import { ImageIcon } from "lucide-react";
import { ImageDetail } from "@/types/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type A2IImagesProps = {
  generatedImages: ImageDetail[];
};

export const A2IImages = ({ generatedImages }: A2IImagesProps) => {
  console.log("image data", generatedImages);

  const handleCreateVideo = (imageId: string) => {
    console.log("Creating video for image:", imageId);
  };

  const handleRemixImage = (imageId: string) => {
    console.log("Remixing image:", imageId);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-6">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No images generated yet
      </h3>
    </div>
  );

  return (
    <ContentSection
      title="A2I Images"
      content={
        <div className="space-y-6">
          {/* Images Grid */}
          {generatedImages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Carousel className="w-full h-auto">
                <CarouselContent className="mb-4">
                  {generatedImages.map((image, index) => (
                    <CarouselItem
                      key={image.id || index}
                      className="md:basis-1/2 lg:basis-1/3"
                    >
                      <div className=" h-full flex flex-col justify-between bg-white rounded-xl shadow-md p-6 ">
                        <div className="flex-1 flex items-center  justify-center">
                          <ImageDisplay
                            src={image.url}
                            alt={`Generated Image ${image.id}`}
                            className=" "
                            onSelect={undefined}
                            prompt={image.prompt}
                            metadata={image.parameters}
                          />
                        </div>

                        <ActionButtonsRow
                          className="flex justify-between mt-4"
                          buttons={[
                            {
                              label: "Create Video",
                              onClick: () => handleCreateVideo(image.id),
                              color: "#636AE8",
                              hoverColor: "#5b5fd1",
                            },
                            {
                              label: "Remix",
                              onClick: () => handleRemixImage(image.id),
                              color: "#EA916E",
                              hoverColor: "#e7845d",
                            },
                          ]}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <div className="flex justify-center mt-4">
                  <CarouselPrevious className="relative transform-none mx-2" />
                  <CarouselNext className="relative transform-none mx-2" />
                </div>
              </Carousel>
            </>
          )}
        </div>
      }
    />
  );
};
