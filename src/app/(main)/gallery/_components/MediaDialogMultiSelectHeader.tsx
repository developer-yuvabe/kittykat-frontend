// components/MultiSelectHeader.tsx

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MultiSelectHeaderProps {
  isActive: boolean;
  currentSelectionCount: number;
  onClearSelection: () => void;
  onAddSelectedItems: () => void;
  totalAssets: number;
}

export function MediaDialogMultiSelectHeader({
  isActive,
  currentSelectionCount,
  onClearSelection,
  onAddSelectedItems,
  totalAssets,
}: MultiSelectHeaderProps) {
  if (!isActive) return null;

  return (
    <div className="flex flex-col gap-1 mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Multi-select mode
          </span>
          {currentSelectionCount > 0 && (
            <span className="text-sm text-gray-500">
              ({currentSelectionCount} selected)
            </span>
          )}
        </div>
        {currentSelectionCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={onAddSelectedItems}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={totalAssets > 16}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Selected ({currentSelectionCount})
            </Button>
          </div>
        )}
      </div>

      {totalAssets >= 16 && (
        <p className="text-xs text-red-500">
          Maximum of 16 images allowed in the moodboard.
        </p>
      )}
    </div>
  );
}
