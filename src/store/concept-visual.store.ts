import { GalleryActions } from "@/hooks/useGallery";
import { GalleryItemResponse } from "@/types/gallery.types";
import { create } from "zustand";

type ConceptVisualSource = "blanket" | "concept-visual-media" | "media-gallery";
type OpenConceptVisualArguments = {
  source: ConceptVisualSource;
  assetItems: GalleryItemResponse[];
  asset: {
    galleryActions: GalleryActions;
    currentAsset: GalleryItemResponse;
  } | null;
};

type Store = {
  source: ConceptVisualSource;

  isConceptVisualOpened: boolean;
  opneConceptVisual: ({
    source,
    assetItems,
    asset,
  }: OpenConceptVisualArguments) => void;
  closeConceptVisual: () => void;

  currentAsset: GalleryItemResponse | null;
  setCurrentAsset: (item: GalleryItemResponse | null) => void;

  assetItems: GalleryItemResponse[];
  setAssetItems: (items: GalleryItemResponse[]) => void;

  galleryActions: GalleryActions | null;
};

export const useConceptVisualStore = create<Store>((set) => ({
  source: "blanket",
  isConceptVisualOpened: false,
  opneConceptVisual: ({ source, assetItems, asset }) =>
    set({
      isConceptVisualOpened: true,
      source,
      assetItems,
      galleryActions: asset?.galleryActions,
      currentAsset: asset?.currentAsset,
    }),
  closeConceptVisual: () =>
    set({
      isConceptVisualOpened: false,
    }),

  currentAsset: null,
  setCurrentAsset: (a) => set({ currentAsset: a }),

  assetItems: [],
  setAssetItems: (items) => set({ assetItems: items }),

  galleryActions: null,
}));
