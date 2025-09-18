import { GalleryItemResponse } from "@/types/gallery.types";
import { Task } from "@/types/tasklist.types";

/**
 * Gets the client name from the latest comment or falls back to created_by
 */
export function getClientNameFromComments(item: GalleryItemResponse): string {
  if (item.comments && item.comments.length > 0) {
    // Sort comments by added_at (most recent first)
    const sortedComments = [...item.comments].sort(
      (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    );

    // ✅ Step 1: Find the latest is_tasklist = true comment with a valid name
    for (const comment of sortedComments) {
      if (comment.is_tasklist && comment.added_by_name) {
        return comment.added_by_name;
      }
    }

    // ✅ Step 2: Find the latest "normal" (non-system) comment with a valid name
    for (const comment of sortedComments) {
      if (comment.added_by_name && !comment.text.startsWith("[")) {
        return comment.added_by_name;
      }
    }

    // ✅ Step 3: Fallback to the very latest comment’s name (if available)
    const latestComment = sortedComments[0];
    if (latestComment?.added_by_name) {
      return latestComment.added_by_name;
    }
  }

  // ✅ Step 4: Final fallback
  return item.created_by || "Client";
}

export const formatTasksAsMarkdown = (tasks: Task[]) => {
  if (tasks.length === 0) return "";
  return tasks.map((task) => `- ${task.task}`).join("\n");
};
