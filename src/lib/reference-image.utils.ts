/**
 * Validates a file against allowed types and size limit
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { isValid: boolean; error?: string } => {
  // Check file type - support both MIME types (image/png) and extensions (.png)
  const isMimeType = allowedTypes.some((type) => type.includes("/"));
  const isValid = isMimeType
    ? allowedTypes.includes(file.type)
    : (() => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        return fileExtension && allowedTypes.includes(`.${fileExtension}`);
      })();

  if (!isValid) {
    return {
      isValid: false,
      error: `${file.name} (invalid type, allowed: ${allowedTypes.join(", ")})`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `${file.name} (${fileSizeMB.toFixed(
        1
      )}MB exceeds ${maxSizeMB}MB limit)`,
    };
  }

  return { isValid: true };
};

/**
 * Validates multiple files and categorizes them as valid or invalid
 */
export const validateFiles = (
  files: File[],
  allowedTypes: string[],
  maxSizeMB: number,
  maxCount?: number
): {
  validFiles: File[];
  invalidFiles: string[];
} => {
  const validFiles: File[] = [];
  const invalidFiles: string[] = [];

  const filesToValidate = maxCount ? files.slice(0, maxCount) : files;

  for (const file of filesToValidate) {
    const validation = validateFile(file, allowedTypes, maxSizeMB);
    if (validation.isValid) {
      validFiles.push(file);
    } else if (validation.error) {
      invalidFiles.push(validation.error);
    }
  }

  return { validFiles, invalidFiles };
};

/**
 * Updates reference arrays based on zone
 * Returns new arrays for master and product references
 */
export const updateReferencesByZone = (
  zone: "master" | "product",
  urls: string[],
  currentMasterRef: string[],
  currentProductRef: string[]
): {
  newMasterReference: string[];
  newProductReference: string[];
} => {
  if (zone === "master") {
    return {
      newMasterReference: [...currentMasterRef, ...urls],
      newProductReference: currentProductRef,
    };
  } else {
    return {
      newMasterReference: currentMasterRef,
      newProductReference: [...currentProductRef, ...urls],
    };
  }
};

/**
 * Adds a single reference to a zone and returns updated arrays
 */
export const addReferenceToZone = (
  zone: "master" | "product",
  url: string,
  currentMasterRef: string[],
  currentProductRef: string[]
): {
  newMasterReference: string[];
  newProductReference: string[];
  toastMessage: string;
} => {
  if (zone === "master") {
    return {
      newMasterReference: [...currentMasterRef, url],
      newProductReference: currentProductRef,
      toastMessage: "Master reference added",
    };
  } else {
    return {
      newMasterReference: currentMasterRef,
      newProductReference: [...currentProductRef, url],
      toastMessage: "Product reference added",
    };
  }
};

/**
 * Removes a reference from a zone and returns updated arrays
 */
export const removeReferenceFromZone = (
  zone: "master" | "product",
  url: string,
  currentMasterRef: string[],
  currentProductRef: string[]
): {
  newMasterReference: string[];
  newProductReference: string[];
  toastMessage: string;
} => {
  if (zone === "master") {
    return {
      newMasterReference: currentMasterRef.filter((u) => u !== url),
      newProductReference: currentProductRef,
      toastMessage: "Master reference removed",
    };
  } else {
    return {
      newMasterReference: currentMasterRef,
      newProductReference: currentProductRef.filter((u) => u !== url),
      toastMessage: "Product reference removed",
    };
  }
};

/**
 * Handles drag-and-drop logic for reference images between zones
 * Returns updated master and product references, or null if the drop should be prevented
 */
export const handleReferenceImageDrop = (
  assetUrl: string,
  source: string,
  targetZone: "master" | "product",
  masterReference: string[],
  productReference: string[],
  maxLimit: number
): {
  newMasterReference?: string[];
  newProductReference?: string[];
  shouldPrevent: boolean;
  toastMessage?: { type: "success" | "error"; message: string };
} => {
  // Move between master and product (always allow - doesn't increase total count)
  if (source === "master" && targetZone === "product") {
    return {
      newMasterReference: masterReference.filter((url) => url !== assetUrl),
      newProductReference: [...productReference, assetUrl],
      shouldPrevent: false,
      toastMessage: { type: "success", message: "Reference moved to Product" },
    };
  }

  if (source === "product" && targetZone === "master") {
    return {
      newProductReference: productReference.filter((url) => url !== assetUrl),
      newMasterReference: [...masterReference, assetUrl],
      shouldPrevent: false,
      toastMessage: { type: "success", message: "Reference moved to Master" },
    };
  }

  // Handle drop from gallery (adding new images - check limit)
  if (source === "gallery") {
    // Check if already selected
    if (
      masterReference.includes(assetUrl) ||
      productReference.includes(assetUrl)
    ) {
      return {
        shouldPrevent: true,
        toastMessage: {
          type: "error",
          message: "This image is already selected as a reference.",
        },
      };
    }

    // Check max limit when adding NEW images
    const currentImageCount = masterReference.length + productReference.length;
    if (currentImageCount >= maxLimit) {
      return {
        shouldPrevent: true,
        toastMessage: {
          type: "error",
          message: `You can only upload ${maxLimit} image(s).`,
        },
      };
    }

    // Add to target zone
    if (targetZone === "master") {
      return {
        newMasterReference: [...masterReference, assetUrl],
        shouldPrevent: false,
        toastMessage: { type: "success", message: "Master reference added" },
      };
    } else {
      return {
        newProductReference: [...productReference, assetUrl],
        shouldPrevent: false,
        toastMessage: { type: "success", message: "Product reference added" },
      };
    }
  }

  // Unknown source - prevent
  return { shouldPrevent: true };
};
