import { create } from "zustand";
import { UserBrand } from "@/types/user.types";

type Store = {
  isBrandsFetched: boolean;
  setIsBrandsFetched: (isFetched: boolean) => void;

  brands: UserBrand[];
  setBrands: (brands: UserBrand[]) => void;
  addBrand: (brand: UserBrand) => void;
  removeBrand: (brandId: string) => void;

  selectedBrandId: string | null;
  setSelectedBrandId: (brand: string | null) => void;

  isCreatingBrand: boolean;
  setIsCreatingBrand: (isCreating: boolean) => void;

  isCampaignCreating: boolean;
  setIsCampaignCreating: (isCreating: boolean) => void;

  // Campaign-level moodboard selection - maps campaignId to selectedMoodboardId
  campaignMoodboardSelections: Record<string, string | null>;
  setCampaignMoodboardSelection: (
    campaignId: string,
    moodboardId: string | null
  ) => void;
  getCampaignMoodboardSelection: (campaignId: string) => string | null;

  selectedMoodboardId: string | null;
  setSelectedMoodboardId: (moodboardId: string | null) => void;

  isMoodboardSaving: boolean;
  setIsMoodboardSaving: (isSaving: boolean) => void;
};

export const useBrandStore = create<Store>((set, get) => ({
  isBrandsFetched: false,
  setIsBrandsFetched: (isFetched: boolean) =>
    set({ isBrandsFetched: isFetched }),

  brands: [],
  setBrands: (brands: UserBrand[]) => set({ brands }),
  addBrand: (brand: UserBrand) =>
    set((state) => ({ brands: [...state.brands, brand] })),
  removeBrand: (brandId: string) =>
    set((state) => ({
      brands: state.brands.filter((brand) => brand.id !== brandId),
    })),

  selectedBrandId: null,
  setSelectedBrandId: (brand: string | null) => set({ selectedBrandId: brand }),

  isCreatingBrand: false,
  setIsCreatingBrand: (isCreating: boolean) =>
    set({ isCreatingBrand: isCreating }),

  isCampaignCreating: false,
  setIsCampaignCreating: (isCreating: boolean) =>
    set({ isCampaignCreating: isCreating }),

  campaignMoodboardSelections: {},
  setCampaignMoodboardSelection: (
    campaignId: string,
    moodboardId: string | null
  ) =>
    set((state) => ({
      campaignMoodboardSelections: {
        ...state.campaignMoodboardSelections,
        [campaignId]: moodboardId,
      },
    })),
  getCampaignMoodboardSelection: (campaignId: string) => {
    const state = get();
    return state.campaignMoodboardSelections[campaignId] || null;
  },

  selectedMoodboardId: null,
  setSelectedMoodboardId: (moodboardId: string | null) =>
    set({ selectedMoodboardId: moodboardId }),

  isMoodboardSaving: false,
  setIsMoodboardSaving: (isSaving: boolean) =>
    set({ isMoodboardSaving: isSaving }),
}));
