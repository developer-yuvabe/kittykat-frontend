import { create } from "zustand";

type MetadataActionsParameters = {
  imageGeneationParameters: Record<string, any> | null;
  remixParameters: Record<string, any> | null;
  vtonParameters: Record<string, any> | null;
  videoParameters: Record<string, any> | null;
  upscaleParameters: Record<string, any> | null;
};

type Store = {
  parameters: MetadataActionsParameters;
  setParameters: (
    key: keyof MetadataActionsParameters,
    params: Record<string, any> | null
  ) => void;
};

export const useMetadataActionsStore = create<Store>((set) => ({
  parameters: {
    imageGeneationParameters: null,
    remixParameters: null,
    vtonParameters: null,
    videoParameters: null,
    upscaleParameters: null,
  },

  setParameters: (key, params) =>
    set((state) => ({
      parameters: {
        ...state.parameters,
        [key]: params,
      },
    })),
}));
