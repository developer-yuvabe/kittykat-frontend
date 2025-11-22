"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePresets } from "@/hooks/usePresets";
import { PresetEditor } from "../_components/PresetEditor";
import { PresetEditorSkeleton } from "../_components/PresetEditorSkeleton";
import { PresetEditorMode } from "@/types/preset.types";
export default function EditPresetPage() {
  const params = useParams();
  const presetId = params.id as string;
  const { presetQuery } = usePresets({ presetId, enabled: true });

  // Redirect to /presets when preset doesn't exist or an error occurred
  const router = useRouter();
  useEffect(() => {
    // If the query has errored or finished without data, route back to the list
    if (presetQuery.isError || (!presetQuery.isLoading && !presetQuery.data)) {
      router.push("/presets");
    }
  }, [presetQuery.isError, presetQuery.isLoading, presetQuery.data, router]);

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
