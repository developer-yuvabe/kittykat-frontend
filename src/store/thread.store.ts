import { create } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  chatOnlyMode: boolean;
  setChatOnlyMode: (mode: boolean) => void;
};

export const useThreadStore = create<Store>()(
  persist(
    (set) => ({
      chatOnlyMode: false,
      setChatOnlyMode: (mode) => set({ chatOnlyMode: mode }),
    }),
    {
      name: "chat-only-mode",
    }
  )
);
