import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { produce } from "immer";
import { User } from "@/types/types";

type Store = {
  user: User | null;
  lastInteractedBrandId: string | null;
  setUser: (user: User | null) => void;
  setLastInteractedBrandId: (brandId: string) => void;
  getLastInteractedBrandId: () => string | null;
};

export const useUserStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      lastInteractedBrandId: null,

      setUser: (user) => set({ user }),

      setLastInteractedBrandId: (brandId) =>
        set(
          produce((state) => {
            state.lastInteractedBrandId = brandId;
          })
        ),

      getLastInteractedBrandId: () => get().lastInteractedBrandId,
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
