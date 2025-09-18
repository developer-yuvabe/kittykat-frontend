import { Lock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { GalleryItemResponse, WorkflowStatus } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { useState, useRef, SetStateAction, Dispatch } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

// Import decomposed components
import { AskKittykartStatusDisplay } from "./AskKittykartStatusDisplay";
import { AskKittykartAcceptDialog } from "./AskKittykartAcceptDialog";
import { AskKittykartRejectDialog } from "./AskKittykartRejectDialog";
import { AskKittykartAcceptAndStartDialog } from "./AskKittykartAcceptAndStartDialog";
import { getClientNameFromComments } from "@/lib/askKittykat.utils";

interface AskKittykatReviewStatusProps {
  item: GalleryItemResponse;
  onAskKittykat: () => void;
  galleryActions: GalleryActions;
  revalidateGalleryItemVersions: (data: GalleryItemResponse) => Promise<void>;
  setCurrentItem: Dispatch<SetStateAction<GalleryItemResponse | null>>;
}

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

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
  const [showAcceptAndStartDialog, setShowAcceptAndStartDialog] =
    useState(false);
  const [isSubmittingAcceptAndStart, setIsSubmittingAcceptAndStart] =
    useState(false);

  // Get client name from comments
  const clientName = getClientNameFromComments(item);

  // Helper function to find the latest tasklist comment
  const findLatestTasklistComment = () => {
    if (!item?.comments) return null;

    const tasklistComments = item.comments.filter(
      (comment) => comment.is_tasklist
    );
    if (tasklistComments.length === 0) return null;

    // Sort by added_at in descending order to get the latest first
    const sortedComments = tasklistComments.sort(
      (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    );

    return sortedComments[0];
  };

  const handleStatusChange = (newStatus: WorkflowStatus) => {
    setCurrentItem((prev) =>
      prev ? { ...prev, workflow_status: newStatus } : prev
    );

    galleryActions.patchItem(
      {
        itemId: item.id,
        data: { workflow_status: newStatus },
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
    setIsSubmittingAccept(true);
    try {
      handleStatusChange("approved");
      setShowAcceptDialog(false);
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  const handleAcceptAndStartSubmit = async (etaDate: Date) => {
    setIsSubmittingAcceptAndStart(true);

    try {
      // Format the ETA date
      const formattedETA = format(etaDate, "PPPP"); // "Friday, September 15th, 2025"

      // Find the latest tasklist comment to reply to
      const latestTasklistComment = findLatestTasklistComment();
      const replyText = `Thanks ${clientName}, our team will start working on this. Estimated delivery: ${formattedETA}.`;

      if (latestTasklistComment) {
        // Add reply to the latest tasklist comment
        galleryActions.addReply(
          {
            itemId: item.id,
            commentId: latestTasklistComment.id,
            replyData: {
              text: replyText,
            },
          },
          {
            onSuccess(data) {
              revalidateGalleryItemVersions(data);
            },
            onError() {
              toast.error("Failed to add reply. Please try again.");
              return;
            },
          }
        );
      } else {
        // Fallback: add as a new comment if no tasklist comment found
        galleryActions.addComment(
          {
            itemId: item.id,
            commentData: {
              text: replyText,
            },
          },
          {
            onSuccess(data) {
              revalidateGalleryItemVersions(data);
            },
            onError() {
              toast.error("Failed to add comment. Please try again.");
              return;
            },
          }
        );
      }

      // Then update the status to in_progress
      handleStatusChange("in_progress");

      // Close dialog
      setShowAcceptAndStartDialog(false);
    } catch (error) {
      console.error("Error accepting and starting:", error);
      toast.error("Failed to accept and start. Please try again.");
    } finally {
      setIsSubmittingAcceptAndStart(false);
    }
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
    <div className="space-y-1">
      {/* Status Display Component */}
      <AskKittykartStatusDisplay
        currentStatus={currentStatus}
        isAdmin={isAdmin}
        isEditingStatus={isEditingStatus}
        onEditClick={() => setIsEditingStatus(true)}
        onStatusChange={handleStatusChange}
      />

      {/* Action Buttons */}
      {!item?.sent_to_human_queue && currentStatus !== "in_review" && (
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
          onClick={() => setShowAcceptAndStartDialog(true)}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Accept and Start
        </Button>
      )}

      {/* Decomposed Dialog Components */}
      <AskKittykartAcceptDialog
        isOpen={showAcceptDialog}
        isSubmitting={isSubmittingAccept}
        onClose={() => setShowAcceptDialog(false)}
        onAccept={handleAccept}
      />

      <AskKittykartRejectDialog
        isOpen={showRejectDialog}
        isSubmitting={isSubmittingReject}
        rejectReason={rejectReason}
        attachedFiles={attachedFiles}
        onClose={handleRejectDialogClose}
        onRejectReasonChange={setRejectReason}
        onFileUpload={handleFileUpload}
        onRemoveFile={removeFile}
        onSubmit={handleRejectSubmit}
      />

      <AskKittykartAcceptAndStartDialog
        isOpen={showAcceptAndStartDialog}
        isSubmitting={isSubmittingAcceptAndStart}
        clientName={clientName}
        onClose={() => setShowAcceptAndStartDialog(false)}
        onSubmit={handleAcceptAndStartSubmit}
      />
    </div>
  );
}
