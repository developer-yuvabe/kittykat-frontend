import { GalleryItemResponse } from "@/types/gallery.types";

/**
 * Gets the client name from the latest comment or falls back to created_by
 */
export function getClientNameFromComments(item: GalleryItemResponse): string {
  // First, try to get name from the latest comment
  if (item.comments && item.comments.length > 0) {
    // Sort comments by added_at date (most recent first)
    const sortedComments = [...item.comments].sort(
      (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    );

    // Look for the latest comment that has a name and is not a system comment
    for (const comment of sortedComments) {
      if (comment.added_by_name && !comment.text.startsWith("[")) {
        return comment.added_by_name;
      }
    }

    // If no name found in comments, try to get from any comment
    const latestComment = sortedComments[0];
    if (latestComment?.added_by_name) {
      return latestComment.added_by_name;
    }
  }

  // Fallback to created_by or "Client"
  return item.created_by || "Client";
}
