import { Lock, CheckCircle2, Edit, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useState, useRef, SetStateAction, Dispatch } from "react";
import { toast } from "sonner";

interface AskKittykatReviewStatusProps {
  item: GalleryItemResponse;
  onAskKittykat: () => void;
  galleryActions: GalleryActions;
  revalidateGalleryItemVersions: (data: GalleryItemResponse) => Promise<void>;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
}

import { WorkflowStatus } from "@/types/gallery.types";
import { WORKFLOW_STATUS_MAP } from "@/lib/gallery.utils";

export function AskKittykatReviewStatus({
  item,
  onAskKittykat,
  galleryActions,
  revalidateGalleryItemVersions,
  setCurrentItem,
}: AskKittykatReviewStatusProps) {
  const { user } = useUserStore();
  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  const currentStatus = item?.workflow_status || "draft";

  const config = WORKFLOW_STATUS_MAP[currentStatus as WorkflowStatus];

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

  const handleStatusChange = (
    newStatus:
      | "draft"
      | "request_created"
      | "in_progress"
      | "in_review"
      | "approved"
      | "requested_revision"
      | "a2i_media_created"
  ) => {
    setCurrentItem((prev) =>
      prev ? { ...prev, workflow_status: newStatus as WorkflowStatus } : prev
    );

    galleryActions.patchItem(
      {
        itemId: item.id,
        data: { workflow_status: newStatus as WorkflowStatus },
      },
      {
        onSuccess(data) {
          setCurrentItem(data);
          revalidateGalleryItemVersions(data);
        },
        onError() {
          setCurrentItem(item);
        },
      }
    );

    setIsEditingStatus(false);
  };

  const handleAccept = () => {
    handleStatusChange("approved");
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const resetRejectForm = () => {
    setRejectReason("");
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRejectDialogClose = () => {
    setShowRejectDialog(false);
    resetRejectForm();
  };

  const handleAcceptDialogClose = () => {
    setShowAcceptDialog(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      return;
    }

    setIsSubmittingReject(true);

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachedFiles.length > 0) {
        const uploadPromises = attachedFiles.map((file) =>
          uploadFileAndReturnUrl(
            file.name,
            file.type,
            "ask-kittykat",
            file,
            item.brand_id,
            item.campaign_id
          )
        );
        attachmentUrls = await Promise.all(uploadPromises);
      }

      // Add comment with rejection reason
      galleryActions.addComment(
        {
          itemId: item.id,
          commentData: {
            text: `[Revision Request - Feedback] ${rejectReason}`,
            attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          },
        },
        {
          onSuccess(data) {
            revalidateGalleryItemVersions(data);
          },
          onError() {
            // Rollback on error
            setCurrentItem((prev) =>
              prev ? { ...prev, comments: prev.comments } : prev
            );
            toast.error("Failed to update reply like. Please try again.");
          },
        }
      );

      // Update status to rejected
      handleStatusChange("requested_revision");

      // Reset form and close dialog
      resetRejectForm();
      setShowRejectDialog(false);
    } catch (error) {
      console.error("Error submitting rejection:", error);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Status Display with Edit for Admin */}
      <div className="p-3 flex flex-col gap-2">
        <h1 className="flex items-center gap-2">
          Status
          {isAdmin && !isEditingStatus && (
            <button
              type="button"
              onClick={() => setIsEditingStatus(true)}
              className="text-gray-500 hover:text-gray-800"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </h1>

        {!isEditingStatus && (
          <div className="flex flex-row gap-x-2 items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        )}

        {isAdmin && currentStatus === "draft" && (
          <div className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2">
            The client has not requested human edit on this image yet.
          </div>
        )}

        {isAdmin && isEditingStatus && (
          <div className="w-full">
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORKFLOW_STATUS_MAP).map(([status, config]) => {
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`}
                        />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isAdmin &&
        !item?.sent_to_human_queue &&
        currentStatus !== "in_review" && (
          <Button
            onClick={onAskKittykat}
            className="w-full"
            size="lg"
            variant="default"
          >
            <Lock className="w-5 h-5 mr-2" />
            Ask KittyKat Expert
          </Button>
        )}

      {/* User Review Buttons (when status is in_review and user is not admin) */}
      {!isAdmin && currentStatus === "in_review" && (
        <div className="flex gap-2">
          {/* <Button
            onClick={handleAccept}
            className="flex-1"
            size="lg"
            variant="default"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Accept
          </Button> */}
          <Button
            onClick={() => setShowAcceptDialog(true)}
            className="flex-1"
            size="lg"
            variant="default"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Accept
          </Button>
          <Button
            onClick={handleRejectClick}
            className="flex-1"
            size="lg"
            variant="destructive"
          >
            <X className="w-5 h-5 mr-2" />
            Reject
          </Button>
        </div>
      )}

      {isAdmin && currentStatus === "request_created" && (
        <Button
          className="w-full"
          size="lg"
          variant="default"
          onClick={() => handleStatusChange("in_progress")}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Accept and Start
        </Button>
      )}

      {/* Accept Dialog */}
      <Dialog
        open={showAcceptDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleAcceptDialogClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve this image?</DialogTitle>
            <DialogDescription>
              By accepting, you give final approval for the image(s).
              <br />
              <strong>This action cannot be undone</strong>, and any changes
              requested afterwards may incur additional charges.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleAcceptDialogClose}
              disabled={isSubmittingAccept}
            >
              Back to Review
            </Button>
            <Button
              onClick={async () => {
                setIsSubmittingAccept(true);
                try {
                  handleAccept();
                  handleAcceptDialogClose();
                } finally {
                  setIsSubmittingAccept(false);
                }
              }}
              disabled={isSubmittingAccept}
              variant="default"
            >
              {isSubmittingAccept ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleRejectDialogClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Help us improve by sharing what needs to be corrected. Your
              feedback helps us deliver quality images that meet your
              expectations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What would you like us to improve?
              </label>
              <Textarea
                placeholder="Please describe what needs to be changed or improved..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px] max-w-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Attach reference files (optional)
              </label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />

                {attachedFiles.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs"
                      >
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleRejectDialogClose}
              disabled={isSubmittingReject}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || isSubmittingReject}
              variant="destructive"
            >
              {isSubmittingReject ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
