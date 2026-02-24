import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TradeUpContract,
  SkinPrice,
  Alert,
  AlertConfig,
  DashboardStats,
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

// ---- Stats ----

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: () => fetcher("/api/stats"),
  });
}
