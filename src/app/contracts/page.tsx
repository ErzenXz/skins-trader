"use client";

import { AppShell } from "@/components/app-shell";
import { OpportunityFeed } from "@/components/dashboard/opportunity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContractsPage() {
  const { data: contracts = [], isLoading } = useContracts();
  const profitable = contracts.filter((c) => c.profit > 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Trade-Up Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Browse all calculated contracts.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="profitable">
            <TabsList>
              <TabsTrigger value="profitable" className="text-xs">
                Profitable ({profitable.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All ({contracts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profitable" className="mt-4">
              <OpportunityFeed contracts={profitable} showFilters />
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <OpportunityFeed contracts={contracts} showFilters />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
