import { ContentSection } from "@/components/shared/ContentSection";
import { ImageDetail } from "@/types/types";
import { useRemixStore } from "@/store/remix.store";
import { useState } from "react";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { toast } from "sonner";
import { deleteA2iImage } from "@/services/api/brand.service";
import { Trash2, Download, Send, BookOpen, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { PiShareFat } from "react-icons/pi";
import { GalleryItem } from "@/types/gallery.types";
import { useGalleryQuery } from "@/hooks/useGallery";
import { handleDownloadImage } from "@/lib/utils";
import {
  ImageActionsButton,
  ImageActionsDelete,
  ImageActionsExpand,
  ImageActionsMetadata,
  ImageActionsPrompt,
  ImageCard,
  ImageCardFooter,
  ImageCardHeader,
  ImageCardImage,
  ImageOverlay,
} from "@/components/ui/image-card";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";


type A2IImagesProps = {
  generatedImages: ImageDetail[];
  brandId: string;
  campaignId: string;
};

export const A2IImages = ({
  generatedImages,
  brandId,
  campaignId,
}: A2IImagesProps) => {
  const { setRemixUrl, setRemixSize } = useRemixStore();

  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const stream = useStreamContext();
  // State for selected items and dialog
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const { addToGallery } = useGalleryQuery({});

  // Handlers for actions

  const handleCreateVideo = (imageId: string) => {
    console.log("Creating video for image:", imageId);
  };

  const handleRemixImage = (url: string, size: string) => {
    setRemixUrl(url);
    setRemixSize(size);
  };

  const handleUnselectAll = () => {
    setSelectedItems([]);
  };

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;

    const selectedImages = generatedImages.filter((item) =>
      selectedItems.includes(item.id)
    );

    try {
      for (const item of selectedImages) {
        await handleDownloadImage(item.url);
      }
    } catch (error) {
      console.error("Bulk download error:", error);
      toast.error("Bulk download failed");
    }
  };

  const handleSingleDeleteClick = (imageId: string) => {
    setSingleDeleteId(imageId);
    setIsDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedItems.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (singleDeleteId) {
        await deleteA2iImage(brandId, singleDeleteId);
        toast.success("Image deleted");
        setSingleDeleteId(null);
      } else {
        for (const imageId of selectedItems) {
          await deleteA2iImage(brandId, imageId);
        }
        toast.success(`Images Deleted`);
        console.log("Deleting items:", selectedItems);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
      setSingleDeleteId(null);
      setSelectedItems([]);
    }
  };

  const handleAddToLibrary = async () => {
    if (selectedItems.length === 0 || !brandId) {
      toast.error("No images selected or brand ID missing");
      return;
    }

    const selectedImages = generatedImages.filter((item) =>
      selectedItems.includes(item.id)
    );

    const toastId = toast.loading("Adding Images to Library...");

    try {
      for (const image of selectedImages) {
        if (image.url) {
          const galleryItem: GalleryItem = {
            asset_type: "generated",
            asset_source: "images",
            asset_title: `Image ${image.id}`,
            asset_url: image.url,
            input_prompt: image.prompt || "",
            size: image.parameters?.size || "", // Use size from parameters
            media_format: image.parameters?.output_format || "webp", // Use output_format from parameters
            is_favourite: false,
            workflow_status: "draft",
            user_feedback: "neutral",
            is_archived: false,
            brand_id: brandId,
            related_asset_ids: [],
            prompt_modifiers: [],
            ai_tags: [],
            visual_style_tags: [],
            detected_objects: [],
            detected_emotions: [],
            detected_colors: [],
            intent_tags: [],
            search_keywords: [],
            custom_tags: [],
            campaign_id: campaignId,
          };
          console.log("gallery items", galleryItem);
          try {
            await addToGallery(galleryItem);
          } catch (error) {
            console.error("Failed to add to library", error);
          }
        }
      }
      toast.success(`${selectedImages.length} image(s) added to library`);
      setSelectedItems([]);
    } catch (error) {
      console.error("Failed to add to library", error);
      toast.error("Failed to add images to library");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleImageGeneration = () => {
    submitOptimisticMessage({
      stream,
      text: "Let's generate an image",
      userId: user!.id,
      currentBrandContextId: selectedBrandId,
    });
  };

  console.log(generatedImages, "Generated Images");

  return (
    <ContentSection
      title="A2I Images"
      content={
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ImageCard className="border-dashed border flex flex-col gap-y-4 items-center justify-center cursor-pointer transition-all bg-muted text-muted-foreground">
              <ImagePlus />
              <Button onClick={handleImageGeneration}>
                Generate a new image
              </Button>
            </ImageCard>
            {generatedImages.map((image) => (
              <ImageCard key={image.id}>
                <ImageCardHeader>
                  <ImageActionsDelete
                    onDelete={() => handleSingleDeleteClick(image.id)}
                  />
                  <ImageActionsExpand />
                  <ImageActionsPrompt prompt={image.prompt} />
                  <ImageActionsMetadata metadata={image.parameters ?? {}} />
                </ImageCardHeader>
                <ImageCardImage src={image.url}>
                  <ImageOverlay visible={!!selectedItems.length}>
                    <ImageOverlay.Checkbox
                      isChecked={selectedItems.includes(image.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems((prev) => [...prev, image.id]);
                        } else {
                          setSelectedItems((prev) =>
                            prev.filter((id) => id !== image.id)
                          );
                        }
                      }}
                    />
                  </ImageOverlay>
                </ImageCardImage>
                <ImageCardFooter>
                  <ImageActionsButton
                    onClick={() => handleCreateVideo(image.id)}
                  >
                    Create Video
                  </ImageActionsButton>
                  <ImageActionsButton
                    className="bg-[#e7845d] hover:bg-[#EA916E]"
                    onClick={() =>
                      handleRemixImage(
                        image.url,
                        image.parameters?.size || "1024x1024"
                      )
                    }
                  >
                    Remix
                  </ImageActionsButton>
                </ImageCardFooter>
              </ImageCard>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="fixed bottom-0 left-0 w-full z-20 bg-white border-gray-200 px-4 py-4 shadow-lg">
              <div className="mx-auto flex items-center justify-center gap-x-2">
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
                  onClick={handleAddToLibrary}
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
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setSingleDeleteId(null);
              }
            }}
            title="Delete Items"
            description={
              singleDeleteId
                ? "Are you sure you want to delete this image? This action cannot be undone."
                : `Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`
            }
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
