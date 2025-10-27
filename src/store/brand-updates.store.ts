import { ThreadDetails } from "@/types/types";
import { create } from "zustand";

type Store = {
  data: ThreadDetails | null;
  isFetchingBrandInfo: boolean;

  setData: (data: ThreadDetails | null) => void;
  setIsFetchingBrandInfo: (isFetching: boolean) => void;
};

export const useBrandUpdatesStore = create<Store>((set) => ({
  data: null,
  isFetchingBrandInfo: false,

  setData: (data: ThreadDetails | null) => set({ data }),
  setIsFetchingBrandInfo: (isFetching: boolean) =>
    set({ isFetchingBrandInfo: isFetching }),
}));
