import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TradeUpContract,
  SkinPrice,
  Alert,
  AlertConfig,
  DashboardStats,
  UserSettings,
  ScanResult,
} from "@/lib/types";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// ---- Contracts ----

export function useContracts(params?: {
  rarity?: string;
  min_roi?: number;
  max_cost?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.rarity && params.rarity !== "all") sp.set("rarity", params.rarity);
  if (params?.min_roi) sp.set("min_roi", params.min_roi.toString());
  if (params?.max_cost) sp.set("max_cost", params.max_cost.toString());
  const qs = sp.toString();

  return useQuery<TradeUpContract[]>({
    queryKey: ["contracts", qs],
    queryFn: () => fetcher(`/api/contracts${qs ? `?${qs}` : ""}`),
  });
}

export function useContract(id: string) {
  return useQuery<TradeUpContract>({
    queryKey: ["contract", id],
    queryFn: () => fetcher(`/api/contracts/${id}`),
    enabled: !!id,
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/contracts/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

// ---- Skins ----

export function useSkins(params?: {
  rarity?: string;
  collection?: string;
  search?: string;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.rarity) sp.set("rarity", params.rarity);
  if (params?.collection) sp.set("collection", params.collection);
  if (params?.search) sp.set("search", params.search);
  if (params?.limit) sp.set("limit", params.limit.toString());
  const qs = sp.toString();

  return useQuery<SkinPrice[]>({
    queryKey: ["skins", qs],
    queryFn: () => fetcher(`/api/skins${qs ? `?${qs}` : ""}`),
  });
}

// ---- Alerts ----

export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => fetcher("/api/alerts"),
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch("/api/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch("/api/alerts/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

// ---- Alert Configs ----

export function useAlertConfigs() {
  return useQuery<AlertConfig[]>({
    queryKey: ["alert-configs"],
    queryFn: () => fetcher("/api/alert-configs"),
  });
}

export function useToggleAlertConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/alert-configs/${id}`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-configs"] }),
  });
}

// ---- Settings ----

export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: () => fetcher("/api/settings"),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save settings");
      }

      return res.json() as Promise<UserSettings>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// ---- Scanner ----

export function useRunScan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: { rarity?: string; minROI?: number; maxCost?: number }) => {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Scan failed");
      }

      return data as ScanResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["skins"] });
    },
  });
}

export function useIngestSkins() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: { pages?: number }) => {
      const res = await fetch("/api/skins/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to refresh market data");
      }

      return data as { fetched: number; parsed: number; saved: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skins"] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

// ---- Stats ----

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: () => fetcher("/api/stats"),
  });
}
