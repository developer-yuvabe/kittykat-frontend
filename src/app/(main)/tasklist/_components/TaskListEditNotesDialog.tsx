"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTaskList } from "@/hooks/useTaskList";
import { useUserStore } from "@/store/user.store";
import type { TasklistRecord } from "@/types/tasklist.types";
import { useState, useEffect } from "react";
import { FileText, Eye, Edit3 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";

interface TaskListEditNotesDialogProps {
  tasklist: TasklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskListEditNotesDialog = ({
  tasklist,
  isOpen,
  onClose,
}: TaskListEditNotesDialogProps) => {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { updateTaskListMutation } = useTaskList();
  const { user } = useUserStore();

  // Initialize notes when dialog opens
  useEffect(() => {
    if (isOpen && tasklist) {
      setNotes(tasklist.notes || "");
    }
  }, [isOpen, tasklist]);

  const handleSubmit = async () => {
    if (!tasklist || !user) return;

    setIsSubmitting(true);
    try {
      await updateTaskListMutation.mutateAsync({
        tasklistId: tasklist.id!,
        data: {
          notes: notes.trim(),
          log: "Notes updated",
        },
        userId: user.id,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update notes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setNotes("");
      setIsPreviewMode(false);
    }
  };

  const hasChanges = notes.trim() !== (tasklist?.notes || "").trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Notes
          </DialogTitle>
          <DialogDescription>
            Update notes for tasklist{" "}
            <span className="font-mono">TL-{tasklist?.id?.toUpperCase()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto min-h-0">
          {/* Editor Controls */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Notes Content</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="gap-2"
              >
                {isPreviewMode ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Markdown Editor Container */}
          <div
            className="border rounded-lg overflow-hidden flex-shrink-0"
            data-color-mode="light"
          >
            <div style={{ height: "300px", overflow: "auto" }}>
              <MDEditor
                value={notes}
                onChange={(val) => setNotes(val || "")}
                preview={isPreviewMode ? "preview" : "edit"}
                hideToolbar={false}
                visibleDragbar={false}
                height={300}
              />
            </div>
          </div>

          {/* Character Count */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {hasChanges && (
                <span className="text-amber-600 font-medium">
                  Unsaved changes
                </span>
              )}
            </span>
            <span>{notes.length} characters</span>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges}
            className="min-w-[100px]"
          >
            {isSubmitting ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
