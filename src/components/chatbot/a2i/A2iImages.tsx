// // components/A2IImages.tsx

// import { ContentSection } from "@/components/shared/ContentSection";
// import { ImageDisplay } from "./ImageDisplay";
// import { ActionButtonsRow } from "./ActionButtonsRow";
// import { ImageIcon } from "lucide-react";
// import { ImageDetail } from "@/types/types";
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselNext,
//   CarouselPrevious,
// } from "@/components/ui/carousel";

// type A2IImagesProps = {
//   generatedImages: ImageDetail[];
// };

// export const A2IImages = ({ generatedImages }: A2IImagesProps) => {
//   const handleCreateVideo = (imageId: string) => {
//     console.log("Creating video for image:", imageId);
//   };

//   const handleRemixImage = (imageId: string) => {
//     console.log("Remixing image:", imageId);
//   };

//   const EmptyState = () => (
//     <div className="flex flex-col items-center justify-center py-12 px-4">
//       <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-6">
//         <ImageIcon className="w-12 h-12 text-gray-400" />
//       </div>
//       <h3 className="text-lg font-semibold text-gray-900 mb-2">
//         No images generated yet
//       </h3>
//     </div>
//   );

//   return (
//     <ContentSection
//       title="A2I Images"
//       content={
//         <div className="space-y-6">
//           {/* Images Grid */}
//           {generatedImages.length === 0 ? (
//             <EmptyState />
//           ) : (
//             <>
//               <Carousel className="w-full h-auto">
//                 <CarouselContent className="mb-4">
//                   {generatedImages.map((image, index) => (
//                     <CarouselItem
//                       key={image.id || index}
//                       className="md:basis-1/2 lg:basis-1/3"
//                     >
//                       <div className=" h-full flex flex-col justify-between bg-white rounded-xl shadow-md p-6 ">
//                         <div className="flex-1 flex items-center  justify-center">
//                           <ImageDisplay
//                             src={image.url}
//                             alt={`Generated Image ${image.id}`}
//                             className=" "
//                             onSelect={undefined}
//                             prompt={image.prompt}
//                             metadata={image.parameters}
//                           />
//                         </div>

//                         <ActionButtonsRow
//                           className="flex justify-between mt-4"
//                           buttons={[
//                             {
//                               label: "Create Video",
//                               onClick: () => handleCreateVideo(image.id),
//                               color: "#636AE8",
//                               hoverColor: "#5b5fd1",
//                             },
//                             {
//                               label: "Remix",
//                               onClick: () => handleRemixImage(image.id),
//                               color: "#EA916E",
//                               hoverColor: "#e7845d",
//                             },
//                           ]}
//                         />
//                       </div>
//                     </CarouselItem>
//                   ))}
//                 </CarouselContent>

//                 <div className="flex justify-center mt-4">
//                   <CarouselPrevious className="relative transform-none mx-2" />
//                   <CarouselNext className="relative transform-none mx-2" />
//                 </div>
//               </Carousel>
//             </>
//           )}
//         </div>
//       }
//     />
//   );
// };

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
import { useState } from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog"; // Assuming this is the correct import
import { toast } from "sonner";
import { deleteA2iImage } from "@/services/api/brand.service";
import { Trash2, Download, Send, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { PiShareFat } from "react-icons/pi";

type A2IImagesProps = {
  generatedImages: ImageDetail[];
  brandId: string;
};

export const A2IImages = ({ generatedImages, brandId }: A2IImagesProps) => {
  // State for selected items and dialog
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers for actions
  const handleCreateVideo = (imageId: string) => {
    console.log("Creating video for image:", imageId);
  };

  const handleRemixImage = (imageId: string) => {
    console.log("Remixing image:", imageId);
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };

  const handleCheckboxChange = (imageId: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, imageId] : prev.filter((id) => id !== imageId)
    );
  };

  const downloadItem = async (item: ImageDetail) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${item.id}.jpg`; // Using item.id for file name; adjust if needed
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Downloaded image-${item.id}`);
      return true;
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
      return false;
    }
  };

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;

    const selectedImages = generatedImages.filter((item) =>
      selectedItems.includes(item.id)
    );

    try {
      for (const item of selectedImages) {
        await downloadItem(item);
      }
    } catch (error) {
      console.error("Bulk download error:", error);
      toast.error("Bulk download failed");
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      for (const imageId of selectedItems) {
        await deleteA2iImage(brandId, imageId);
      }
      toast.success(`Images Deleted`);
      console.log("Deleting items:", selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
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
                      <div className="h-full flex flex-col justify-between bg-white rounded-xl shadow-md p-6 relative">
                        <div className="flex-1 flex items-center justify-center">
                          <ImageDisplay
                            src={image.url}
                            alt={`Generated Image ${image.id}`}
                            className=""
                            onSelect={undefined}
                            prompt={image.prompt}
                            metadata={image.parameters}
                            checkbox={{
                              checked: selectedItems.includes(image.id),
                              onCheckedChange: (checked) =>
                                handleCheckboxChange(
                                  image.id,
                                  checked as boolean
                                ),
                            }}
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

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            // <div className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg py-3 px-4 z-50">
            <div className="bg-white border-gray-400 shadow-lg py-3 px-4 z-50">
              <div className="max-w-7xl mx-auto flex items-center justify-end gap-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBulkDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <PiShareFat className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBulkDownload}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  onClick={handleUnselectAll}
                  className="bg-[#9095A0] hover:bg-[#9095A0]"
                >
                  Unselect All
                </Button>
                <Button
                  variant="default"
                  className="flex items-center gap-2 bg-[#9095A0] hover:bg-[#9095A0]"
                >
                  <span>Add to library</span>
                  <BookOpen className="pt-[2px]" />
                </Button>
                <Button className="bg-[#636AE8] hover:bg-[#636AE8] flex items-center gap-2">
                  <span>Send to Kitty</span>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <ReusableAlertDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            title="Delete Items"
            description={`Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleConfirmDelete}
            isLoading={isDeleting}
            danger
          />
        </div>
      }
    />
  );
};
