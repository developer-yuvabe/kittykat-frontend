import { WORKFLOW_STATUS_MAP } from "@/lib/gallery.utils";
import { useUserStore } from "@/store/user.store";
import { WorkflowStatus } from "@/types/gallery.types";
import { TasklistStatus } from "@/types/tasklist.types";
import { Edit } from "lucide-react";

export const TaskListStatusCell = ({
  status,
  assetId,
  brandId,
  isAdmin,
  onUpdateWorkflowStatus,
}: {
  status?: TasklistStatus;
  assetId: string;
  brandId: string;
  isAdmin: boolean;
  onUpdateWorkflowStatus?: (assetId: string, brandId: string) => void;
}) => {
  const { user } = useUserStore();

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdmin && user?.role.id === "KK-ADMIN" && onUpdateWorkflowStatus) {
      onUpdateWorkflowStatus(assetId, brandId);
    }
  };

  if (!status) {
    return (
      <div
        className={`flex justify-center ${
          isAdmin && user?.role.id === "KK-ADMIN"
            ? "cursor-pointer hover:bg-muted rounded-md p-1"
            : ""
        }`}
        onClick={handleStatusClick}
      >
        <span className="text-muted-foreground text-center text-sm">—</span>
        {isAdmin && user?.role.id === "KK-ADMIN" && (
          <Edit className="w-3 h-3 ml-1 text-muted-foreground opacity-0 group-hover:opacity-100" />
        )}
      </div>
    );
  }

  const statusConfig = WORKFLOW_STATUS_MAP[status as WorkflowStatus];

  return (
    <div
      className={`flex items-center justify-center gap-2 group ${
        isAdmin && user?.role.id === "KK-ADMIN"
          ? "cursor-pointer hover:opacity-80"
          : ""
      }`}
      onClick={handleStatusClick}
    >
      <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
      <span className="text-xs font-medium truncate">{statusConfig.label}</span>
    </div>
  );
};
