import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import type { URLContentBlock, IDContentBlock } from "@langchain/core/messages";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { uploadThreadFile } from "@/services/api/brand.service";
import {
  validateImageUploadSize,
  formatFileSize,
  IMAGE_TYPES,
  SUPPORTED_FILE_TYPES,
} from "@/lib/langgraph.utils";
import { MAX_IMAGE_UPLOAD_SIZE } from "@/lib/constants";
import {
  generateFileHash,
  generateUniqueFilename,
  calculateImageSize,
  categorizeDuplicates,
  categorizeFileTypes,
  type ContentBlock,
} from "@/lib/file-upload.utils";

interface UseFileUploadOptions {
  initialBlocks?: ContentBlock[];
  brandId: string | null; // Required for uploading files to get IDs
}

export function useFileUpload({
  initialBlocks = [],
  brandId,
}: UseFileUploadOptions) {
  const [contentBlocks, setContentBlocks] =
    useState<ContentBlock[]>(initialBlocks);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const [isUploading, setIsUploading] = useState(false);

  // Track total size of uploaded images
  const [currentImageSize, setCurrentImageSize] = useState(0);

  // Update current image size when blocks change
  useEffect(() => {
    setCurrentImageSize(calculateImageSize(contentBlocks));
  }, [contentBlocks]);

  const fileToContentBlock = async (
    file: File,
    uniqueName?: string
  ): Promise<ContentBlock> => {
    try {
      const fileName = uniqueName || file.name;

      if (IMAGE_TYPES.includes(file.type)) {
        const fileHash = await generateFileHash(file);
        const uploadedUrl = await uploadFileAndReturnUrl(
          fileName,
          file.type,
          "threads",
          file
        );

        return {
          type: "image",
          source_type: "url",
          url: uploadedUrl,
          mime_type: file.type,
          metadata: { name: fileName, size: file.size, hash: fileHash },
        } as URLContentBlock;
      } else if (brandId) {
        const threadFileResponse = await uploadThreadFile(
          brandId,
          file,
          "user_data"
        );

        return {
          type: "file",
          source_type: "id",
          id: threadFileResponse.file_id,
          mime_type: file.type,
          metadata: { threadFileResponse, filename: fileName },
        } as IDContentBlock;
      }
      throw new Error(
        "Unable to process file: missing brandId or unsupported file type."
      );
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);

    try {
      const fileArray = Array.from(files);

      // Categorize files by type
      const { validFiles, invalidFiles } = categorizeFileTypes(
        fileArray,
        SUPPORTED_FILE_TYPES
      );

      // Check for duplicates based on content
      const { duplicateFiles, uniqueFiles } = await categorizeDuplicates(
        validFiles,
        contentBlocks
      );

      // Validate image sizes
      const { validFiles: validImageFiles, rejectedFiles: rejectedImageFiles } =
        validateImageUploadSize(uniqueFiles, currentImageSize);

      // Show appropriate warnings
      if (invalidFiles.length > 0) {
        toast.warning(
          "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF."
        );
      }

      if (duplicateFiles.length > 0) {
        toast.warning(
          `Duplicate file(s) detected: ${duplicateFiles
            .map((f) => f.name)
            .join(", ")}. Each file can only be uploaded once per message.`
        );
      }

      if (rejectedImageFiles.length > 0) {
        const remainingSpace = MAX_IMAGE_UPLOAD_SIZE - currentImageSize;
        toast.warning(
          `Some images couldn't be uploaded. Total image size limit is 50MB per message. You have ${formatFileSize(
            remainingSpace
          )} remaining. Rejected: ${rejectedImageFiles
            .map((r) => r.file.name)
            .join(", ")}`
        );
      }

      // Upload valid files
      if (validImageFiles.length > 0) {
        const promise = Promise.all(
          validImageFiles.map((file) => {
            const uniqueName = generateUniqueFilename(file.name, contentBlocks);
            return fileToContentBlock(file, uniqueName);
          })
        );

        toast.promise(promise, {
          loading: "Uploading files...",
          success: "Files uploaded successfully!",
          error: "Failed to upload files.",
        });

        const newBlocks = await promise;
        setContentBlocks((prev) => [...prev, ...newBlocks]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Something went wrong while uploading files.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // FIXED: Check if drop target is within the chat input area
  const isDropTargetInChatArea = (target: EventTarget | null): boolean => {
    if (!target || !dropRef.current) return false;
    return dropRef.current.contains(target as Node);
  };

  // Drag and drop handlers
  useEffect(() => {
    if (!dropRef.current) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only handle drag enter if it's within the chat input area
      if (isDropTargetInChatArea(e.target)) {
        dragCounter.current += 1;
        setDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only handle drag leave if it's within the chat input area
      if (isDropTargetInChatArea(e.target)) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          setDragOver(false);
          dragCounter.current = 0;
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only show drag over state if dragging over chat input area
      if (isDropTargetInChatArea(e.target)) {
        setDragOver(true);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // CRITICAL FIX: Only handle drop if it's within the chat input area
      if (!isDropTargetInChatArea(e.target)) {
        return; // Let other drop handlers handle this
      }

      dragCounter.current = 0;
      setDragOver(false);

      if (!e.dataTransfer) return;

      setIsUploading(true);

      try {
        const files = Array.from(e.dataTransfer.files);

        // Categorize files by type
        const { validFiles, invalidFiles } = categorizeFileTypes(
          files,
          SUPPORTED_FILE_TYPES
        );

        // Check for duplicates based on content
        const { duplicateFiles, uniqueFiles } = await categorizeDuplicates(
          validFiles,
          contentBlocks
        );

        // Validate image sizes
        const {
          validFiles: validImageFiles,
          rejectedFiles: rejectedImageFiles,
        } = validateImageUploadSize(uniqueFiles, currentImageSize);

        // Show appropriate warnings
        if (invalidFiles.length > 0) {
          toast.warning(
            "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF."
          );
        }
        if (duplicateFiles.length > 0) {
          toast.warning(
            `Duplicate file(s) detected: ${duplicateFiles
              .map((f) => f.name)
              .join(", ")}. Each file can only be uploaded once per message.`
          );
        }

        if (rejectedImageFiles.length > 0) {
          const remainingSpace = MAX_IMAGE_UPLOAD_SIZE - currentImageSize;
          toast.warning(
            `Some images couldn't be uploaded. Total image size limit is 50MB per message. You have ${formatFileSize(
              remainingSpace
            )} remaining. Rejected: ${rejectedImageFiles
              .map((r) => r.file.name)
              .join(", ")}`
          );
        }

        // Upload valid files
        if (validImageFiles.length > 0) {
          const promise = Promise.all(
            validImageFiles.map((file) => {
              const uniqueName = generateUniqueFilename(
                file.name,
                contentBlocks
              );
              return fileToContentBlock(file, uniqueName);
            })
          );

          toast.promise(promise, {
            loading: "Uploading files...",
            success: "Files uploaded successfully!",
            error: "Failed to upload files.",
          });

          const newBlocks = await promise;
          setContentBlocks((prev) => [...prev, ...newBlocks]);
        }
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Something went wrong while uploading files.");
      } finally {
        setIsUploading(false);
      }
    };

    const handleDragEnd = () => {
      dragCounter.current = 0;
      setDragOver(false);
    };

    const element = dropRef.current;

    // Add event listeners to the specific element only
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);
    element.addEventListener("drop", handleDrop);
    element.addEventListener("dragend", handleDragEnd);

    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragenter", handleDragEnter);
      element.removeEventListener("dragleave", handleDragLeave);
      element.removeEventListener("drop", handleDrop);
      element.removeEventListener("dragend", handleDragEnd);
    };
  }, [contentBlocks, brandId]);

  const removeBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetBlocks = () => setContentBlocks([]);

  const handlePaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const items = e.clipboardData.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length === 0) return;
    e.preventDefault();

    // Show loading toast immediately when pasting
    const toastId = toast.loading("Uploading pasted image(s)...");
    setIsUploading(true);

    try {
      // Categorize files by type
      const { validFiles, invalidFiles } = categorizeFileTypes(
        files,
        SUPPORTED_FILE_TYPES
      );

      // Check for duplicates based on content
      const { duplicateFiles, uniqueFiles } = await categorizeDuplicates(
        validFiles,
        contentBlocks
      );

      // Validate image sizes
      const { validFiles: validImageFiles, rejectedFiles: rejectedImageFiles } =
        validateImageUploadSize(uniqueFiles, currentImageSize);

      // Determine if we should show warnings or proceed with upload
      const hasWarnings =
        invalidFiles.length > 0 ||
        duplicateFiles.length > 0 ||
        rejectedImageFiles.length > 0;
      const hasValidUploads = validImageFiles.length > 0;

      // Show appropriate warnings (don't replace toast if we have valid uploads)
      if (invalidFiles.length > 0) {
        if (!hasValidUploads) {
          toast.warning(
            "You have pasted an invalid file type. Please paste a JPEG, PNG, WEBP image or a PDF.",
            { id: toastId }
          );
        } else {
          toast.warning(
            "You have pasted an invalid file type. Please paste a JPEG, PNG, WEBP image or a PDF."
          );
        }
      }
      if (duplicateFiles.length > 0) {
        if (!hasValidUploads) {
          toast.warning(
            `Duplicate file(s) detected: ${duplicateFiles
              .map((f) => f.name)
              .join(
                ", "
              )}. This exact image content has already been attached.`,
            { id: toastId }
          );
        } else {
          toast.warning(
            `${duplicateFiles.length} duplicate file(s) skipped. These images were already attached.`
          );
        }
      }
      if (rejectedImageFiles.length > 0) {
        const remainingSpace = MAX_IMAGE_UPLOAD_SIZE - currentImageSize;
        if (!hasValidUploads) {
          toast.warning(
            `Some images couldn't be uploaded. Total image size limit is 50MB per message. You have ${formatFileSize(
              remainingSpace
            )} remaining. Rejected: ${rejectedImageFiles
              .map((r) => r.file.name)
              .join(", ")}`,
            { id: toastId }
          );
        } else {
          toast.warning(
            `${
              rejectedImageFiles.length
            } image(s) exceeded size limit. You have ${formatFileSize(
              remainingSpace
            )} remaining.`
          );
        }
      }

      // Upload valid files
      if (validImageFiles.length > 0) {
        const newBlocks = await Promise.all(
          validImageFiles.map((file) => {
            const uniqueName = generateUniqueFilename(file.name, contentBlocks);
            return fileToContentBlock(file, uniqueName);
          })
        );
        setContentBlocks((prev) => [...prev, ...newBlocks]);

        // Show success message
        const successMessage = hasWarnings
          ? `Successfully uploaded ${validImageFiles.length} image(s). Some files were skipped.`
          : `Successfully uploaded ${validImageFiles.length} image(s)!`;

        toast.success(successMessage, { id: toastId });
      } else {
        // No valid files to upload, toast already replaced with warning
        // Only dismiss if no warnings were shown
        if (!hasWarnings) {
          toast.dismiss(toastId);
        }
      }
    } catch (error) {
      console.error("File paste error:", error);
      toast.error("Something went wrong while processing pasted files.", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
    isUploading,
  };
}
