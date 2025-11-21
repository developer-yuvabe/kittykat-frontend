import { create } from "zustand";
import { UserBrand } from "@/types/user.types";
import { MoodboardInformation } from "@/types/types";

type Store = {
  isBrandsFetched: boolean;
  setIsBrandsFetched: (isFetched: boolean) => void;

  brands: UserBrand[];
  setBrands: (brands: UserBrand[]) => void;
  addBrand: (brand: UserBrand) => void;
  addCampaignToBrand: (
    brandId: string,
    campaign: UserBrand["campaigns"][0]
  ) => void;
  removeBrand: (brandId: string) => void;

  campaigns: UserBrand["campaigns"];
  setCampaigns: (campaigns: UserBrand["campaigns"]) => void;

  moodboards: MoodboardInformation[];
  setMoodboards: (moodboards: MoodboardInformation[]) => void;

  selectedBrandId: string | null;
  setSelectedBrandId: (brand: string | null, validate?: boolean) => void;

  selectedCampaignId: string | null;
  setSelectedCampaignId: (campaignId: string | null) => void;

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

  // Get a detailed brand information
  getSelectedBrand: () => UserBrand | null;

  // Getters for selected names
  getSelectedBrandName: () => string | null;
  getSelectedCampaignName: () => string | null;
  getSelectedMoodboardName: () => string | null;

  // This is to remember the last selected brand when user tries to create a new brand and then cancels it
  previousSelectedBrandId: string | null;
  setPreviousSelectedBrandId: (brandId: string | null) => void;
  removeCampaign: (brandId: string, campaignId: string) => void;
  // Default campaign id (fallback) for the currently selected brand - last non-custom campaign
  defaultCampaignId: string | null;
  setDefaultCampaignId: (campaignId: string | null) => void;
  getDefaultCampaignId: () => string | null;
};

