"use client";

import React, { useState, useEffect } from "react";
import { MarkdownText } from "@/components/thread/markdown-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { Comment } from "@/types/gallery.types";
import taskListService from "@/services/api/tasklist.service";

interface Task {
  task: string;
  task_category: string;
  estimated_credit: number;
}

interface AskKittyKatTaskListProps {
  imageUrl: string;
  comments?: Comment[];
  newComment?: string;
  newCommentAttachments?: string[];
  onTasksGenerated?: (tasks: Task[]) => void;
  onTaskUpdate?: (tasks: Task[]) => void; // Callback to update parent's task state
  showCredits?: boolean;
  autoGenerate?: boolean;
  tasks?: Task[]; // Allow external tasks to be passed in
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
}: AskKittyKatTaskListProps) {
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingAll, setIsEditingAll] = useState<boolean>(false);
  const [editingAllText, setEditingAllText] = useState<string>("");

  // Use external tasks if provided, otherwise empty array
  const tasks = externalTasks || [];

  const hasExistingComments = comments && comments.length > 0;
  const hasNewComment = newComment && newComment.trim().length > 0;

  const handleEditAllTasks = () => {
    // Convert tasks to text format (one task per line)
    const tasksText = tasks.map((task) => task.task).join("\n");
    setEditingAllText(tasksText);
    setIsEditingAll(true);
  };

  const handleSaveAllTasks = () => {
    if (editingAllText.trim() === "") return;

    // Split text by lines and filter out empty lines
    const taskLines = editingAllText
      .split("\n")
      .filter((line) => line.trim() !== "");

    // Create updated tasks array, preserving original categories and credits
    const updatedTasks = taskLines.map((taskText, index) => {
      const originalTask = tasks[index];
      return {
        task: taskText.trim(),
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

  const generateTaskList = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      const response = await taskListService.generateTaskList(
        imageUrl,
        commentsToProcess
      );

      // Update parent's task state
      if (onTaskUpdate) {
        onTaskUpdate(response.tasks);
      }
      setTotalCredits(response.total_estimated_credits);

      if (onTasksGenerated) {
        onTasksGenerated(response.tasks);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate task list";
      setError(errorMessage);

      // Clear tasks on error
      if (onTaskUpdate) {
        onTaskUpdate([]);
      }
      setTotalCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">Generating task list...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
        <span className="text-red-700 text-sm">{error}</span>
      </div>
    );
  }

  // No tasks found
  if (tasks.length === 0 && (hasExistingComments || hasNewComment)) {
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
              className="h-7 px-2"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {isEditingAll ? (
          // Bulk edit mode
          <div className="space-y-3">
            <Textarea
              value={editingAllText}
              onChange={(e) => setEditingAllText(e.target.value)}
              className="min-h-[200px] text-sm"
              placeholder="Edit tasks (one per line)..."
              autoFocus
            />
            <div className="flex items-center gap-2">
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
      </div>
    );
  }

  // Generate button for manual generation
  if (!autoGenerate && (hasExistingComments || hasNewComment)) {
    return (
      <div className="flex justify-center">
        <Button
          onClick={generateTaskList}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            "Generate Task List"
          )}
        </Button>
      </div>
    );
  }

  return null;
}

// Export utility function for other components
export { type Task };
export const formatTasksAsMarkdown = (tasks: Task[]) => {
  if (tasks.length === 0) return "";
  return tasks.map((task) => `- ${task.task}`).join("\n");
};
