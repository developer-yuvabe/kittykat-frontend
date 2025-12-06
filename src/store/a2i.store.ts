import { create } from "zustand";

type Store = {
  referencePrompt: string | null;
  setReferencePrompt: (prompt: string | null) => void;
  referencePromptSignal: number;
  clearReferencePrompt: () => void;
  isGeneratingPrompts: boolean;
  setIsGeneratingPrompts: (isGenerating: boolean) => void;
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
  };
});
