"use client";

import { AppShell } from "@/components/app-shell";
import { OpportunityFeed } from "@/components/dashboard/opportunity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/lib/queries";

export default function OpportunitiesPage() {
  const { data: contracts = [], isLoading } = useContracts();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            All discovered trade-up contracts, sorted by profitability.
          </p>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <OpportunityFeed contracts={contracts} showFilters />
        )}
      </div>
    </AppShell>
  );
}
