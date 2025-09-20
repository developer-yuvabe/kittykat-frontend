import { create } from "zustand";

type Store = {
  isConceptVisualOpened: boolean;
  setIsConceptVisualOpened: (isOpened: boolean) => void;
};

export const useConceptVisualStore = create<Store>((set) => ({
  isConceptVisualOpened: false,
  setIsConceptVisualOpened: (isOpened: boolean) =>
    set({ isConceptVisualOpened: isOpened }),
}));
