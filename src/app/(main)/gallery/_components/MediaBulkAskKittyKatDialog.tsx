"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Paperclip, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/user.store";
import { CreateTasklistRequest } from "@/types/tasklist.types";
import { useTaskList } from "@/hooks/useTaskList";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaBulkAssetPreview } from "./MediaBulkAssetPreview";
import MDEditor from "@uiw/react-md-editor";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { AskKittyKatAttachmentPreview } from "./AskKittyKatAttachmentPreview";
import taskListService from "@/services/api/tasklist.service";
import { useGalleryQuery } from "@/hooks/useGallery";

interface MediaBulkAskKittyKatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: GalleryItemResponse[];
  brandName: string;
  onSuccess: () => void;
}

export function MediaBulkAskKittyKatDialog({
  open,
  onOpenChange,
  selectedItems,
  brandName,
  onSuccess,
}: MediaBulkAskKittyKatDialogProps) {
  const { user } = useUserStore();
  const { createTaskListMutation } = useTaskList();
  const { addComment, patchItem } = useGalleryQuery({}, 20, false);

  const [requestText, setRequestText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract data from selected items
  const assetUrls = selectedItems.map((item) => item.asset_url);
  const brandId = selectedItems[0]?.brand_id;
  const campaignId = selectedItems[0]?.campaign_id;
  // brandName passed as prop, campaignName not available in GalleryItemResponse

  // Aggregate existing comments from all selected items
  const aggregatedComments = selectedItems
    .flatMap((item) => item.comments || [])
    .filter((comment) => comment.text.trim())
    .map((comment) => `- ${comment.text}`)
    .join("\n");

  const resetDialog = () => {
    setRequestText("");
    setIsSubmitting(false);
    setAttachments([]);
    setIsUploading(false);
    setIsEnhancing(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetDialog();
      onOpenChange(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading files...");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `bulk-request-attachment-${Date.now()}-${file.name}`;
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
      setAttachments([...attachments, ...uploadedUrls]);

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
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleEnhance = async () => {
    if (!requestText.trim()) {
      toast.error("Please enter a request description before enhancing");
      return;
    }

    setIsEnhancing(true);
    const toastId = toast.loading("Enhancing your request...");

    try {
      const tempComment = {
        id: "temp",
        text: requestText.length > 0 ? requestText : "No description provided",
        added_by: user?.id || "",
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await taskListService.generateTaskList(
        assetUrls[0],
        [tempComment],
        true
      );

      if (response.tasks && response.tasks.length > 0) {
        const enhancedDescription = response.tasks
          .map((task) => `- ${task.task}`)
          .join("\n");
        setRequestText(enhancedDescription);
        toast.success("Request enhanced successfully!", { id: toastId });
      } else {
        toast.info("No enhancements suggested", { id: toastId });
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      toast.error("Failed to enhance request", { id: toastId });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    if (!brandId || !user?.id) {
      toast.error("Missing required information to create tasklist");
      return;
    }

    setIsSubmitting(true);

    try {
      const defaultCreditsPerAsset = 3;
      const totalAssets = selectedItems.length;

      const tasklistPromises = selectedItems.map(async (item, index) => {
        const notesContent = [
          `🔄 Part of Bulk Request (${index + 1}/${totalAssets})`,
          "",
          `� User Request:`,
          requestText.trim().length > 0
            ? requestText.trim()
            : "No description provided",
          "",
        ];

        if (item.comments && item.comments.length > 0) {
          const assetComments = item.comments
            .filter((comment) => comment.text.trim())
            .map((comment) => `- ${comment.text}`)
            .join("\n");

          if (assetComments) {
            notesContent.push("💬 Existing Asset Comments:", assetComments, "");
          }
        }

        const dummyTask = {
          task: requestText.trim(),
          task_category: "bulk_request",
          estimated_credit: defaultCreditsPerAsset,
        };

        const createRequest: CreateTasklistRequest = {
          asset_ids: [item.id],
          asset_urls: [item.asset_url],
          brand_id: brandId,
          campaign_id: campaignId || undefined,
          submitted_by: user.id,
          tasks: [dummyTask],
          notes: notesContent.join("\n"),
          submitted_by_name: user.name,
          brand_name: brandName,
          campaign_name: undefined,
          is_bulk_request: false,
          team_id: user?.active_team_id,
        };

        const tasklist = await createTaskListMutation.mutateAsync(
          createRequest
        );

        const commentText = `**Tasklist (requested):**\n- ${
          dummyTask.task.length > 0 ? dummyTask.task : "No description provided"
        }`;

        addComment({
          itemId: item.id,
          commentData: {
            text: commentText,
            attachments: attachments.length > 0 ? attachments : undefined,
            is_tasklist: true,
          },
        });

        patchItem({
          itemId: item.id,
          data: {
            workflow_status: "request_created",
            tasklist_id: tasklist.id,
            sent_to_human_queue: true,
            sent_to_queue_at: new Date().toISOString(),
          },
        });

        return tasklist;
      });

      await Promise.all(tasklistPromises);

      toast.success(
        `Successfully created ${totalAssets} separate tasklists (${defaultCreditsPerAsset} credits each).`
      );

      resetDialog();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating tasklists:", error);
      toast.error("Failed to create tasklists. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Submitting Your Request to KittyKat Experts
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 space-y-3 mt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-blue-800">
                  <p className="text-sm">
                    Each selected asset will be sent as a separate tasklist with
                    the same request details.
                  </p>
                  <p className="text-sm">
                    You&apos;ll be able to track progress and feedback for each
                    image individually under your tasklists.
                  </p>
                  <p className="text-sm font-medium">
                    💳 Credit Deduction: 3 credits per asset (total:{" "}
                    {selectedItems.length * 3} credits)
                  </p>
                  <p className="text-xs text-blue-700">
                    For larger bulk submissions, our team may adjust credits
                    after reviewing the scope of work.
                  </p>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Asset Preview */}
          <MediaBulkAssetPreview selectedItems={selectedItems} />

          {/* Request Description */}
          <div className="space-y-3">
            <Label htmlFor="bulk-request" className="text-sm font-medium">
              Describe Your Request *
            </Label>
            <div data-color-mode="light">
              <MDEditor
                value={requestText}
                onChange={(val) => setRequestText(val || "")}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{
                  placeholder:
                    "Describe what you need done for these assets...",
                  style: {
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontFamily:
                      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                  },
                }}
                height={200}
              />
            </div>

            <AskKittyKatAttachmentPreview
              attachments={attachments}
              onRemoveAttachment={handleRemoveAttachment}
            />

            <div className="flex items-center justify-between">
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
                  variant="ghost"
                  size="sm"
                  onClick={handleAttachFiles}
                  disabled={isUploading || isSubmitting}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEnhance}
                disabled={
                  isEnhancing ||
                  isSubmitting ||
                  !requestText.trim() ||
                  isUploading
                }
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enhance
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Use the enhance button to get AI-powered suggestions for improving
              your request description
            </p>
          </div>

          {/* Aggregated Comments Preview (if any) */}
          {aggregatedComments && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Existing Comments (from selected assets)
              </Label>
              <div className="bg-gray-50 border rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                  {aggregatedComments}
                </pre>
              </div>
              <p className="text-xs text-gray-500">
                These comments will be included in each tasklist for reference
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isUploading || isEnhancing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || isEnhancing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Tasklists...
              </>
            ) : (
              <>Submit {selectedItems.length} Requests</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
