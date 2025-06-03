import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import type { URLContentBlock } from "@langchain/core/messages";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

interface UseFileUploadOptions {
  initialBlocks?: URLContentBlock[];
}

export function useFileUpload({
  initialBlocks = [],
}: UseFileUploadOptions = {}) {
  const [contentBlocks, setContentBlocks] =
    useState<URLContentBlock[]>(initialBlocks);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const [isUploading, setIsUploading] = useState(false);

  const isDuplicate = (file: File, blocks: URLContentBlock[]): boolean => {
    if (file.type === "application/pdf") {
      return blocks.some(
        (b) =>
          b.type === "file" &&
          b.mime_type === "application/pdf" &&
          b.metadata?.filename === file.name
      );
    }
    if (SUPPORTED_FILE_TYPES.includes(file.type)) {
      return blocks.some(
        (b) =>
          b.type === "image" &&
          b.mime_type === file.type &&
          b.metadata?.name === file.name
      );
    }
    return false;
  };

  const fileToContentBlock = async (file: File): Promise<URLContentBlock> => {
    try {
      if (file.type === "application/pdf") {
        const fileData = await file.arrayBuffer();
        const base64Data = Buffer.from(fileData).toString("base64");
        const dataUrl = `data:application/pdf;base64,${base64Data}`;

        return {
          type: "file",
          source_type: "url",
          url: dataUrl,
          mime_type: file.type,
          metadata: { filename: file.name },
        };
      } else {
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
          metadata: { name: file.name },
        };
      }
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true); // Start loading

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

      if (invalidFiles.length > 0) {
        toast.error(
          "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF."
        );
      }

      if (duplicateFiles.length > 0) {
        toast.error(
          `Duplicate file(s) detected: ${duplicateFiles
            .map((f) => f.name)
            .join(", ")}. Each file can only be uploaded once per message.`
        );
      }

      if (uniqueFiles.length > 0) {
        const newBlocks = await Promise.all(
          uniqueFiles.map(fileToContentBlock)
        );
        setContentBlocks((prev) => [...prev, ...newBlocks]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Something went wrong while uploading files.");
    } finally {
      setIsUploading(false); // Stop loading
      e.target.value = ""; // Clear input
    }
  };

  // Drag and drop handlers
  useEffect(() => {
    if (!dropRef.current) return;

    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setDragOver(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          setDragOver(false);
          dragCounter.current = 0;
        }
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragOver(false);

      if (!e.dataTransfer) return;

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

      if (invalidFiles.length > 0) {
        toast.error(
          "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF."
        );
      }
      if (duplicateFiles.length > 0) {
        toast.error(
          `Duplicate file(s) detected: ${duplicateFiles
            .map((f) => f.name)
            .join(", ")}. Each file can only be uploaded once per message.`
        );
      }

      if (uniqueFiles.length > 0) {
        const newBlocks = await Promise.all(
          uniqueFiles.map(fileToContentBlock)
        );
        setContentBlocks((prev) => [...prev, ...newBlocks]);
      }
    };

    const handleWindowDragEnd = () => {
      dragCounter.current = 0;
      setDragOver(false);
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    };

    const element = dropRef.current;
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);
    window.addEventListener("dragover", handleWindowDragOver);

    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragenter", handleDragEnter);
      element.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("dragover", handleWindowDragOver);
      dragCounter.current = 0;
    };
  }, [contentBlocks]);

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

    if (invalidFiles.length > 0) {
      toast.error(
        "You have pasted an invalid file type. Please paste a JPEG, PNG, GIF, WEBP image or a PDF."
      );
    }
    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles
          .map((f) => f.name)
          .join(", ")}. Each file can only be uploaded once per message.`
      );
    }
    if (uniqueFiles.length > 0) {
      const newBlocks = await Promise.all(uniqueFiles.map(fileToContentBlock));
      setContentBlocks((prev) => [...prev, ...newBlocks]);
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
