"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PresetEditor } from "../_components/PresetEditor";
import { PresetEditorMode } from "@/types/preset.types";
import { usePresets } from "@/hooks/usePresets";
import { PresetEditorSkeleton } from "../_components/PresetEditorSkeleton";
import { useUserStore } from "@/store/user.store";
import { UserRoleId } from "@/types/user.types";

export const dynamic = "force-dynamic";

export default function NewPresetPage() {
  const searchParams = useSearchParams();
  const toClone = searchParams.get("to_clone") ?? undefined;
  const { user } = useUserStore();

  // If `to_clone` param is present, fetch only that preset to use as the
  // source for cloning; otherwise, fetch the master preset for the new
  // preset initial data. This avoids unnecessary requests.
  const { presetQuery } = usePresets({ presetId: toClone, enabled: !!toClone });
  const { masterPresetQuery } = usePresets({ enabled: !toClone });
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect KK_CREATIVE_USER - they have view-only access to presets
  useEffect(() => {
    if (user?.role.id === UserRoleId.KK_CREATIVE_USER) {
      router.push("/presets");
    }
  }, [user, router]);

  // Redirect if the clone id is invalid to avoid showing an empty editor
  useEffect(() => {
    if (
      toClone &&
      (presetQuery.isError || (!presetQuery.isLoading && !presetQuery.data))
    ) {
      router.push("/presets");
    }
  }, [
    toClone,
    presetQuery.isError,
    presetQuery.isLoading,
    presetQuery.data,
    router,
  ]);

  if (!mounted) {
    return null;
  }

  // Don't show the editor to view-only users
  if (user?.role.id === UserRoleId.KK_CREATIVE_USER) {
    return null;
  }

  // Show a loader while the preset-to-clone is being fetched so the editor
  // can initialize the new preset with the clone data.
  if (toClone && presetQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <PresetEditorSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <PresetEditor
          mode={toClone ? PresetEditorMode.CLONE : PresetEditorMode.NEW}
          preset={toClone ? presetQuery.data : masterPresetQuery.data}
        />
      </div>
    </div>
  );
}
