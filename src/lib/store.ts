import { create } from "zustand";
import type { FilterState } from "./types";

interface AppStore {
  // Filters
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;

  // Scanner
  isScanning: boolean;
  scanProgress: number;
  startScan: () => void;
  stopScan: () => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const defaultFilters: FilterState = {
  rarity: "all",
  max_cost: 500,
  min_roi: 0,
  collection: "all",
  wear_target: "all",
  sort_by: "roi",
  sort_order: "desc",
  search: "",
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Filters
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),

  // Scanner
  isScanning: false,
  scanProgress: 0,
  startScan: () => {
    set({ isScanning: true, scanProgress: 0 });
    const interval = setInterval(() => {
      const current = get().scanProgress;
      if (current >= 100) {
        clearInterval(interval);
        set({ isScanning: false, scanProgress: 100 });
        return;
      }
      set({ scanProgress: current + Math.random() * 15 });
    }, 400);
  },
  stopScan: () => set({ isScanning: false, scanProgress: 0 }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
