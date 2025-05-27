// components/A2IImages.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDisplay } from "./ImageDisplay";
import { ActionButtonsRow } from "./ActionButtonsRow";

type GeneratedImage = {
  id: string;
  url: string;
  liked?: boolean;
};

type A2IImagesProps = {
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  handleGenerate: () => void;
  onSelect?: () => void;
  onGoToGenerator?: () => void;
};

export const A2IImages = ({
  isGenerating,
  generatedImages,
  handleGenerate,
  onSelect,
  onGoToGenerator,
}: A2IImagesProps) => {
  return (
    <ContentSection
      title="A2I Images"
      content={
        <div>
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
                <p className="text-gray-600">Generating your images...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((image) => (
                  <div key={image.id}>
                    <ImageDisplay
                      src={image.url}
                      alt={`Generated Image ${image.id}`}
                      className=""
                      onSelect={undefined}
                    />

                    <ActionButtonsRow
                      className="flex justify-between "
                      buttons={[
                        {
                          label: "Create Video",
                          onClick: onGoToGenerator,
                          color: "#636AE8",
                          hoverColor: "#5b5fd1",
                        },
                        {
                          label: "Remix",
                          onClick: onSelect,
                          color: "#EA916E",
                          hoverColor: "#e7845d",
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
