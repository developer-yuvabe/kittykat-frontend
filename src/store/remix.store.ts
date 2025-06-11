import { create } from "zustand";

type Store = {
  remixUrl: string | null;
  setRemixUrl: (remixUrl: string | null) => void;

  remixSize: string | null;
  setRemixSize: (remixSize: string | null) => void;
};

export const useRemixStore = create<Store>()((set) => ({
  remixUrl: null,
  setRemixUrl: (remixUrl: string | null) => set({ remixUrl: remixUrl }),

  remixSize: null,
  setRemixSize: (remixSize: string | null) => set({ remixSize: remixSize }),
}));
