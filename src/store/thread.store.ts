import { NextSuggestions } from "@/types/langgraph.types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  chatOnlyMode: boolean;
  setChatOnlyMode: (mode: boolean) => void;

  suggestions: NextSuggestions[];
  previousSuggestions: NextSuggestions[];
  setSuggestions: (suggestions: NextSuggestions[]) => void;
};

export const useThreadStore = create<Store>()(
  persist(
    (set) => ({
      chatOnlyMode: false,
      setChatOnlyMode: (mode) => set({ chatOnlyMode: mode }),

      suggestions: [],
      previousSuggestions: [],
      setSuggestions: (suggestions) =>
        set((state) => ({
          suggestions: suggestions,
          previousSuggestions: [
            ...state.previousSuggestions,
            ...state.suggestions,
          ],
        })),
    }),
    {
      name: "chat-only-mode",
      partialize: (state) => ({
        chatOnlyMode: state.chatOnlyMode,
      }),
    }
  )
);
