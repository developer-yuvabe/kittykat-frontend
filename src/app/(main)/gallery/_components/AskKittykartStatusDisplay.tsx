import { Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowStatus } from "@/types/gallery.types";
import { WORKFLOW_STATUS_MAP } from "@/lib/gallery.utils";

interface AskKittykartStatusDisplayProps {
  currentStatus: string;
  isAdmin: boolean;
  isEditingStatus: boolean;
  onEditClick: () => void;
  onStatusChange: (status: WorkflowStatus) => void;
}

export function AskKittykartStatusDisplay({
  currentStatus,
  isAdmin,
  isEditingStatus,
  onEditClick,
  onStatusChange,
}: AskKittykartStatusDisplayProps) {
  const config = WORKFLOW_STATUS_MAP[currentStatus as WorkflowStatus];

  return (
    <div className="p-3 flex flex-col gap-2">
      <h1 className="flex items-center gap-2">
        Status
        {isAdmin && !isEditingStatus && (
          <button
            type="button"
            onClick={onEditClick}
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
          <Select value={currentStatus} onValueChange={onStatusChange}>
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
  );
}
