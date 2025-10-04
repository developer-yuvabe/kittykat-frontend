"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/user.store";
import { CreateTasklistRequest } from "@/types/tasklist.types";
import { useTaskList } from "@/hooks/useTaskList";
import type { GalleryItemResponse } from "@/types/gallery.types";
import { MediaBulkAssetPreview } from "./MediaBulkAssetPreview";

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

  const [requestText, setRequestText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract data from selected items
  const assetIds = selectedItems.map((item) => item.id);
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
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetDialog();
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!requestText.trim()) {
      toast.error("Please enter a request description");
      return;
    }

    if (!brandId || !user?.id) {
      toast.error("Missing required information to create tasklist");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate default credit deduction (5 credits per asset)
      const defaultCreditsPerAsset = 5;
      const totalDefaultCredits = assetIds.length * defaultCreditsPerAsset;

      // Prepare admin notes for bulk request processing
      const notesContent = [
        "🔄 BULK REQUEST - Requires Credit Adjustments",
        "",
        `📊 Overview:`,
        `• Total Assets: ${assetIds.length} items`,
        `• Submitted by: ${user.name || user.email} (${user.email})`,
        `• Submitted on: ${new Date().toLocaleString()}`,
        `• Auto-deducted: ${totalDefaultCredits} credits (${defaultCreditsPerAsset}/asset)`,
        "",
        "🎯 Action Required:",
        "1. Review user request and existing comments below",
        "2. Analyze all asset for work scope",
        "3. Generate appropriate tasks and adjust credits",
        "",
        "📝 User Request:",
        requestText.trim(),
        "",
      ];

      // Add aggregated comments if any exist
      if (aggregatedComments) {
        notesContent.push(
          "💬 Existing Asset Comments:",
          aggregatedComments,
          ""
        );
      }

      // Add asset URLs for reference
      notesContent.push(
        "🔗 Asset URLs for Review:",
        ...assetUrls.map((url, idx) => `${idx + 1}. ${url}`),
        ""
      );

      // Create dummy task for bulk request processing
      const dummyBulkTask = {
        task: "Bulk Request ",
        task_category: "bulk_request",
        estimated_credit: totalDefaultCredits,
      };

      const createRequest: CreateTasklistRequest = {
        asset_ids: assetIds,
        asset_urls: assetUrls,
        brand_id: brandId,
        campaign_id: campaignId || undefined,
        submitted_by: user.id,
        tasks: [dummyBulkTask], // Dummy task - admin will replace with actual tasks
        notes: notesContent.join("\n"),
        submitted_by_name: user.name,
        brand_name: brandName,
        campaign_name: undefined, // Not available in GalleryItemResponse
        is_bulk_request: true,
      };

      await createTaskListMutation.mutateAsync(createRequest);

      toast.success(
        `Bulk request created successfully for ${assetIds.length} assets. Admin will review and process manually.`
      );

      resetDialog();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating bulk tasklist:", error);
      toast.error("Failed to create bulk request. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Bulk Request to KittyKat Experts
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 space-y-3 mt-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-blue-800">
                  <p className="font-medium">
                    You are creating a bulk request for {selectedItems.length}{" "}
                    assets
                  </p>
                  <p className="text-sm">
                    This will create a single tasklist that covers all selected
                    assets. Our admin team will review your request and manually
                    determine the tasks and credits based on the consolidated
                    work required.
                  </p>
                  <p className="text-sm font-medium">
                    💳 Default deduction: {selectedItems.length * 5} credits (5
                    per asset)
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
            <Textarea
              id="bulk-request"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              This request will be sent to the admin team for manual processing
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
                These comments will be included in the bulk request notes for
                admin reference
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!requestText.trim() || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Bulk Request...
              </>
            ) : (
              <>Submit Bulk Request</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
