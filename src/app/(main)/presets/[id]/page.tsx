"use client";

import { useParams } from "next/navigation";
import { usePresets } from "@/hooks/usePresets";
import { PresetEditor } from "../_components/PresetEditor";
import { PresetEditorSkeleton } from "../_components/PresetEditorSkeleton";
import { PresetEditorMode } from "@/types/preset.types";
export default function EditPresetPage() {
  const params = useParams();
  const presetId = params.id as string;
  const { presetQuery } = usePresets({ presetId, enabled: true });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {presetQuery.isLoading ? (
          <PresetEditorSkeleton />
        ) : (
          <PresetEditor
            presetId={presetId}
            preset={presetQuery.data}
            mode={PresetEditorMode.EDIT}
          />
        )}
      </div>
    </div>
  );
}
