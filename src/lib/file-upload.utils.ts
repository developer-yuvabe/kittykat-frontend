import type { URLContentBlock, IDContentBlock } from "@langchain/core/messages";

export type ContentBlock = URLContentBlock | IDContentBlock;

/**
 * Generates a SHA-256 hash of a file's content for duplicate detection
 * @param file - The file to hash
 * @returns Promise resolving to a hex string representation of the hash
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if a file is a duplicate based on content hash comparison
 * @param file - The file to check
 * @param blocks - Existing content blocks to compare against
 * @returns Promise resolving to true if duplicate found, false otherwise
 */
export async function isDuplicateFile(
  file: File,
  blocks: ContentBlock[]
): Promise<boolean> {
  const fileHash = await generateFileHash(file);

  for (const block of blocks) {
    if (
      block.type === "image" &&
      block.source_type === "url" &&
      block.metadata?.hash === fileHash
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a unique filename by appending timestamp if name already exists
 * @param originalName - The original filename
 * @param blocks - Existing content blocks to check for name conflicts
 * @returns A unique filename
 */
export function generateUniqueFilename(
  originalName: string,
  blocks: ContentBlock[]
): string {
  const existingNames = blocks
    .filter((b) => b.metadata?.name || b.metadata?.filename)
    .map((b) => (b.metadata?.name || b.metadata?.filename) as string);

  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  // For clipboard images (typically "image.png"), add timestamp
  const timestamp = Date.now();
  const nameParts = originalName.split(".");
  const ext = nameParts.pop();
  const baseName = nameParts.join(".");
  return `${baseName}_${timestamp}.${ext}`;
}

/**
 * Calculates the total size of all image blocks in bytes
 * @param blocks - Content blocks to calculate size from
 * @returns Total size in bytes
 */
export function calculateImageSize(blocks: ContentBlock[]): number {
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
}

/**
 * Checks files for duplicates asynchronously and categorizes them
 * @param files - Array of files to check
 * @param blocks - Existing content blocks to compare against
 * @returns Object containing duplicate and unique files
 */
export async function categorizeDuplicates(
  files: File[],
  blocks: ContentBlock[]
): Promise<{
  duplicateFiles: File[];
  uniqueFiles: File[];
}> {
  const duplicateChecks = await Promise.all(
    files.map(async (file) => ({
      file,
      isDup: await isDuplicateFile(file, blocks),
    }))
  );

  const duplicateFiles = duplicateChecks
    .filter((item) => item.isDup)
    .map((item) => item.file);
  const uniqueFiles = duplicateChecks
    .filter((item) => !item.isDup)
    .map((item) => item.file);

  return { duplicateFiles, uniqueFiles };
}

/**
 * Separates files into valid and invalid based on supported types
 * @param files - Array of files to categorize
 * @param supportedTypes - Array of supported MIME types
 * @returns Object containing valid and invalid files
 */
export function categorizeFileTypes(
  files: File[],
  supportedTypes: string[]
): {
  validFiles: File[];
  invalidFiles: File[];
} {
  const validFiles = files.filter((file) => supportedTypes.includes(file.type));
  const invalidFiles = files.filter(
    (file) => !supportedTypes.includes(file.type)
  );

  return { validFiles, invalidFiles };
}
