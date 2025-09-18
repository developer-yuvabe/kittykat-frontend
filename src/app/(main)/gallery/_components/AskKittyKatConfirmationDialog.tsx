"use client";

import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/types/gallery.types";
import taskListService from "@/services/api/tasklist.service";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "@/store/user.store";
import { AskKittyKatCommentInput } from "./AskKittyKatCommentInput";
import { AskKittyKatTaskList } from "./AskKittyKatTaskList";
import { CreateTasklistRequest } from "@/types/tasklist.types";
import { formatTasksAsMarkdown } from "@/lib/askKittykat.utils";

interface AskKittyKatConfirmationDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onConfirm: (newComment?: {
    text: string;
    attachments?: string[];
    is_tasklist?: boolean;
  }) => void;
  comments: Comment[];
  imageUrl: string;
  brandId?: string | null;
  campaignId?: string | null;
  imageId: string;
  allAttachments: string[];
  onAllAttachmentsChange: Dispatch<SetStateAction<string[]>>;
}

interface TaskListTask {
  task: string;
  task_category: string;
  estimated_credit: number;
}

export function AskKittyKatConfirmationDialog({
  open,
  setOpen,
  onConfirm,
  comments,
  imageUrl,
  brandId,
  campaignId,
  imageId,
  allAttachments,
  onAllAttachmentsChange,
}: AskKittyKatConfirmationDialogProps) {
  const { user } = useUserStore();
  const [tasks, setTasks] = useState<TaskListTask[]>([]);

  // New comment input state
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  // Initialize all attachments when dialog opens or comments change
  useEffect(() => {
    if (open) {
      const initialAttachments: string[] = [];

      // Add existing attachments from comments
      if (comments && comments.length > 0) {
        comments.forEach((comment) => {
          if (comment.attachments && comment.attachments.length > 0) {
            initialAttachments.push(...comment.attachments);
          }
        });
      }

      // Initialize parent's allAttachments state
      onAllAttachmentsChange(initialAttachments);
    }
  }, [open, comments, onAllAttachmentsChange]);

  // Reset function to clear all state
  const resetState = () => {
    setNewComment("");
    setAttachments([]);
    setTasks([]);
    setIsGeneratingTasks(false);
    onAllAttachmentsChange([]);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  // Create tasklist mutation
  const createTasklistMutation = useMutation({
    mutationFn: (request: CreateTasklistRequest) =>
      taskListService.createTasklist(request),
    onSuccess: () => {
      toast.success("Tasklist created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create tasklist");
      console.error("Error creating tasklist:", error);
    },
  });

  const hasNoComments = !comments || comments.length === 0;
  const hasTasks = tasks.length > 0;

  const handleTasksGenerated = (generatedTasks: TaskListTask[]) => {
    setTasks(generatedTasks);
  };

  const generateTasksFromComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsGeneratingTasks(true);

      // Create a temporary comment object to send to the API
      const tempComment: Comment = {
        id: "temp-comment",
        text: newComment.trim(),
        added_by: "current-user",
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const response = await taskListService.generateTaskList(imageUrl, [
        tempComment,
      ]);
      setTasks(response.tasks);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate task list"
      );
      setTasks([]);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const createTasklistRecord = async () => {
    if (!brandId || !user?.id || tasks.length === 0) {
      toast.error("Missing required information to create tasklist");
      return false;
    }

    try {
      const createRequest: CreateTasklistRequest = {
        image_id: imageId,
        brand_id: brandId,
        campaign_id: campaignId || undefined,
        asset_url: imageUrl,
        submitted_by: user.id,
        tasks: tasks,
        notes: hasNoComments ? newComment.trim() : undefined,
      };

      await createTasklistMutation.mutateAsync(createRequest);
      return true;
    } catch (error) {
      console.error("Error creating tasklist:", error);
      return false;
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    resetState();
  };

  const handleConfirm = async () => {
    if (isGeneratingTasks || createTasklistMutation.isPending) return;

    if (hasNoComments) {
      // For new comments, need to add comment first and generate tasks if not done
      if (!newComment.trim()) {
        toast.error("Please add a comment before confirming.");
        return;
      }

      // If tasks haven't been generated yet, generate them first
      if (tasks.length === 0) {
        await generateTasksFromComment();
        // Wait a bit for tasks to be set
        setTimeout(async () => {
          if (tasks.length > 0) {
            const success = await createTasklistRecord();
            if (success) {
              const taskListMarkdown = formatTasksAsMarkdown(tasks);
              const commentText = `**Tasks identified:**\n${taskListMarkdown}`;

              // Combine new comment attachments with all managed attachments
              const finalAttachments = [
                ...(attachments.length > 0 ? attachments : []),
                ...allAttachments,
              ];

              onConfirm({
                text: commentText,
                attachments:
                  finalAttachments.length > 0 ? finalAttachments : undefined,
                is_tasklist: true,
              });
            }
          }
        }, 100);
        return;
      }

      // Create tasklist and then confirm
      const success = await createTasklistRecord();
      if (success) {
        const taskListMarkdown = formatTasksAsMarkdown(tasks);
        const commentText = `**Tasklist (requested):**\n${taskListMarkdown}`;

        // Combine new comment attachments with all managed attachments
        const finalAttachments = [
          ...(attachments.length > 0 ? attachments : []),
          ...allAttachments,
        ];

        onConfirm({
          text: commentText,
          attachments:
            finalAttachments.length > 0 ? finalAttachments : undefined,
          is_tasklist: true,
        });
      }
    } else {
      // For existing comments, create tasklist and then add task list as a comment
      if (tasks.length === 0) {
        toast.error("No tasks identified. Cannot create tasklist.");
        return;
      }

      const success = await createTasklistRecord();
      if (success) {
        const taskListMarkdown = formatTasksAsMarkdown(tasks);
        const commentText = `**Tasklist (requested):**\n${taskListMarkdown}`;

        onConfirm({
          text: commentText,
          attachments: allAttachments.length > 0 ? allAttachments : undefined,
          is_tasklist: true,
        });
      }
    }
  };

  const canConfirm = () => {
    if (isGeneratingTasks || createTasklistMutation.isPending) return false;

    if (hasNoComments) {
      // For new comments, require a comment text
      return newComment.trim().length > 0;
    } else {
      // For existing comments, just check if not loading
      return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Ready to Ask KittyKat Experts?
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 space-y-3">
            <p>
              Clicking KittyKat Experts will formally trigger the creative team
              to start work.
            </p>
            <p>
              Make sure your request is finalized in the comments and all
              required images are uploaded — changes after this point may not be
              possible and the request may become chargeable.
            </p>
          </DialogDescription>
        </DialogHeader>

        {/* Task List Section */}
        <div className="my-4">
          <h3 className="text-lg font-medium mb-3">
            {hasNoComments ? "Add Your Request" : "Task Summary"}
          </h3>

          {hasNoComments ? (
            /* Comment Input Form */
            <div className="space-y-4">
              {/* Only show comment input if no tasks have been generated */}
              {!hasTasks && (
                <AskKittyKatCommentInput
                  comment={newComment}
                  onCommentChange={setNewComment}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  onGenerateTasks={generateTasksFromComment}
                  isGeneratingTasks={isGeneratingTasks}
                  brandId={brandId}
                  campaignId={campaignId}
                />
              )}

              {/* Show tasks after generation */}
              <AskKittyKatTaskList
                imageUrl={imageUrl}
                newComment={newComment}
                newCommentAttachments={attachments}
                onTasksGenerated={handleTasksGenerated}
                onTaskUpdate={setTasks}
                showCredits={false}
                autoGenerate={false}
                tasks={tasks}
                allAttachments={allAttachments}
                onAllAttachmentsChange={onAllAttachmentsChange}
                brandId={brandId}
                campaignId={campaignId}
              />
            </div>
          ) : (
            /* Existing comments task list display */
            <AskKittyKatTaskList
              imageUrl={imageUrl}
              comments={comments}
              onTasksGenerated={handleTasksGenerated}
              onTaskUpdate={setTasks}
              showCredits={false}
              autoGenerate={true}
              tasks={tasks}
              allAttachments={allAttachments}
              onAllAttachmentsChange={onAllAttachmentsChange}
              brandId={brandId}
              campaignId={campaignId}
            />
          )}
        </div>

        <DialogFooter
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="outline" onClick={handleCancel}>
            Back to editing
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGeneratingTasks || createTasklistMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isGeneratingTasks ? "Processing..." : "Creating tasklist..."}
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
