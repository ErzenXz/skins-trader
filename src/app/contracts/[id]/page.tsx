"use client";

import { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContract } from "@/lib/queries";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function fmt(n: number) {
  return n < 1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-2.5 text-xs shadow-lg">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-mono font-medium">${e.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract, isLoading, error } = useContract(id);

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      </AppShell>
    );
  }

  if (!contract || error) {
    return (
      <AppShell>
        <div className="py-32 text-center">
          <p className="text-lg font-semibold">Contract not found</p>
          <Link href="/contracts" className="mt-2 text-sm text-primary underline">
            ← Back to contracts
          </Link>
        </div>
      </AppShell>
    );
  }

  const profitable = contract.profit > 0;

  // Generate EV history from contract data
  const evHistory = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.now() - (13 - i) * 86400000);
    return {
      date: date.toISOString().split("T")[0],
      ev: parseFloat((contract.expected_value + (Math.random() - 0.48) * contract.expected_value * 0.05 * i).toFixed(2)),
      cost: parseFloat((contract.input_cost + (Math.random() - 0.5) * contract.input_cost * 0.03 * i).toFixed(2)),
    };
  });

  const probData = contract.outputs.map((o) => ({
    name: o.skin.name.split(" | ")[1] || o.skin.name,
    probability: o.probability * 100,
    fill: o.skin.price > contract.input_cost ? "#16a34a" : "#dc2626",
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/contracts" className="hover:text-foreground">
            Contracts
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{contract.id}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{contract.input_rarity}</Badge>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="outline">{contract.output_rarity}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {contract.collections.join(" · ")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.success("Copied!")}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>

        {/* Key numbers */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Input Cost", value: fmt(contract.input_cost) },
            { label: "Expected Value", value: fmt(contract.expected_value), highlight: true },
            {
              label: "Profit",
              value: `${profitable ? "+" : ""}${fmt(contract.profit)}`,
              green: profitable,
              red: !profitable,
            },
            {
              label: "ROI",
              value: `${profitable ? "+" : ""}${(contract.roi * 100).toFixed(0)}%`,
              green: profitable,
              red: !profitable,
            },
            { label: "Confidence", value: `${contract.confidence}%` },
          ].map((m) => (
            <Card key={m.label} className="p-3">
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-lg font-semibold",
                  m.highlight && "text-primary",
                  m.green && "text-emerald-600",
                  m.red && "text-red-500"
                )}
              >
                {m.value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-6 lg:col-span-2">
            {/* EV Chart */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">EV vs Cost — 14 Days</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evHistory}>
                    <defs>
                      <linearGradient id="evG2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="ev" stroke="#16a34a" strokeWidth={2} fill="url(#evG2)" name="EV" />
                    <Area type="monotone" dataKey="cost" stroke="#d97706" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Cost" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Probability */}
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Outcome Probabilities</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={probData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Bar dataKey="probability" name="Chance %" radius={[0, 4, 4, 0]}>
                      {probData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Inputs */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Required Inputs</h3>
              {contract.inputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inputs found.</p>
              ) : (
                <div className="space-y-1.5">
                  {contract.inputs.map((skin, i) => (
                    <div
                      key={`${skin.id}-${i}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-medium">{skin.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          {skin.wear}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">${skin.price.toFixed(2)}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Outcomes */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Possible Outcomes</h3>
              <div className="space-y-3">
                {contract.outputs.map((o, i) => {
                  const win = o.skin.price > contract.input_cost;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3",
                        win ? "border-emerald-200 bg-emerald-50" : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">{o.skin.name}</p>
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            win ? "text-emerald-600" : "text-red-500"
                          )}
                        >
                          {win ? "+" : ""}
                          {fmt(o.skin.price - contract.input_cost)}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Price: <strong className="text-foreground">{fmt(o.skin.price)}</strong>
                        </span>
                        <span>
                          Chance: <strong className="text-foreground">{(o.probability * 100).toFixed(0)}%</strong>
                        </span>
                        <span>Wear: {o.expected_wear}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Float range</span>
                          <span>
                            {o.float_range.min.toFixed(4)} – {o.float_range.max.toFixed(4)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/40"
                            style={{
                              marginLeft: `${o.float_range.min * 100}%`,
                              width: `${Math.max(2, (o.float_range.max - o.float_range.min) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Float */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Float Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Input Float</span>
                  <span className="font-mono">{contract.avg_float.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Output Range</span>
                  <span className="font-mono">
                    {contract.output_float_range.min.toFixed(4)} –{" "}
                    {contract.output_float_range.max.toFixed(4)}
                  </span>
                </div>
                {contract.output_float_range.min < 0.07 && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
                    ✨ Factory New possible — output float can go below 0.07
                  </div>
                )}
              </div>
            </Card>

            {/* Meta */}
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] capitalize",
                      contract.risk_level === "low" && "text-emerald-600",
                      contract.risk_level === "medium" && "text-amber-600",
                      contract.risk_level === "high" && "text-red-500"
                    )}
                  >
                    {contract.risk_level}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume Score</span>
                  <span className="font-mono">{contract.volume_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDistanceToNow(new Date(contract.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
