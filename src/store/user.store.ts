import { create } from "zustand";
import { User } from "@/types/user.types";

type UserWithoutBrandAccess = Omit<User, "brand_access">;

type Store = {
  user: UserWithoutBrandAccess | null;
  setUser: (user: UserWithoutBrandAccess | null) => void;
};

export const useUserStore = create<Store>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
