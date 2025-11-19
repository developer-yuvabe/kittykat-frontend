import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseReferenceImagePasteOptions {
 
  containerSelector: string;
  
  /**
   * Function to handle file upload
   */
  handleFileUpload: (files: File[], targetZone: "master" | "product") => Promise<string[]>;
  
  /**
   * Current master reference images
   */
  masterReference: string[];
  productReference: string[];
  
  setMasterReference: (urls: string[]) => void;
  setProductReference: (urls: string[]) => void;
  
  referencePopoverTab?: "master" | "product";
  showToast?: boolean;
  useDocumentListener?: boolean;
}

/**
 * Custom hook for handling paste events to upload reference images
 * Supports both document-level and component-level paste handling
 */
export const useReferenceImagePaste = ({
  containerSelector,
  handleFileUpload,
  masterReference,
  productReference,
  setMasterReference,
  setProductReference,
  referencePopoverTab = "master",
  showToast = true,
  useDocumentListener = false,
}: UseReferenceImagePasteOptions) => {
  
  const handlePaste = useCallback(
    async (e: ClipboardEvent | React.ClipboardEvent) => {
      // Check if paste event is inside the specified container
      const target = e.target as HTMLElement;
      if (!target.closest(containerSelector)) return;

      const clipboardData = 'clipboardData' in e ? e.clipboardData : (e as ClipboardEvent).clipboardData;
      const items = clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      // Upload to the active reference zone, default to master
      const targetZone = 
        masterReference.length > 0 || productReference.length > 0
          ? referencePopoverTab
          : "master";
      
      const uploadedUrls = await handleFileUpload(imageFiles, targetZone);

      if (uploadedUrls.length > 0) {
        // Add to references
        if (targetZone === "master") {
          setMasterReference([...masterReference, ...uploadedUrls]);
        } else {
          setProductReference([...productReference, ...uploadedUrls]);
        }

        if (showToast) {
          toast.success(
            `${uploadedUrls.length} reference image(s) added to ${targetZone} reference`
          );
        }
      }
    },
    [
      containerSelector,
      handleFileUpload,
      masterReference,
      productReference,
      setMasterReference,
      setProductReference,
      referencePopoverTab,
      showToast,
    ]
  );

  // Set up document-level paste event listener (for A2iImageInput)
  useEffect(() => {
    if (!useDocumentListener) return;

    const pasteHandler = (e: Event) => handlePaste(e as ClipboardEvent);
    document.addEventListener("paste", pasteHandler);
    
    return () => {
      document.removeEventListener("paste", pasteHandler);
    };
  }, [handlePaste, useDocumentListener]);

  // Return the handler for component-level usage (for RemixControls)
  return {
    handlePaste: handlePaste as (e: React.ClipboardEvent) => Promise<void>,
  };
};
