// components/A2IImages.tsx

import { useState } from "react";
import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDisplay } from "./ImageDisplay";
import { ActionButtonsRow } from "./ActionButtonsRow";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, Wand2 } from "lucide-react";
import { ImageDetail } from "@/types/types";

type A2IImagesProps = {
  generatedImages: ImageDetail[];
};

export const A2IImages = ({
  generatedImages: initialImages,
}: A2IImagesProps) => {
  const [images, setImages] = useState<ImageDetail[]>(initialImages);

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
      <Button variant="default" className="mt-4 flex items-center">
        <Wand2 className="w-4 h-4 mr-2" />
        Generate
      </Button>
    </div>
  );

  return (
    <ContentSection
      title="A2I Images"
      content={
        <div className="space-y-6">
          {/* Images Grid */}
          {images.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <div key={image.id}>
                    <ImageDisplay
                      src={image.url}
                      alt={`Generated Image ${image.id}`}
                      className=""
                      onSelect={undefined}
                    />

                    <ActionButtonsRow
                      className="flex justify-between"
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
                ))}
              </div>

              {/* Generate More Button */}

              <div className="flex justify-center pt-4">
                <Button variant="outline" className="min-w-[140px]">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate More
                </Button>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
