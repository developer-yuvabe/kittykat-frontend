import { create } from "zustand";

type MetadataActionsParameters = {
  imageGeneationParameters: Record<string, any> | null;
  remixParameters: Record<string, any> | null;
  vtonParameters: Record<string, any> | null;
  videoParameters: Record<string, any> | null;
  upscaleParameters: Record<string, any> | null;
  referenceImage: string | null;
  productReferenceImages: string[] | null;
};

type Store = {
  parameters: MetadataActionsParameters;
  setParameters: <K extends keyof MetadataActionsParameters>(
    key: K,
    params: MetadataActionsParameters[K]
  ) => void;
};

export const useMetadataActionsStore = create<Store>((set) => ({
  parameters: {
    imageGeneationParameters: null,
    remixParameters: null,
    vtonParameters: null,
    videoParameters: null,
    upscaleParameters: null,
    referenceImage: null,
    productReferenceImages: null,
  },

  setParameters: (key, params) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        [key]: params,
      },
    })),
}));
