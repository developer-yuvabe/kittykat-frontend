import { create } from "zustand";
import { User } from "@/types/user.types";

export type UserWithoutBrandAccess = Omit<User, "brand_access">;

type Store = {
  user: UserWithoutBrandAccess | null;
  setUser: (user: UserWithoutBrandAccess | null) => void;

  credits: number | null;
  setCredits: (credits: number) => void;

  kittykatExpertCredits: number | null;
  setKittykatExpertCredits: (credits: number) => void;
};

export const useUserStore = create<Store>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  credits: null,
  setCredits: (credits) => set({ credits }),

  kittykatExpertCredits: null,
  setKittykatExpertCredits: (credits) =>
    set({ kittykatExpertCredits: credits }),
}));
