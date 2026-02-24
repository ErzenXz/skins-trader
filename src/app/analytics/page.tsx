"use client";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EVHistoryChart,
  ROIDistributionChart,
  RiskBreakdownChart,
  CollectionHeatmap,
} from "@/components/dashboard/charts";
import { useContracts, useSkins } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: skins = [], isLoading: skinsLoading } = useSkins({ limit: 50 });

  const totalProfit = contracts.reduce((s, c) => s + c.profit, 0);
  const profRate = contracts.length > 0
    ? (contracts.filter((c) => c.profit > 0).length / contracts.length) * 100
    : 0;
  const avgROI = contracts.length > 0
    ? (contracts.reduce((s, c) => s + c.roi, 0) / contracts.length) * 100
    : 0;

  const isLoading = contractsLoading || skinsLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights into market trends and scanner performance.
          </p>
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Profit Potential</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-emerald-600">
                ${totalProfit.toFixed(2)}
              </p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Profitable Rate</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{profRate.toFixed(0)}%</p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Average ROI</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{avgROI.toFixed(0)}%</p>
            )}
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <EVHistoryChart contracts={contracts} />
          <ROIDistributionChart contracts={contracts} />
          <CollectionHeatmap contracts={contracts} />
          <RiskBreakdownChart contracts={contracts} />
        </div>

        {/* Top skins table */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Top Skins by Price</h3>
          {skinsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : skins.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No skin data available. Import skins to see analytics.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Skin</th>
                    <th className="pb-2 font-medium">Rarity</th>
                    <th className="pb-2 text-right font-medium">Price</th>
                    <th className="pb-2 text-right font-medium">Volume</th>
                    <th className="pb-2 text-right font-medium">24h</th>
                  </tr>
                </thead>
                <tbody>
                  {skins.slice(0, 10).map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-[9px]">
                          {s.rarity}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-mono">${s.price.toFixed(2)}</td>
                      <td className="py-2 text-right text-muted-foreground">{s.volume}</td>
                      <td className={cn("py-2 text-right font-mono", s.price_trend > 0 ? "text-emerald-600" : "text-red-500")}>
                        {s.price_trend > 0 ? "+" : ""}{s.price_trend.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
