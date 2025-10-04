"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Comment } from "@/types/gallery.types";
import taskListService from "@/services/api/tasklist.service";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Task, TaskCreditEstimateRequest } from "@/types/tasklist.types";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { AskKittyKatTaskDisplay } from "./AskKittyKatTaskDisplay";
import { AskKittyKatBulkEditor } from "./AskKittyKatBulkEditor";
import { AskKittyKatAttachmentSection } from "./AskKittyKatAttachmentSection";

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
  const [estimatingTasks, setEstimatingTasks] = useState<Set<number>>(
    new Set()
  );

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

  const handleEditAllTasks = () => {
    // Convert tasks to markdown format (using unordered list)
    const tasksMarkdown = tasks.map((task) => `- ${task.task}`).join("\n");
    setEditingAllText(tasksMarkdown);
    setIsEditingAll(true);
  };

  const handleSaveAllTasks = async () => {
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

    // Identify new tasks (those not in original tasks)
    const newTaskIndices: number[] = [];
    const updatedTasks: Task[] = taskLines.map((taskText, index) => {
      const originalTask = tasks[index];
      if (originalTask && originalTask.task === taskText) {
        // Existing task, keep original data
        return originalTask;
      } else {
        // New or modified task, mark for estimation
        newTaskIndices.push(index);
        return {
          task: taskText,
          task_category: "General", // Temporary
          estimated_credit: 0, // Will be estimated
        };
      }
    });

    if (newTaskIndices.length === 0) {
      // No new tasks, save immediately
      if (onTaskUpdate) {
        onTaskUpdate(updatedTasks);
      }
      setIsEditingAll(false);
      setEditingAllText("");
      if (onTasksGenerated) {
        onTasksGenerated(updatedTasks);
      }
      return;
    }

    // Estimate credits for new tasks
    setEstimatingTasks(new Set(newTaskIndices));

    try {
      const estimationPromises = newTaskIndices.map(async (index) => {
        const taskText = taskLines[index];
        const result = await estimateTaskCreditMutation.mutateAsync(taskText);
        updatedTasks[index] = {
          task: taskText,
          task_category: result.task_category,
          estimated_credit: result.estimated_credit,
        };
      });

      await Promise.all(estimationPromises);

      // Update parent's task state
      if (onTaskUpdate) {
        onTaskUpdate(updatedTasks);
      }
      setIsEditingAll(false);
      setEditingAllText("");

      if (onTasksGenerated) {
        onTasksGenerated(updatedTasks);
      }
    } catch (error) {
      toast.error("Failed to estimate credits for some tasks");
      console.error("Estimation error:", error);
    } finally {
      setEstimatingTasks(new Set());
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

  // React Query mutation for estimating task credits
  const estimateTaskCreditMutation = useMutation({
    mutationFn: async (taskText: string) => {
      const request: TaskCreditEstimateRequest = {
        task: taskText,
        image_url: imageUrl,
      };
      return await taskListService.estimateTaskCredit(request);
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
        {isEditingAll ? (
          <AskKittyKatBulkEditor
            editingText={editingAllText}
            onTextChange={setEditingAllText}
            onEnhance={handleEnhanceTasksInEditMode}
            onSave={handleSaveAllTasks}
            onCancel={handleCancelEditAll}
            isEnhancing={enhanceTasksMutation.isPending}
            isSaving={estimatingTasks.size > 0}
          />
        ) : (
          <AskKittyKatTaskDisplay
            tasks={tasks}
            showCredits={showCredits}
            totalCredits={totalCredits}
            onEditAll={handleEditAllTasks}
            isEditing={isEditingAll}
          />
        )}

        {/* Attachment Management Section */}
        {onAllAttachmentsChange && (
          <AskKittyKatAttachmentSection
            allAttachments={allAttachments}
            newCommentAttachments={newCommentAttachments}
            onRemoveAttachment={handleRemoveAttachment}
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
          />
        )}
      </div>
    );
  }
  return null;
}
