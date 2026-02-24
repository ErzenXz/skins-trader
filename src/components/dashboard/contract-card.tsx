"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TradeUpContract } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return n < 1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`;
}

export function ContractCard({ contract }: { contract: TradeUpContract }) {
  const profitable = contract.profit > 0;

  return (
    <Link href={`/contracts/${contract.id}`}>
      <Card className="group p-4 transition-shadow hover:shadow-md">
        {/* Rarity flow */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {contract.input_rarity}
          </span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium text-foreground">
            {contract.output_rarity}
          </span>
          <span className="ml-auto text-[11px]">
            {contract.collections[0]?.replace("The ", "").replace(" Collection", "").replace(" Case", "")}
          </span>
        </div>

        {/* Key numbers */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Cost</p>
            <p className="font-mono text-sm font-semibold">
              {fmt(contract.input_cost)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">EV</p>
            <p className="font-mono text-sm font-semibold text-primary">
              {fmt(contract.expected_value)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">ROI</p>
            <p
              className={cn(
                "font-mono text-sm font-semibold",
                profitable ? "text-emerald-600" : "text-red-500"
              )}
            >
              {profitable ? "+" : ""}
              {(contract.roi * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Outcomes */}
        <div className="mt-3 space-y-1">
          {contract.outputs.slice(0, 2).map((o, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded bg-muted/60 px-2 py-1"
            >
              <span className="truncate text-xs">{o.skin.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{(o.probability * 100).toFixed(0)}%</span>
                <span className="font-mono font-medium text-foreground">
                  {fmt(o.skin.price)}
                </span>
              </div>
            </div>
          ))}
          {contract.outputs.length > 2 && (
            <p className="text-center text-[11px] text-muted-foreground">
              +{contract.outputs.length - 2} more
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              contract.risk_level === "low" && "text-emerald-600",
              contract.risk_level === "medium" && "text-amber-600",
              contract.risk_level === "high" && "text-red-500"
            )}
          >
            {contract.risk_level} risk
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {contract.confidence}% confidence
          </span>
          <span
            className={cn(
              "ml-auto font-mono text-xs font-semibold",
              profitable ? "text-emerald-600" : "text-red-500"
            )}
          >
            {profitable ? "+" : ""}
            {fmt(contract.profit)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
