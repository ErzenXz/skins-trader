"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/queries";
import { formatDistanceToNow } from "date-fns";

export function DashboardStats() {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Contracts Scanned",
      value: stats.total_scanned.toLocaleString(),
      sub: `Last: ${formatDistanceToNow(new Date(stats.last_scan), { addSuffix: true })}`,
    },
    {
      label: "Profitable",
      value: stats.profitable_count.toString(),
      sub: stats.total_scanned > 0
        ? `${((stats.profitable_count / stats.total_scanned) * 100).toFixed(1)}% of total`
        : "No scans yet",
    },
    {
      label: "Best ROI",
      value: stats.best_roi > 0 ? `${(stats.best_roi * 100).toFixed(0)}%` : "—",
      sub: stats.avg_roi > 0 ? `Average: ${(stats.avg_roi * 100).toFixed(0)}%` : "Run a scan first",
    },
    {
      label: "Profit Potential",
      value: stats.total_potential_profit > 0 ? `$${stats.total_potential_profit.toFixed(2)}` : "$0.00",
      sub: `${stats.active_alerts} active alerts`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {item.value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
        </Card>
      ))}
    </div>
  );
}
