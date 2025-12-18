import { create } from "zustand";

export interface ActiveProductBatch {
  batchId: string;
  brandId: string;
  brandName: string;
  startedAt: string;
}

interface ProductBatchStore {
  activeBatches: ActiveProductBatch[];
  addBatch: (batch: ActiveProductBatch) => void;
  removeBatch: (batchId: string) => void;
  clearBatches: () => void;
}

export const useProductBatchStore = create<ProductBatchStore>((set) => ({
  activeBatches: [],
  
  addBatch: (batch) =>
    set((state) => ({
      activeBatches: [...state.activeBatches, batch],
    })),
  
  removeBatch: (batchId) =>
    set((state) => ({
      activeBatches: state.activeBatches.filter((b) => b.batchId !== batchId),
    })),
  
  clearBatches: () =>
    set(() => ({
      activeBatches: [],
    })),
}));
