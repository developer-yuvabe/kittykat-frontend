import { User } from "@/types/types";
import { create } from "zustand";

type Store = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useUserStore = create<Store>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
