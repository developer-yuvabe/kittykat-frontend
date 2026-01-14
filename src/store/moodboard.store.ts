import { create } from "zustand";
import { toast } from "sonner";
import { createMoodboard } from "@/services/api/moodboard.service";
import type { SetStateAction } from "react";
import { AppConfig } from "@/config/app.config";

type MoodboardStore = {
  // UI State
  noOfImagesForMoodboard: number;
  setNoOfImagesForMoodboard: (count: number | SetStateAction<number>) => void;

  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean | SetStateAction<boolean>) => void;

  isCreatingNewMoodboard: boolean;
  setIsCreatingNewMoodboard: (isCreating: boolean) => void;

  moodboardTitle: string;
  setMoodboardTitle: (title: string) => void;

  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;

  triggerMoodboardSave: (() => Promise<void>) | null;
  setTriggerMoodboardSave: (handler: (() => Promise<void>) | null) => void;

  // Actions
  resetMoodboardSettings: () => void;
  updateImageCountFromMoodboard: (
    assetCount: number,
    fallbackCount: number
  ) => void;
  generateMoodboardTitle: (
    campaignTitle: string | undefined,
    version: number
  ) => string;

  // Async Actions
  createMoodboardAsync: (
    brandId: string,
    campaignId: string,
    title: string,
    onSuccess?: (moodboardId: string) => void
  ) => Promise<void>;
};

export const useMoodboardStore = create<MoodboardStore>((set) => ({
  // UI State
  noOfImagesForMoodboard: 10,
  setNoOfImagesForMoodboard: (count: number | SetStateAction<number>) => {
    set((state) => ({
      noOfImagesForMoodboard:
        typeof count === "function"
          ? count(state.noOfImagesForMoodboard)
          : count,
    }));
  },

  showAdvancedSettings: false,
  setShowAdvancedSettings: (show: boolean | SetStateAction<boolean>) => {
    set((state) => ({
      showAdvancedSettings:
        typeof show === "function" ? show(state.showAdvancedSettings) : show,
    }));
  },

  isCreatingNewMoodboard: false,
  setIsCreatingNewMoodboard: (isCreating: boolean) =>
    set({ isCreatingNewMoodboard: isCreating }),

  moodboardTitle: "New Moodboard",
  setMoodboardTitle: (title: string) => set({ moodboardTitle: title }),

  expanded: AppConfig.DEFUALT_SECTIONS_EXPANDED_VIEW,
  setExpanded: (expanded: boolean) => set({ expanded }),
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),

  triggerMoodboardSave: null,
  setTriggerMoodboardSave: (handler) => set({ triggerMoodboardSave: handler }),
  // Actions
  resetMoodboardSettings: () =>
    set({
      noOfImagesForMoodboard: 10,
      showAdvancedSettings: false,
    }),

  updateImageCountFromMoodboard: (
    assetCount: number,
    fallbackCount: number
  ) => {
    if (assetCount === 0 && fallbackCount === 0) return;

    let count;
    if (assetCount > 0) {
      count = Math.max(10, assetCount); // ensure at least 10
    } else {
      count = fallbackCount;
    }

    set({ noOfImagesForMoodboard: Math.min(16, count) });
  },

  generateMoodboardTitle: (
    campaignTitle: string | undefined,
    version: number
  ) => {
    return campaignTitle && campaignTitle !== ""
      ? `${campaignTitle}'s Moodboard v${version}`
      : "New Moodboard";
  },

  // Async Actions
  createMoodboardAsync: async (
    brandId: string,
    campaignId: string,
    title: string,
    onSuccess?: (moodboardId: string) => void
  ) => {
    if (!brandId || !campaignId) {
      toast.error("Missing brand or campaign information");
      return;
    }

    const toastId = toast.loading("Creating moodboard...");
    set({ isCreatingNewMoodboard: true });

    try {
      const newMoodboard = await createMoodboard(brandId, campaignId, {
        campaign_id: campaignId,
        title: title,
      });

      if (newMoodboard?.id) {
        toast.success("Moodboard created successfully!", { id: toastId });
        onSuccess?.(newMoodboard.id);
      } else {
        throw new Error("Failed to create moodboard - no ID returned");
      }
    } catch (error) {
      toast.error("Failed to create moodboard. Please try again.", {
        id: toastId,
      });
      console.error("Failed to create moodboard:", error);
    } finally {
      set({ isCreatingNewMoodboard: false });
    }
  },
}));
