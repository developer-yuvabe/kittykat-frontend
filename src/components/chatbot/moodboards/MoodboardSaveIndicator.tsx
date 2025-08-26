"use client";

import { Loader2 } from "lucide-react";

interface MoodboardSaveIndicatorProps {
  isMoodboardSaving: boolean;
  hasUnsavedChanges: boolean;
}

function MoodboardSaveIndicator({
  isMoodboardSaving,
  hasUnsavedChanges,
}: MoodboardSaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {isMoodboardSaving ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
          <span className="text-sm">Syncing</span>
        </>
      ) : hasUnsavedChanges ? (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm">Unsaved changes</span>
        </>
      ) : (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm">Saved</span>
        </>
      )}
    </div>
  );
}

export default MoodboardSaveIndicator;
