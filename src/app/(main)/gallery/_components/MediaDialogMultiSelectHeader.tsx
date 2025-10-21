// components/MultiSelectHeader.tsx

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Compact inline header: no 'Multi-select mode' text, only show clear/add actions

  return (
    <div className="flex items-center gap-3">
      {currentSelectionCount > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
            {totalAssets > 16 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        size="sm"
                        onClick={onAddSelectedItems}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={true}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add ({currentSelectionCount})
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Maximum of 16 images allowed in the moodboard.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                size="sm"
                onClick={onAddSelectedItems}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={false}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add ({currentSelectionCount})
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
