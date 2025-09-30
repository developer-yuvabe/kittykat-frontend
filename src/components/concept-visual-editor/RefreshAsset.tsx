import { useConceptVisualStore } from "@/store/concept-visual.store";
import React from "react";
import { Button } from "../ui/button";
import { galleryService } from "@/services/api/gallery.service";
import { RefreshCw } from "lucide-react";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { useQueryClient } from "@tanstack/react-query";

type RefreshAssetProps = {
  currentAsset: GalleryItemResponse;
  currentAssetVersion: GalleryItemResponse;
  galleryActions: GalleryActions;
};

const RefreshAsset = ({
  currentAsset,
  currentAssetVersion,
  galleryActions,
}: RefreshAssetProps) => {
  const queryClient = useQueryClient();
  const { setCurrentAsset } = useConceptVisualStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        // Refetch gallery items
        galleryActions.refetchGalleryItems();

        // Always refetch versions
        queryClient.invalidateQueries({
          queryKey: ["versions", currentAsset.id],
        });

        // Always refetch the main item (version 1)
        try {
          await galleryService.getGalleryItemById(currentAsset.id);
        } catch (error) {
          console.error("Failed to refresh main item data:", error);
        }

        // If we're viewing a different version, also refetch that version
        if (currentAssetVersion.id !== currentAsset.id) {
          try {
            const updatedCurrentAssetVersion =
              await galleryService.getGalleryItemById(currentAssetVersion.id);
            setCurrentAsset(updatedCurrentAssetVersion);
          } catch (error) {
            console.error("Failed to refresh current version data:", error);
          }
        } else if (currentAssetVersion?.id === currentAsset.id) {
          // If we're viewing version 1, update it with the refetched data
          try {
            const updatedAsset = await galleryService.getGalleryItemById(
              currentAsset.id
            );
            setCurrentAsset(updatedAsset);
          } catch (error) {
            console.error("Failed to refresh item data:", error);
          }
        }
      }}
      className="p-2 h-8 w-8"
      title="Refresh data"
    >
      <RefreshCw className="w-4 h-4" />
    </Button>
  );
};

export default RefreshAsset;
