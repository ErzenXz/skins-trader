"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/lib/queries";
import { ArrowRight } from "lucide-react";

export function TopOpportunities() {
  const { data: contracts, isLoading } = useContracts();

  const top = (contracts || [])
    .filter((c) => c.profit > 0)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  return (
    <Card>
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Top 5 by ROI</h3>
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-xs text-muted-foreground">
            No profitable contracts yet. Run a scan to find opportunities.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {top.map((c, i) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
            >
              <span className="w-5 text-xs font-medium text-muted-foreground">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs">
                  <span>{c.input_rarity}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span>{c.output_rarity}</span>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {c.outputs[0]?.skin.name || "Unknown"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-emerald-600">
                  +{(c.roi * 100).toFixed(0)}%
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  ${c.profit.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
