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
};

export const useBrandStore = create<Store>((set) => ({
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
}));
