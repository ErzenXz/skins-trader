"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardStats } from "@/components/dashboard/stats";
import { OpportunityFeed } from "@/components/dashboard/opportunity-feed";
import { EVHistoryChart, ROIDistributionChart, RiskBreakdownChart } from "@/components/dashboard/charts";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { TopOpportunities } from "@/components/dashboard/top-opportunities";
import { useContracts } from "@/lib/queries";

export default function DashboardPage() {
  const { data: contracts = [] } = useContracts();
  const profitable = contracts.filter((c) => c.profit > 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of profitable CS2 trade-up contracts.
          </p>
        </div>

        <DashboardStats />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <EVHistoryChart contracts={contracts} />
              <ROIDistributionChart contracts={contracts} />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold">
                Profitable Contracts
              </h2>
              <OpportunityFeed contracts={profitable} limit={6} />
            </div>
          </div>

          <div className="space-y-4">
            <TopOpportunities />
            <AlertsFeed />
            <RiskBreakdownChart contracts={contracts} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
