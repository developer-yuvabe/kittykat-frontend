import { PromptMode, VideoPreset } from "@/types/a2i-video.types";
import { create } from "zustand";

type ConceptMode = "image_generator" | "image_editor" | "video_generator";

type OtherFrames = {
  type: "start" | "end";
  url: string;
  zone: "first" | "last";
};

type Store = {
  referencePrompt: string | null;
  setReferencePrompt: (prompt: string | null) => void;
  referencePromptSignal: number;
  clearReferencePrompt: () => void;
  isGeneratingPrompts: boolean;
  setIsGeneratingPrompts: (isGenerating: boolean) => void;
  baseImageUrl: string | null;
  setBaseImageUrl: (url: string | null) => void;
  conceptVisualGeneratorMode: ConceptMode;
  setConceptVisualGeneratorMode: (mode: ConceptMode) => void;
  startFrame: string | null;
  endFrame: string | null;
  setStartFrame: (value: string | null) => void;
  setEndFrame: (value: string | null) => void;

  shoudlClearPromptOnMetdaDataActions: boolean;
  setShouldClearPromptOnMetadataActions: (value: boolean) => void;

  otherFrames: OtherFrames[];
  addOtherFrame: (frame: OtherFrames) => void;
  removeOtherFrame: (zone: "first" | "last") => void;
  clearOtherFrames: () => void;

  preset: VideoPreset | null;
  setPreset: (preset: VideoPreset | null) => void;

  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;

  needsRebuild: boolean;
  setNeedsRebuild: (value: boolean) => void;
};

export const useA2iStore = create<Store>()((set) => {
  return {
    referencePrompt: null,
    setReferencePrompt: (prompt) =>
      set({ referencePrompt: prompt, referencePromptSignal: Date.now() }),
    referencePromptSignal: 0,
    clearReferencePrompt: () => set({ referencePrompt: null }),
    isGeneratingPrompts: false,
    setIsGeneratingPrompts: (isGenerating) =>
      set({ isGeneratingPrompts: isGenerating }),
    baseImageUrl: null,
    setBaseImageUrl: (url) => set({ baseImageUrl: url }),
    conceptVisualGeneratorMode: "image_generator",

    setConceptVisualGeneratorMode: (mode) =>
      set({ conceptVisualGeneratorMode: mode }),
    startFrame: null,
    endFrame: null,

    setStartFrame: (value) => set({ startFrame: value, needsRebuild: true }),
    setEndFrame: (value) => set({ endFrame: value, needsRebuild: true }),

    otherFrames: [],
    addOtherFrame: (frame) =>
      set((state) => ({
        otherFrames: [
          // remove only matching zone + type pair
          ...state.otherFrames.filter(
            (f) => !(f.zone === frame.zone && f.type === frame.type)
          ),
          frame,
        ],
      })),
    removeOtherFrame: (zone) =>
      set((state) => ({
        otherFrames: state.otherFrames.filter((f) => f.zone !== zone),
      })),
    clearOtherFrames: () => set({ otherFrames: [] }),

    shoudlClearPromptOnMetdaDataActions: false,
    setShouldClearPromptOnMetadataActions: (value) =>
      set({ shoudlClearPromptOnMetdaDataActions: value }),

    preset: null,
    setPreset: (preset) =>
      set({
        preset,
        needsRebuild: true,
      }),

    promptMode: "manual",
    setPromptMode: (mode) =>
      set({
        promptMode: mode,
      }),

    needsRebuild: false,
    setNeedsRebuild: (value) => set({ needsRebuild: value }),
  };
});
