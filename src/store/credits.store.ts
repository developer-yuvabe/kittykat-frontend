import { create } from "zustand";

type Store = {
  showInsufficientCreditsModal: boolean;
  setShowInsufficientCreditsModal: (show: boolean) => void;

  showPurchaseCreditsModal: boolean;
  setShowPurchaseCreditsModal: (show: boolean) => void;
};

export const useCreditsStore = create<Store>((set) => ({
  showInsufficientCreditsModal: false,
  setShowInsufficientCreditsModal: (show) =>
    set({ showInsufficientCreditsModal: show }),

  showPurchaseCreditsModal: true,
  setShowPurchaseCreditsModal: (show) =>
    set({ showPurchaseCreditsModal: show }),
}));
