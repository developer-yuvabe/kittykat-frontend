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

export type ContentBlock = URLContentBlock | IDContentBlock;

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

  // Calculate total size of image blocks
  const calculateImageSize = (blocks: ContentBlock[]): number => {
    return blocks.reduce((total, block) => {
      if (
        block.type === "image" &&
        block.source_type === "url" &&
        block.metadata?.size
      ) {
        return total + (block.metadata.size as number);
      }
      return total;
    }, 0);
  };

  // Update current image size when blocks change
  useEffect(() => {
    setCurrentImageSize(calculateImageSize(contentBlocks));
  }, [contentBlocks]);

  const isDuplicate = (file: File, blocks: ContentBlock[]): boolean => {
    if (IMAGE_TYPES.includes(file.type)) {
      return blocks.some(
        (b) =>
          b.type === "image" &&
          b.source_type === "url" &&
          b.mime_type === file.type &&
          b.metadata?.name === file.name
      );
    }

    if (file.type === "application/pdf") {
      return blocks.some(
        (b) =>
          b.type === "file" &&
          b.source_type === "id" &&
          b.mime_type === "application/pdf" &&
          b.metadata?.filename === file.name
      );
    }

    return false;
  };

  const fileToContentBlock = async (file: File): Promise<ContentBlock> => {
    try {
      if (IMAGE_TYPES.includes(file.type)) {
        // Images: Upload to GCS and return URLContentBlock
        const uploadedUrl = await uploadFileAndReturnUrl(
          file.name,
          file.type,
          "threads",
          file
        );

        return {
          type: "image",
          source_type: "url",
          url: uploadedUrl,
          mime_type: file.type,
          metadata: { name: file.name, size: file.size },
        } as URLContentBlock;
      } else if (brandId) {
        // PDFs and other files: Upload to thread files and return IDContentBlock
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
          metadata: { threadFileResponse },
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
      const validFiles = fileArray.filter((file) =>
        SUPPORTED_FILE_TYPES.includes(file.type)
      );
      const invalidFiles = fileArray.filter(
        (file) => !SUPPORTED_FILE_TYPES.includes(file.type)
      );
      const duplicateFiles = validFiles.filter((file) =>
        isDuplicate(file, contentBlocks)
      );
      const uniqueFiles = validFiles.filter(
        (file) => !isDuplicate(file, contentBlocks)
      );

      // Validate image sizes (only images here, no need to separate)
      const { validFiles: validImageFiles, rejectedFiles: rejectedImageFiles } =
        validateImageUploadSize(uniqueFiles, currentImageSize);

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

      if (validImageFiles.length > 0) {
        const promise = Promise.all(validImageFiles.map(fileToContentBlock));

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
        const validFiles = files.filter((file) =>
          SUPPORTED_FILE_TYPES.includes(file.type)
        );
        const invalidFiles = files.filter(
          (file) => !SUPPORTED_FILE_TYPES.includes(file.type)
        );
        const duplicateFiles = validFiles.filter((file) =>
          isDuplicate(file, contentBlocks)
        );
        const uniqueFiles = validFiles.filter(
          (file) => !isDuplicate(file, contentBlocks)
        );

        // Validate image sizes (only images here)
        const {
          validFiles: validImageFiles,
          rejectedFiles: rejectedImageFiles,
        } = validateImageUploadSize(uniqueFiles, currentImageSize);

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

        if (validImageFiles.length > 0) {
          const promise = Promise.all(validImageFiles.map(fileToContentBlock));

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

    setIsUploading(true);

    try {
      const validFiles = files.filter((file) =>
        SUPPORTED_FILE_TYPES.includes(file.type)
      );
      const invalidFiles = files.filter(
        (file) => !SUPPORTED_FILE_TYPES.includes(file.type)
      );
      const duplicateFiles = validFiles.filter((file) =>
        isDuplicate(file, contentBlocks)
      );
      const uniqueFiles = validFiles.filter(
        (file) => !isDuplicate(file, contentBlocks)
      );

      // Validate image sizes (only images here)
      const { validFiles: validImageFiles, rejectedFiles: rejectedImageFiles } =
        validateImageUploadSize(uniqueFiles, currentImageSize);

      if (invalidFiles.length > 0) {
        toast.warning(
          "You have pasted an invalid file type. Please paste a JPEG, PNG, GIF, WEBP image or a PDF."
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
      if (validImageFiles.length > 0) {
        const newBlocks = await Promise.all(
          validImageFiles.map(fileToContentBlock)
        );
        setContentBlocks((prev) => [...prev, ...newBlocks]);
      }
    } catch (error) {
      console.error("File paste error:", error);
      toast.error("Something went wrong while processing pasted files.");
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
