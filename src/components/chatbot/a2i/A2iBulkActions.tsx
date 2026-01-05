"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Download, X } from "lucide-react";
import { A2iImageCardProps } from "./A2iImageCard";
import { toast } from "sonner";
import JSZip from "jszip";
import ReusableAlertDialog from "@/components/shared/ReusableAlertDialog";
import { useState } from "react";
import { deleteA2iImage } from "@/services/api/a2i.service";
import { deleteA2iVideo } from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { useGalleryQuery, ITEMS_PER_PAGE } from "@/hooks/useGallery";
import { cn } from "@/lib/utils";

interface A2iBulkActionBarProps {
  selectedItems: A2iImageCardProps[];
  onUnselectAll: () => void;
  onSelectAll: () => void;
  onDeleteSuccess: () => void;
  brandName: string;
}

export function A2iBulkActionBar({
  selectedItems,
  onUnselectAll,
  onSelectAll,
  onDeleteSuccess,
  brandName,
}: A2iBulkActionBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { selectedBrandId } = useBrandStore();

  const galleryActions = useGalleryQuery(
    {
      selectedFilters: {
        brands: [selectedBrandId!],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    ITEMS_PER_PAGE,
    true,
    "A2iBulkActionBar"
  );

  const selectedCount = selectedItems.length;

  // Check if there are any downloadable items (completed with image/video)
  const hasDownloadableItems = selectedItems.some(
    (item) =>
      item.status === "completed" && (item.image?.url || item.video?.url)
  );

  const handleBulkDeleteClick = () => {
    if (selectedItems.length > 0) {
      setIsDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          item.video
            ? deleteA2iVideo(selectedBrandId!, item.generationId)
            : deleteA2iImage(
                selectedBrandId!,
                item.generationId,
                item.image?.id ?? null
              )
        )
      );

      const galleryItemIds = selectedItems
        .map((item) => item.video?.id ?? item.image?.id)
        .filter(Boolean) as string[];

      if (galleryItemIds.length) {
        await galleryActions.bulkDelete(galleryItemIds);
      }

      onUnselectAll();
      onDeleteSuccess();
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Failed to delete some items");
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  const getFileExtensionFromUrl = (url: string): string => {
    const fileName = url.split("/").pop()?.split("?")[0] || "";
    const ext = fileName.split(".").pop();
    return ext && ext.length < 6 ? ext : "jpg";
  };

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const handleBulkDownload = async () => {
    if (selectedItems.length === 0) return;

    const toastId = "bulk-download";
    let downloadedCount = 0;
    const totalItems = selectedItems.length;

    setIsDownloading(true);
    toast.loading("Preparing download...", { id: toastId });

    try {
      const zip = new JSZip();
      const batchSize = 10;
      const validItems = selectedItems.filter(
        (item) => !!(item.image?.url || item.video?.url)
      );

      const urlBatches = [];
      for (let i = 0; i < validItems.length; i += batchSize) {
        urlBatches.push(validItems.slice(i, i + batchSize));
      }

      for (let i = 0; i < urlBatches.length; i++) {
        const batch = urlBatches[i];

        await Promise.all(
          batch.map(async (item) => {
            try {
              const assetUrl = item.image?.url || item.video?.url;
              if (!assetUrl) return;

              const response = await fetch(assetUrl);
              const blob = await response.blob();

              const fileName =
                assetUrl.split("/").pop()?.split("?")[0] ||
                `file-${Date.now()}.${item.video ? "mp4" : "jpg"}`;
              const extension = getFileExtensionFromUrl(assetUrl);
              const cleanFileName = fileName.endsWith(`.${extension}`)
                ? fileName
                : `${fileName}.${extension}`;

              zip.file(cleanFileName, blob);

              downloadedCount++;
              const percentage = Math.round(
                (downloadedCount / totalItems) * 100
              );
              toast.loading(
                `Downloading: ${downloadedCount}/${totalItems} (${percentage}%)`,
                {
                  id: toastId,
                }
              );
            } catch (err) {
              console.error(
                "Download failed:",
                item.image?.url || item.video?.url,
                err
              );
            }
          })
        );
      }

      toast.loading("Creating ZIP file...", { id: toastId });

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `${slugify(brandName)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      toast.success("Download complete!", { id: toastId });
    } catch (error: any) {
      console.error("ZIP download failed:", error);
      toast.error("Download failed.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white border-t border-gray-200 shadow-lg py-3 px-4 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBulkDeleteClick}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleBulkDownload}
              disabled={isDownloading || !hasDownloadableItems}
              className={cn(
                !hasDownloadableItems && "opacity-50 cursor-not-allowed"
              )}
            >
              <Download className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <Button
              variant="default"
              onClick={onSelectAll}
              className="bg-[#9095A0] hover:bg-[#9095A0]"
            >
              Select All
            </Button>

            <Button
              variant="default"
              onClick={onUnselectAll}
              className="bg-[#9095A0] hover:bg-[#9095A0]"
            >
              Unselect All
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onUnselectAll}
              className="ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <ReusableAlertDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Delete Items"
        description={`Are you sure you want to delete ${selectedCount} item(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        danger
      />
    </>
  );
}

export default A2iBulkActionBar;
