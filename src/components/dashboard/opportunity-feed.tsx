"use client";

import { useAppStore } from "@/lib/store";
import { ContractCard } from "./contract-card";
import type { TradeUpContract } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OpportunityFeed({
  contracts = [],
  showFilters = true,
  limit,
}: {
  contracts?: TradeUpContract[];
  showFilters?: boolean;
  limit?: number;
}) {
  const { filters, setFilter } = useAppStore();

  let filtered = [...contracts];

  if (filters.rarity !== "all") {
    filtered = filtered.filter((c) => c.input_rarity === filters.rarity);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.collections.some((col) => col.toLowerCase().includes(q)) ||
        c.inputs.some((i) => i.name.toLowerCase().includes(q)) ||
        c.outputs.some((o) => o.skin.name.toLowerCase().includes(q))
    );
  }

  filtered.sort((a, b) => {
    const dir = filters.sort_order === "desc" ? -1 : 1;
    switch (filters.sort_by) {
      case "roi":
        return (a.roi - b.roi) * dir;
      case "profit":
        return (a.profit - b.profit) * dir;
      case "confidence":
        return (a.confidence - b.confidence) * dir;
      case "cost":
        return (a.input_cost - b.input_cost) * dir;
      default:
        return 0;
    }
  });

  if (limit) filtered = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.rarity}
            onValueChange={(v) =>
              setFilter("rarity", v as typeof filters.rarity)
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="Mil-Spec">Mil-Spec</SelectItem>
              <SelectItem value="Restricted">Restricted</SelectItem>
              <SelectItem value="Classified">Classified</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sort_by}
            onValueChange={(v) =>
              setFilter("sort_by", v as typeof filters.sort_by)
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">Highest ROI</SelectItem>
              <SelectItem value="profit">Highest Profit</SelectItem>
              <SelectItem value="confidence">Confidence</SelectItem>
              <SelectItem value="cost">Lowest Cost</SelectItem>
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} results
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No contracts found. Run a scan to discover trade-ups.
          </p>
        </div>
      )}
    </div>
  );
}
