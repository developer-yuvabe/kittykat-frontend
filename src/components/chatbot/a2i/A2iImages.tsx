// components/A2IImages.tsx

import { ContentSection } from "@/components/shared/ContentSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Shuffle, Copy, Share2 } from "lucide-react";
import { ImageDisplay } from "./ImageDisplay";

type GeneratedImage = {
  id: string;
  url: string;
  liked?: boolean;
};

type A2IImagesProps = {
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  handleGenerate: () => void;
};

export const A2IImages = ({
  isGenerating,
  generatedImages,
  handleGenerate,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {generatedImages.map((image) => (
                  <Card
                    key={image.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className="">
                        <ImageDisplay
                          src={image.url}
                          alt={`Generated Image ${image.id}`}
                          className=""
                          onSelect={undefined}
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-purple-500 hover:bg-purple-600 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Create Video
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                          >
                            <Shuffle className="w-3 h-3 mr-1" />
                            Remix
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Duplicate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  onClick={handleGenerate}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Generate More Variations
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Collection
                </Button>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
