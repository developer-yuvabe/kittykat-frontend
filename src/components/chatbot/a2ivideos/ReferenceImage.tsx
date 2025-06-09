"use client";
import { useState, useEffect } from "react";

import { ContentSection } from "@/components/shared/ContentSection";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { CheckCircle, Image, Target } from "lucide-react";
import { ImageDetail, ThreadA2iImage } from "@/types/types";
// import { updateReferenceA2iImageId } from "@/hooks/useParameterManagement";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageDisplay } from "../a2i/ImageDisplay";
import { ActionButtonsRow } from "../a2i/ActionButtonsRow";

interface ReferenceA2iImageSectionProps {
  a2iImageInformation: ThreadA2iImage | undefined;
  brandId: string;
}

export function ReferenceA2iImage({
  a2iImageInformation,
  brandId,
}: ReferenceA2iImageSectionProps) {
  const [selectedImage, setSelectedImage] = useState<ImageDetail | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get all A2I images
  const getAllA2iImages = (): ImageDetail[] => {
    return a2iImageInformation?.images || [];
  };

  // Initialize with existing reference
  useEffect(() => {
    if (a2iImageInformation?.images?.length) {
      // Set existing reference image if available
      if (a2iImageInformation?.reference_image_id) {
        const existingImage = a2iImageInformation.images.find(
          (img) => img.id === a2iImageInformation.reference_image_id
        );
        if (existingImage) {
          setSelectedImage(existingImage);
        }
      }
    }
  }, [a2iImageInformation]);

  const handleImageSelect = async (image: ImageDetail) => {
    setIsUpdating(true);
    try {
      // await updateReferenceA2iImageId(brandId, image.id);
      setSelectedImage(image);
      setIsImageModalOpen(false);
    } catch (error) {
      console.error("Failed to update reference image:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSelectedView = () => {
    if (!selectedImage) {
      return (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Reference Selected</h3>
          <p className="text-muted-foreground mb-6">
            Select an A2I image to get started
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setIsImageModalOpen(true)}
              disabled={getAllA2iImages().length === 0}
            >
              Select Image
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="space-y-4">
            <ImageDisplay
              src={selectedImage.url}
              alt={`A2I Image ${selectedImage.id}`}
              className="aspect-square w-full max-w-md mx-auto"
              onSelect={() => {}}
            />

            <ActionButtonsRow
              buttons={[
                {
                  label: "Go to Generator",
                  onClick: () => console.log("Navigate to generator"),
                  color: "#EA916E",
                  hoverColor: "#e7845d",
                },
                {
                  label: "Select Image",
                  onClick: () => setIsImageModalOpen(true),
                  hoverColor: "#5b5fd1",
                  color: "#636AE8",
                },
              ]}
              className="flex justify-between 2xl:mx-8"
            />
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Image Details */}
          <Card>
            <CardContent className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Image Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  Change
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">
                    A2I Image #{selectedImage.id.slice(0, 8)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Generated Image
                  </p>
                </div>

                {selectedImage.prompt && (
                  <div>
                    <p className="text-sm font-medium mb-2">Prompt</p>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                      {selectedImage.prompt}
                    </p>
                  </div>
                )}

                {selectedImage.parameters && (
                  <div>
                    <p className="text-sm font-medium mb-2">Parameters</p>
                    <div className="space-y-1">
                      {Object.entries(selectedImage.parameters)
                        .filter(([key]) => key.toLowerCase() !== "prompt")
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-medium">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!getAllA2iImages().length) {
      return (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            No A2I Images Available
          </h3>
          <p className="text-muted-foreground">
            Please generate some A2I images first to get started
          </p>
        </div>
      );
    }

    return renderSelectedView();
  };

  return (
    <>
      <ContentSection title="A2I Reference Setup" content={renderContent()} />

      {/* Image Selection Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="sm:w-lg md:min-w-4xl lg:min-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Reference A2I Image</DialogTitle>
          </DialogHeader>

          {getAllA2iImages().length ? (
            <Carousel className="w-full mt-4">
              <CarouselContent>
                {getAllA2iImages().map((image, index) => (
                  <CarouselItem
                    key={image.id || index}
                    className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 m-2"
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md h-full ${
                        selectedImage?.id === image.id
                          ? "ring-2 ring-primary"
                          : ""
                      } ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <CardContent className="p-4 h-full flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center relative mb-3">
                          <img
                            src={image.url}
                            alt={`A2I Image ${image.id}`}
                            className="w-full max-h-32 object-contain rounded-md"
                          />
                          {selectedImage?.id === image.id && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-6 w-6 text-primary bg-white rounded-full" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-medium text-sm truncate">
                            A2I Image #{image.id.slice(0, 8)}
                          </h4>
                          {image.prompt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {image.prompt}
                            </p>
                          )}
                          {image.parameters && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(image.parameters)
                                .filter(
                                  ([key]) => key.toLowerCase() !== "prompt"
                                )
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {key}:{" "}
                                    {Array.isArray(value)
                                      ? value[0]
                                      : String(value).slice(0, 10)}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="flex justify-center mt-4">
                <CarouselPrevious className="relative transform-none mx-2" />
                <CarouselNext className="relative transform-none mx-2" />
              </div>
            </Carousel>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No A2I images available</p>
            </div>
          )}

          {isUpdating && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Updating reference...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
