import { GalleryActions } from "@/hooks/useGallery";
import { ConceptVisualTabs } from "@/types/concept-visual-editor.types";
import { GalleryItemResponse } from "@/types/gallery.types";
import { create } from "zustand";

type ConceptVisualSource = "blanket" | "concept-visual-media" | "media-gallery";
type OpenConceptVisualArguments = {
  source: ConceptVisualSource;
  assetItems: GalleryItemResponse[];
  asset: {
    galleryActions: GalleryActions | null;
    currentAsset: GalleryItemResponse;
  } | null;
  defaultActiveTab?: ConceptVisualTabs;
};

type Store = {
  source: ConceptVisualSource;

  isConceptVisualOpened: boolean;
  openConceptVisual: ({
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

  defaultActiveTab: ConceptVisualTabs | null;
};

export const useConceptVisualStore = create<Store>((set) => ({
  source: "blanket",
  isConceptVisualOpened: false,
  openConceptVisual: ({ source, assetItems, asset, defaultActiveTab }) =>
    set({
      isConceptVisualOpened: true,
      source,
      assetItems,
      galleryActions: asset?.galleryActions,
      currentAsset: asset?.currentAsset,
      defaultActiveTab: defaultActiveTab || null,
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
  defaultActiveTab: null,
}));
