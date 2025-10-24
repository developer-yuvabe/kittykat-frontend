import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { getExtensionFromUrl } from "@/lib/utils";
import { useGalleryQuery, ITEMS_PER_PAGE } from "@/hooks/useGallery";
import { GalleryItem, GalleryItemResponse } from "@/types/gallery.types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Link, Upload } from "lucide-react";
import React, { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

type AddVersionProps = {
  children?: React.ReactNode;
  item: GalleryItemResponse;
  onVersionChange: (item: GalleryItemResponse) => void;
  refetchVersions: () => Promise<any>;
  versionsCount: number;
};

const AddVersion = ({
  children,
  item,
  onVersionChange,
  refetchVersions,
  versionsCount,
}: AddVersionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { createVersion } = useGalleryQuery(
    {},
    ITEMS_PER_PAGE,
    true,
    "AddVersion"
  );

  const addVersion = async (
    uploadedUrl: string,
    fileType: "image" | "video"
  ) => {
    const galleryItem: GalleryItem = {
      brand_id: item.brand_id,
      campaign_id: item.campaign_id,
      asset_url: uploadedUrl,
      asset_source: item.asset_source,
      asset_type: fileType,
      media_format: getExtensionFromUrl(uploadedUrl),
      asset_title: `${item.asset_title} - Version ${versionsCount + 1}`,
      size: "",
      related_asset_ids: [],
      prompt_modifiers: [],
      ai_tags: [],
      visual_style_tags: {},
      detected_objects: [],
      detected_emotions: [],
      detected_colors: [],
      search_keywords: [],
      custom_tags: [],
      parent_asset_id: item.id,
      is_master: false,
      workflow_status: "in_review",
    };

    try {
      const uploadedItem = await createVersion(galleryItem);

      if (uploadedItem) {
        onVersionChange(uploadedItem);
      }

      toast.success("Version added successfully!");
      await refetchVersions();

      setIsOpen(false);
      setShowUrlInput(false);
      setUrl("");
      setIsUploading(false);
    } catch {
      toast.error("Failed to add version. Please try again.");
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast.error(
          "Some files were rejected due to unsupported types or sizes. Please ensure you're uploading a supported file format."
        );
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }
      try {
        setIsUploading(true);
        const file = acceptedFiles[0];

        const uploadedUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "brands",
          file,
          item.brand_id,
          item.campaign_id
        );

        // Determine file type based on MIME type
        const fileType = file.type.startsWith("video/") ? "video" : "image";
        await addVersion(uploadedUrl, fileType);
      } catch {
        toast.error(
          "An error occurred while uploading the file. Please try again."
        );
        setIsUploading(false);
      }
    },
    [item, versionsCount]
  );

  // Accept both images and videos
  const acceptedFiles = {
    "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: acceptedFiles,
    disabled: isUploading,
    maxSize: 100 * 1024 * 1024, // 100MB max for all files
  });

  let borderColor = "border-gray-300";
  if (isDragActive) borderColor = "border-purple-500";
  if (isDragAccept) borderColor = "border-green-500";
  if (isDragReject) borderColor = "border-red-500";

  const uploadUrl = async (url: string) => {
    setIsUploading(true);
    try {
      // Try to determine file type from URL extension
      const fileType = url.match(/\.(mp4|mov|avi|webm|mkv)$/i)
        ? "video"
        : "image";
      await addVersion(url, fileType);
    } catch {
      toast.error("Failed to add version from URL. Please try again.");
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setShowUrlInput(false);
    setUrl("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <AnimatePresence mode="wait">
          {showUrlInput ? (
            <motion.div
              key="urlInput"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
              className="space-y-4 relative"
            >
              <Button
                variant="ghost"
                onClick={() => setShowUrlInput(false)}
                disabled={isUploading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="w-full max-w-md">
                <Input
                  type="text"
                  placeholder="Enter image or video URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  disabled={isUploading || !url}
                  loading={isUploading}
                  className="mt-4 w-full"
                  onClick={() => {
                    uploadUrl(url);
                  }}
                >
                  Add URL
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
              className="space-y-4 relative"
            >
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 ease-in-out cursor-pointer ${borderColor} ${
                  isDragActive ? "bg-purple-50" : "bg-white"
                } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input {...getInputProps()} />

                <div className="flex gap-x-3">
                  <Button
                    variant="outline"
                    className="bg-[#636AE8] hover:bg-[#636AE8] hover:text-white text-white mb-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Files
                  </Button>

                  <Button
                    variant="outline"
                    disabled={isUploading}
                    className="mb-2 border-[#636AE8] text-[#636AE8] hover:bg-[#636AE8] hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlInput(true);
                    }}
                  >
                    <Link className="mr-1 h-4 w-4" />
                    Add URL
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Drop your new version image or video here, or click to select
                  files. <br />
                  (PNG, JPG, JPEG, WEBP, MP4)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddVersion;
