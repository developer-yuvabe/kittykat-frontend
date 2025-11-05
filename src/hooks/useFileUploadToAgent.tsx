import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import type { IDContentBlock } from "@langchain/core/messages";
import { uploadThreadFile } from "@/services/api/brand.service";
import {
  generateUniqueFilename,
  categorizeDuplicates,
  categorizeFileTypes,
  type ContentBlock,
} from "@/lib/file-upload.utils";

const PDF_FILE_TYPES = ["application/pdf"];
const IMAGE_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UseFileUploadOptions {
  initialBlocks?: ContentBlock[];
  brandId: string | null; // Required for uploading files to get IDs
  onImageFilesDropped?: (files: File[]) => Promise<void>; // Callback for handling image files
}

export function useFileUpload({
  initialBlocks = [],
  brandId,
  onImageFilesDropped,
}: UseFileUploadOptions) {
  const [contentBlocks, setContentBlocks] =
    useState<ContentBlock[]>(initialBlocks);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileToContentBlock = async (
    file: File,
    uniqueName?: string
  ): Promise<ContentBlock> => {
    try {
      const fileName = uniqueName || file.name;

      // Only handle PDFs now (images are handled by ReferenceImageSelector)
      if (brandId && PDF_FILE_TYPES.includes(file.type)) {
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
        "Unable to process file: missing brandId or unsupported file type. Only PDFs are supported."
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

      // Only accept PDFs (filter out images)
      const { validFiles, invalidFiles } = categorizeFileTypes(
        fileArray,
        PDF_FILE_TYPES
      );

      // Check for duplicates based on content
      const { duplicateFiles, uniqueFiles } = await categorizeDuplicates(
        validFiles,
        contentBlocks
      );

      // Show appropriate warnings
      if (invalidFiles.length > 0) {
        toast.warning(
          "Only PDF files are supported. Please upload a PDF document."
        );
      }

      if (duplicateFiles.length > 0) {
        toast.warning(
          `Duplicate file(s) detected: ${duplicateFiles
            .map((f) => f.name)
            .join(", ")}. Each file can only be uploaded once per message.`
        );
      }

      // Upload valid PDF files
      if (uniqueFiles.length > 0) {
        const promise = Promise.all(
          uniqueFiles.map((file) => {
            const uniqueName = generateUniqueFilename(file.name, contentBlocks);
            return fileToContentBlock(file, uniqueName);
          })
        );

        toast.promise(promise, {
          loading: "Uploading PDF file(s)...",
          success: "PDF file(s) uploaded successfully!",
          error: "Failed to upload PDF file(s).",
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

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);

      // Separate PDFs and images
      const pdfFiles = files.filter((file) =>
        PDF_FILE_TYPES.includes(file.type)
      );
      const imageFiles = files.filter((file) =>
        IMAGE_FILE_TYPES.includes(file.type)
      );

      dragCounter.current = 0;
      setDragOver(false);

      // Handle image files if callback is provided
      if (imageFiles.length > 0 && onImageFilesDropped) {
        try {
          await onImageFilesDropped(imageFiles);
        } catch (error) {
          console.error("Image file upload error:", error);
        }
      }

      // Handle PDF files
      if (pdfFiles.length === 0) {
        return;
      }

      setIsUploading(true);

      try {
        // Only accept PDFs
        const { validFiles, invalidFiles } = categorizeFileTypes(
          pdfFiles,
          PDF_FILE_TYPES
        );

        // Check for duplicates based on content
        const { duplicateFiles, uniqueFiles } = await categorizeDuplicates(
          validFiles,
          contentBlocks
        );

        // Show appropriate warnings
        if (invalidFiles.length > 0) {
          toast.warning("Only PDF files are supported for document upload.");
        }
        if (duplicateFiles.length > 0) {
          toast.warning(
            `Duplicate file(s) detected: ${duplicateFiles
              .map((f) => f.name)
              .join(", ")}. Each file can only be uploaded once per message.`
          );
        }

        // Upload valid PDF files
        if (uniqueFiles.length > 0) {
          const promise = Promise.all(
            uniqueFiles.map((file) => {
              const uniqueName = generateUniqueFilename(
                file.name,
                contentBlocks
              );
              return fileToContentBlock(file, uniqueName);
            })
          );

          toast.promise(promise, {
            loading: "Uploading PDF file(s)...",
            success: "PDF file(s) uploaded successfully!",
            error: "Failed to upload PDF file(s).",
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
  }, [contentBlocks, brandId, onImageFilesDropped]);

  const removeBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetBlocks = () => setContentBlocks([]);

  return {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    isUploading,
  };
}
