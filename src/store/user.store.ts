import { create } from "zustand";
import { User } from "@/types/user.types";

export type UserWithoutBrandAccess = Omit<User, "brand_access">;

type Store = {
  user: UserWithoutBrandAccess | null;
  setUser: (user: UserWithoutBrandAccess | null) => void;

  // credits: historically used by UI to represent token counts
  credits: number | null;
  setCredits: (credits: number) => void;

  // (No explicit tokens field) `credits` is used for both user credits and team tokens

  kittykatExpertCredits: number | null;
  setKittykatExpertCredits: (credits: number | null) => void;

  isSwitchingTeam: boolean;
  setIsSwitchingTeam: (isSwitching: boolean) => void;
};

export const useUserStore = create<Store>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  credits: null,
  setCredits: (credits) => set({ credits }),

  kittykatExpertCredits: null,
  setKittykatExpertCredits: (credits) =>
    set({ kittykatExpertCredits: credits }),

  isSwitchingTeam: false,
  setIsSwitchingTeam: (isSwitching) => set({ isSwitchingTeam: isSwitching }),
}));
