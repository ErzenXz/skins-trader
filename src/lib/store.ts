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

let scanTimer: ReturnType<typeof setInterval> | null = null;

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
    if (scanTimer) clearInterval(scanTimer);

    set({ isScanning: true, scanProgress: 0 });

    scanTimer = setInterval(() => {
      const current = get().scanProgress;
      if (current >= 95) return;
      set({ scanProgress: Math.min(95, current + Math.random() * 12) });
    }, 400);
  },
  stopScan: () => {
    if (scanTimer) {
      clearInterval(scanTimer);
      scanTimer = null;
    }
    set({ isScanning: false, scanProgress: 0 });
  },

  // UI
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