export const useBrandStore = create<Store>((set, get) => ({
  isBrandsFetched: false,
  setIsBrandsFetched: (isFetched: boolean) =>
    set({ isBrandsFetched: isFetched }),

  brands: [],
  setBrands: (brands: UserBrand[]) => {
    const campaigns = brands.flatMap((brand) => brand.campaigns || []);
    set((state) => {
      let defaultCampaignId = state.defaultCampaignId;
      if (state.selectedBrandId) {
        const selectedBrand = brands.find((b) => b.id === state.selectedBrandId);
        if (selectedBrand) {
          defaultCampaignId = [...(selectedBrand.campaigns || [])]
            .reverse()
            .find((c) => !c.is_custom)?.id ?? null;
        } else {
          defaultCampaignId = null;
        }
      }

      return { brands, campaigns, defaultCampaignId };
    });
  },
  addBrand: (brand: UserBrand) =>
    set((state) => ({ brands: [...state.brands, brand] })),
  addCampaignToBrand: (brandId: string, campaign: UserBrand["campaigns"][0]) =>
    set((state) => {
      // If this campaign is being added to the currently selected brand, recompute fallback
      let defaultCampaignId = state.defaultCampaignId;
      if (brandId === state.selectedBrandId) {
        if (!campaign.is_custom) {
          // newest non-custom campaign becomes last non-custom
          defaultCampaignId = campaign.id;
        } else {
          // if the added campaign is custom, don't change the default
          defaultCampaignId = state.defaultCampaignId;
        }
      }

      return {
      brands: state.brands.map((brand) =>
        brand.id === brandId
          ? { ...brand, campaigns: [...(brand.campaigns || []), campaign] }
          : brand
      ),
      campaigns: [...state.campaigns, campaign],
      defaultCampaignId,
    };
    }),
  removeBrand: (brandId: string) =>
    set((state) => {
      const brandToRemove = state.brands.find((b) => b.id === brandId);

      // Filter out campaigns belonging to this brand
      const updatedCampaigns = state.campaigns.filter(
        (campaign) =>
          !brandToRemove?.campaigns.some((c) => c.id === campaign.id)
      );

      return {
        brands: state.brands.filter((brand) => brand.id !== brandId),
        campaigns: updatedCampaigns,
        // Clear selections if deleted brand was selected
        selectedBrandId:
          state.selectedBrandId === brandId ? null : state.selectedBrandId,
        selectedCampaignId:
          state.selectedBrandId === brandId ? null : state.selectedCampaignId,
        // Clear default campaign if the selected brand was removed
        defaultCampaignId:
          state.selectedBrandId === brandId ? null : state.defaultCampaignId,
      };
    }),

  removeCampaign: (brandId: string, campaignId: string) => {
    set((state) => {
      const updatedBrands = state.brands.map((brand) => {
        if (brand.id === brandId) {
          return {
            ...brand,
            campaigns: brand.campaigns.filter((c) => c.id !== campaignId),
          };
        }
        return brand;
      });

      const selectedBrand = updatedBrands.find(
        (b) => b.id === state.selectedBrandId
      );
      const remainingCampaigns = selectedBrand?.campaigns || [];

      // Compute new default based on remaining campaigns for selected brand
      const newDefaultCampaignId = remainingCampaigns
        .slice()
        .reverse()
        .find((c) => !c.is_custom)?.id ?? null;

      // Return new state with cleared selection if no campaigns**
      if (remainingCampaigns.length === 0) {
        return {
          ...state,
          brands: updatedBrands,
          campaigns: [],
          selectedCampaignId: null, // Clear immediately
          defaultCampaignId: newDefaultCampaignId,
        };
      }

      return {
        ...state,
        brands: updatedBrands,
        campaigns: remainingCampaigns,
        defaultCampaignId:
          state.selectedBrandId === brandId ? newDefaultCampaignId : state.defaultCampaignId,
      };
    });
  },

  campaigns: [],
  setCampaigns: (campaigns: UserBrand["campaigns"]) =>
    set((state) => {
      // Only compute default for the selected brand (setCampaigns frequently sets campaigns for the active brand)
      let defaultCampaignId = state.defaultCampaignId;
      if (state.selectedBrandId) {
        const lastNonCustom = [...campaigns].reverse().find((c) => !c.is_custom);
        defaultCampaignId = lastNonCustom ? lastNonCustom.id : null;
      }

      return { campaigns, defaultCampaignId };
    }),

  moodboards: [],
  setMoodboards: (moodboards: MoodboardInformation[]) => set({ moodboards }),

  selectedBrandId: null,
  setSelectedBrandId: (brandId: string | null, validate?: boolean) =>
    set((state) => {
      if (validate && brandId) {
        const brandExists = state.brands.some((brand) => brand.id === brandId);
        if (!brandExists) {
          brandId = null; // Reset to null if brand doesn't exist because I don't want to have an invalid brand selected :)
        }
      }

      // Reset campaign selection when brand changes
      const isBrandChanging = state.selectedBrandId !== brandId;

      // compute defaultCampaignId for the newly selected brand
      let defaultCampaignId = state.defaultCampaignId;
      if (brandId) {
        const brand = state.brands.find((b) => b.id === brandId);
        if (brand) {
          // last campaign that is not custom (not is_custom)
          const lastNonCustom = [...(brand.campaigns || [])]
            .reverse()
            .find((c) => !c.is_custom);
          defaultCampaignId = lastNonCustom ? lastNonCustom.id : null;
        } else {
          defaultCampaignId = null;
        }
      } else {
        defaultCampaignId = null;
      }

      return {
        selectedBrandId: brandId,
        // Clear campaign selection when switching brands
        selectedCampaignId: isBrandChanging ? null : state.selectedCampaignId,
        defaultCampaignId,
      };
    }),

  selectedCampaignId: null,
  setSelectedCampaignId: (campaignId: string | null) =>
    set({ selectedCampaignId: campaignId }),

  isCreatingBrand: false,
  setIsCreatingBrand: (isCreating: boolean) =>
    set((state) => {
      return {
        isCreatingBrand: isCreating,
        previousSelectedBrandId: state.selectedBrandId,
      };
    }),

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
    set((state) => {
      // If moodboardId is provided, find the campaign it belongs to and select it
      if (moodboardId) {
        const moodboard = state.moodboards.find((mb) => mb.id === moodboardId);
        if (moodboard) {
          return {
            selectedMoodboardId: moodboardId,
            selectedCampaignId: moodboard.campaign_id,
          };
        }
      }
      return { selectedMoodboardId: moodboardId };
    }),

  isMoodboardSaving: false,
  setIsMoodboardSaving: (isSaving: boolean) =>
    set({ isMoodboardSaving: isSaving }),

  getSelectedBrand: () => {
    const state = get();
    return state.brands.find((b) => b.id == state.selectedBrandId) ?? null;
  },

  // Getters for selected names
  getSelectedBrandName: () => {
    const state = get();
    const selectedBrand = state.brands.find(
      (brand) => brand.id === state.selectedBrandId
    );
    return selectedBrand?.name || null;
  },

  getSelectedCampaignName: () => {
    const state = get();
    if (!state.selectedCampaignId || !state.campaigns) return null;
    const selectedCampaign = state.campaigns.find(
      (campaign) => campaign.id === state.selectedCampaignId
    );
    return selectedCampaign?.title || null;
  },

  getSelectedMoodboardName: () => {
    const state = get();
    if (!state.selectedMoodboardId || !state.moodboards) return null;
    const selectedMoodboard = state.moodboards.find(
      (moodboard) => moodboard.id === state.selectedMoodboardId
    );
    return selectedMoodboard?.title || null;
  },

  previousSelectedBrandId: null,
  setPreviousSelectedBrandId: (brandId: string | null) =>
    set({ previousSelectedBrandId: brandId }),
  // Default campaign id computed for the selected brand
  defaultCampaignId: null,
  setDefaultCampaignId: (campaignId: string | null) => set({ defaultCampaignId: campaignId }),
  getDefaultCampaignId: () => {
    const state = get();
    return state.defaultCampaignId ?? null;
  },
}));
