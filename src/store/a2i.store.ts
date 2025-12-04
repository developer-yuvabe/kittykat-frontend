import { create } from "zustand";

type ConceptMode = "image_generator" | "image_editor" | "video_generator";

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

    setStartFrame: (value) => set({ startFrame: value }),
    setEndFrame: (value) => set({ endFrame: value }),
  };
});
