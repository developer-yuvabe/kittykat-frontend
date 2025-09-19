"use client";

import React, { useState, useEffect, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import { MarkdownText } from "@/components/thread/markdown-text";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
  X,
  Sparkles,
  Zap,
  Paperclip,
} from "lucide-react";
import { Comment } from "@/types/gallery.types";
import taskListService from "@/services/api/tasklist.service";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Task } from "@/types/tasklist.types";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { AskKittyKatAttachmentPreview } from "./AskKittyKatAttachmentPreview";

interface AskKittyKatTaskListProps {
  imageUrl: string;
  comments?: Comment[];
  newComment?: string;
  newCommentAttachments?: string[];
  onTasksGenerated?: (tasks: Task[]) => void;
  onTaskUpdate?: (tasks: Task[]) => void;
  showCredits?: boolean;
  autoGenerate?: boolean;
  tasks?: Task[];
  allAttachments?: string[];
  onAllAttachmentsChange?: (attachments: string[]) => void;
  brandId?: string | null;
  campaignId?: string | null;
}

export function AskKittyKatTaskList({
  imageUrl,
  comments = [],
  newComment,
  newCommentAttachments = [],
  onTasksGenerated,
  onTaskUpdate,
  showCredits = false,
  autoGenerate = false,
  tasks: externalTasks,
  allAttachments = [],
  onAllAttachmentsChange,
  brandId,
  campaignId,
}: AskKittyKatTaskListProps) {
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [isEditingAll, setIsEditingAll] = useState<boolean>(false);
  const [editingAllText, setEditingAllText] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = externalTasks || [];

  const hasExistingComments = comments && comments.length > 0;
  const hasNewComment = newComment && newComment.trim().length > 0;

  // File upload functionality
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onAllAttachmentsChange) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading files...");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `tasklist-attachment-${Date.now()}-${file.name}`;
        return await uploadFileAndReturnUrl(
          fileName,
          file.type,
          "ask-kittykat",
          file,
          brandId || null,
          campaignId || null
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onAllAttachmentsChange([...allAttachments, ...uploadedUrls]);

      toast.success(`${files.length} file(s) uploaded successfully`, {
        id: toastId,
      });
    } catch (error) {
      toast.error("Failed to upload files", { id: toastId });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    if (onAllAttachmentsChange) {
      onAllAttachmentsChange(allAttachments.filter((_, i) => i !== index));
    }
  };

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleEditAllTasks = () => {
    // Convert tasks to markdown format (using unordered list)
    const tasksMarkdown = tasks.map((task) => `- ${task.task}`).join("\n");
    setEditingAllText(tasksMarkdown);
    setIsEditingAll(true);
  };

  const handleSaveAllTasks = () => {
    if (editingAllText.trim() === "") return;

    // Parse markdown list items and regular lines
    const lines = editingAllText
      .split("\n")
      .filter((line) => line.trim() !== "");
    const taskLines = lines
      .map((line) => {
        // Remove markdown list syntax (-, *, +) and trim
        return line.replace(/^[-*+]\s+/, "").trim();
      })
      .filter((line) => line !== "");

    // Create updated tasks array, preserving original categories and credits
    const updatedTasks = taskLines.map((taskText, index) => {
      const originalTask = tasks[index];
      return {
        task: taskText,
        task_category: originalTask?.task_category || "General",
        estimated_credit: originalTask?.estimated_credit || 1,
      };
    });

    // Update parent's task state
    if (onTaskUpdate) {
      onTaskUpdate(updatedTasks);
    }

    setIsEditingAll(false);
    setEditingAllText("");

    if (onTasksGenerated) {
      onTasksGenerated(updatedTasks);
    }
  };

  const handleCancelEditAll = () => {
    setIsEditingAll(false);
    setEditingAllText("");
  };

  useEffect(() => {
    if (autoGenerate && (hasExistingComments || hasNewComment)) {
      generateTaskList();
    }
  }, [imageUrl, comments, newComment, autoGenerate]);

  // Calculate total credits whenever tasks change
  useEffect(() => {
    const newTotalCredits = tasks.reduce(
      (sum, task) => sum + task.estimated_credit,
      0
    );
    setTotalCredits(newTotalCredits);
  }, [tasks]);

  // React Query mutation for generating tasks
  const generateTasksMutation = useMutation({
    mutationFn: async () => {
      let commentsToProcess = [...comments];

      // Add new comment if provided
      if (hasNewComment) {
        const tempComment: Comment = {
          id: "temp-comment",
          text: newComment.trim(),
          added_by: "current-user",
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attachments:
            newCommentAttachments.length > 0
              ? newCommentAttachments
              : undefined,
        };
        commentsToProcess = [tempComment];
      }

      return await taskListService.generateTaskList(
        imageUrl,
        commentsToProcess
      );
    },
    onSuccess: (response) => {
      // Update parent's task state
      if (onTaskUpdate) {
        onTaskUpdate(response.tasks);
      }
      setTotalCredits(response.total_estimated_credits);

      if (onTasksGenerated) {
        onTasksGenerated(response.tasks);
      }
    },
    onError: () => {
      // Clear tasks on error
      if (onTaskUpdate) {
        onTaskUpdate([]);
      }
      setTotalCredits(0);
    },
  });

  const generateTaskList = () => {
    const generatePromise = generateTasksMutation.mutateAsync();

    toast.promise(generatePromise, {
      loading: "Generating task list...",
      success: "Task list generated successfully!",
      error: (err) => err?.message || "Failed to generate task list",
    });
  };

  // React Query mutation for enhancing tasks
  const enhanceTasksMutation = useMutation({
    mutationFn: async () => {
      if (tasks.length === 0) throw new Error("No tasks to enhance");

      let commentsToProcess = [...comments];

      // Add new comment if provided
      if (hasNewComment) {
        const tempComment: Comment = {
          id: "temp-comment",
          text: newComment.trim(),
          added_by: "current-user",
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attachments:
            newCommentAttachments.length > 0
              ? newCommentAttachments
              : undefined,
        };
        commentsToProcess = [tempComment];
      }

      // Parse the current editing text into tasks
      const lines = editingAllText
        .split("\n")
        .filter((line) => line.trim() !== "");
      const taskLines = lines
        .map((line) => {
          return line.replace(/^[-*+]\s+/, "").trim();
        })
        .filter((line) => line !== "");

      // Create tasks array from current editor content
      const currentTasks = taskLines.map((taskText, index) => {
        const originalTask = tasks[index];
        return {
          task: taskText,
          task_category: originalTask?.task_category || "General",
          estimated_credit: originalTask?.estimated_credit || 1,
        };
      });

      return await taskListService.generateTaskList(
        imageUrl,
        commentsToProcess,
        true, // enhance = true
        currentTasks // use current tasks from editor
      );
    },
    onSuccess: (response) => {
      // Update the editing text with enhanced tasks in markdown format
      const enhancedTasksMarkdown = response.tasks
        .map((task) => `- ${task.task}`)
        .join("\n");
      setEditingAllText(enhancedTasksMarkdown);
    },
  });

  const handleEnhanceTasksInEditMode = () => {
    const enhancePromise = enhanceTasksMutation.mutateAsync();

    toast.promise(enhancePromise, {
      loading: "Enhancing tasks...",
      success: "Tasks enhanced! Review and save changes.",
      error: (err) => err?.message || "Failed to enhance task list",
    });
  };

  // Loading state - check if either mutation is pending
  if (generateTasksMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">Generating task list...</span>
      </div>
    );
  }

  // Error state - check if either mutation has an error
  if (generateTasksMutation.error || enhanceTasksMutation.error) {
    const error = generateTasksMutation.error || enhanceTasksMutation.error;
    return (
      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
        <span className="text-red-700 text-sm">
          {error?.message || "An error occurred"}
        </span>
      </div>
    );
  }

  // No tasks found
  if (tasks.length === 0 && hasExistingComments) {
    return (
      <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
        <span className="text-blue-700 text-sm">
          No actionable tasks identified from the comments.
        </span>
      </div>
    );
  }

  // Tasks display
  if (tasks.length > 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} identified
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showCredits && (
              <span className="text-sm font-semibold text-purple-600">
                {totalCredits} credits
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditAllTasks}
              disabled={isEditingAll}
              className="h-7 px-2"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {isEditingAll ? (
          // Bulk edit mode with react-md-editor
          <div className="space-y-3">
            <div data-color-mode="light">
              <MDEditor
                value={editingAllText}
                onChange={(val) => setEditingAllText(val || "")}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{
                  style: {
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                }}
                height={200}
                data-testid="markdown-editor"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEnhanceTasksInEditMode}
                disabled={enhanceTasksMutation.isPending}
                className="h-7 px-2"
              >
                {enhanceTasksMutation.isPending ? (
                  <Zap className="h-3 w-3 mr-1 animate-pulse" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Enhance
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAllTasks}
                disabled={editingAllText.trim() === ""}
                className="h-7 px-2"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEditAll}
                className="h-7 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Display mode
          <ul className="space-y-3">
            {tasks.map((task, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700 leading-relaxed mb-1">
                    <MarkdownText>{task.task}</MarkdownText>
                  </div>
                  {showCredits && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-200 px-2 py-1 rounded">
                        {task.task_category}
                      </span>
                      <span className="font-medium">
                        {task.estimated_credit} credits
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Attachment Management Section */}
        {onAllAttachmentsChange && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Attachments (
                {allAttachments.length + newCommentAttachments.length})
              </h4>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAttachFiles}
                  disabled={isUploading}
                  className="h-7 px-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Paperclip className="h-3 w-3 mr-1" />
                  )}
                  {isUploading ? "Uploading..." : "Add Images"}
                </Button>
              </div>
            </div>

            {(allAttachments.length > 0 ||
              newCommentAttachments.length > 0) && (
              <div className="space-y-3">
                <AskKittyKatAttachmentPreview
                  attachments={[...allAttachments, ...newCommentAttachments]}
                  onRemoveAttachment={(index) => {
                    if (index < allAttachments.length) {
                      handleRemoveAttachment(index);
                    }
                  }}
                />
              </div>
            )}

            {allAttachments.length === 0 &&
              newCommentAttachments.length === 0 && (
                <p className="text-xs text-gray-500">
                  You can upload additional images to provide more context for
                  your tasks.
                </p>
              )}
          </div>
        )}
      </div>
    );
  }
  return null;
}
