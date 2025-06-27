import { Lock, CheckCircle2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { GalleryActions } from "@/hooks/useGallery";
import { useState } from "react";

interface AskKittykatReviewStatusProps {
  item: GalleryItemResponse;
  onAskKittykat: () => void;
  galleryActions: GalleryActions;
}

const statusConfig = {
  draft: {
    label: "Draft",
    dotColor: "bg-gray-500",
    // ...
  },
  request_created: {
    label: "Awaiting Approval",
    dotColor: "bg-orange-600",
    // ...
  },
  in_progress: {
    label: "In Progress",
    dotColor: "bg-blue-600",
    // ...
  },
  in_review: {
    label: "In Review",
    dotColor: "bg-purple-600",
    // ...
  },
  approved: {
    label: "Approved",
    dotColor: "bg-green-600",
    // ...
  },
  rejected: {
    label: "Rejected",
    dotColor: "bg-red-600",
    // ...
  },
};
export function AskKittykatReviewStatus({
  item,
  onAskKittykat,
  galleryActions,
}: AskKittykatReviewStatusProps) {
  const { user } = useUserStore();
  const isAdmin = user?.role?.id === UserRoleId.ADMIN;

  const currentStatus = item?.workflow_status || "draft";
  const config = statusConfig[currentStatus];

  const [isEditingStatus, setIsEditingStatus] = useState(false); // Edit mode

  const handleStatusChange = (
    newStatus:
      | "draft"
      | "request_created"
      | "in_progress"
      | "in_review"
      | "approved"
      | "rejected"
  ) => {
    galleryActions.patchItem({
      itemId: item.id,
      data: { workflow_status: newStatus },
    });
    setIsEditingStatus(false); // Exit edit mode after change
  };

  return (
    <div className="pt-2 space-y-3">
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

        {isAdmin && isEditingStatus && (
          <div className="w-full">
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([status, config]) => {
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
      {!isAdmin && !item?.sent_to_human_queue && (
        <Button
          onClick={onAskKittykat}
          className="w-full"
          size="lg"
          variant="default"
        >
          <Lock className="w-5 h-5 mr-2" />
          Ask KittyKat
        </Button>
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
    </div>
  );
}
