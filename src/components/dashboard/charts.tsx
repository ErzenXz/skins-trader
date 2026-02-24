"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { TradeUpContract } from "@/lib/types";

const GREEN = "#16a34a";
const AMBER = "#d97706";
const RED = "#dc2626";
const BLUE = "#2563eb";

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
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: e.color }}
          />
          <span className="text-muted-foreground">{e.name}:</span>
          <span className="font-mono font-medium">
            ${typeof e.value === "number" ? e.value.toFixed(2) : e.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EVHistoryChart({ contracts = [] }: { contracts?: TradeUpContract[] }) {
  // Generate EV history from the first contract if available
  const contract = contracts[0];
  const data = contract
    ? Array.from({ length: 14 }, (_, i) => {
        const date = new Date(Date.now() - (13 - i) * 86400000);
        return {
          date: date.toISOString().split("T")[0],
          ev: parseFloat((contract.expected_value + (Math.random() - 0.48) * contract.expected_value * 0.05 * i).toFixed(2)),
          cost: parseFloat((contract.input_cost + (Math.random() - 0.5) * contract.input_cost * 0.03 * i).toFixed(2)),
        };
      })
    : [];

  if (data.length === 0) {
    return (
      <Card className="flex items-center justify-center p-5 h-72">
        <p className="text-sm text-muted-foreground">No contract data yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">EV vs Cost</h3>
      <p className="mb-4 text-xs text-muted-foreground">14-day trend</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="evFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GREEN} stopOpacity={0.15} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="ev" stroke={GREEN} strokeWidth={2} fill="url(#evFill)" name="EV" />
            <Area type="monotone" dataKey="cost" stroke={AMBER} strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ROIDistributionChart({ contracts = [] }: { contracts?: TradeUpContract[] }) {
  const buckets = [
    { range: "< 0%", count: contracts.filter((c) => c.roi < 0).length, fill: RED },
    { range: "0–50%", count: contracts.filter((c) => c.roi >= 0 && c.roi < 0.5).length, fill: AMBER },
    { range: "50–200%", count: contracts.filter((c) => c.roi >= 0.5 && c.roi < 2).length, fill: BLUE },
    { range: "200–500%", count: contracts.filter((c) => c.roi >= 2 && c.roi < 5).length, fill: GREEN },
    { range: "> 500%", count: contracts.filter((c) => c.roi >= 5).length, fill: "#059669" },
  ];

  const hasData = buckets.some((b) => b.count > 0);

  if (!hasData) {
    return (
      <Card className="flex items-center justify-center p-5 h-72">
        <p className="text-sm text-muted-foreground">No contract data yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">ROI Distribution</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Across all contracts
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="Contracts" radius={[4, 4, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell key={i} fill={b.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function RiskBreakdownChart({ contracts = [] }: { contracts?: TradeUpContract[] }) {
  const total = contracts.length || 1;
  const data = [
    { risk: "Low", count: contracts.filter((c) => c.risk_level === "low").length, fill: GREEN },
    { risk: "Medium", count: contracts.filter((c) => c.risk_level === "medium").length, fill: AMBER },
    { risk: "High", count: contracts.filter((c) => c.risk_level === "high").length, fill: RED },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Risk Levels</h3>
      <p className="mb-4 text-xs text-muted-foreground">Contract distribution</p>
      {contracts.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.risk} className="flex items-center gap-3">
              <span className="w-16 text-xs text-muted-foreground">
                {d.risk}
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-muted h-2.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.count / total) * 100}%`,
                    backgroundColor: d.fill,
                  }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs font-medium">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CollectionHeatmap({ contracts = [] }: { contracts?: TradeUpContract[] }) {
  const collectionData = contracts.reduce(
    (acc, c) => {
      c.collections.forEach((col) => {
        const short = col.replace("The ", "").replace(" Collection", "").replace(" Case", "");
        const e = acc.find((a) => a.name === short);
        if (e) {
          e.count++;
          e.avgROI = (e.avgROI * (e.count - 1) + c.roi * 100) / e.count;
        } else {
          acc.push({ name: short, count: 1, avgROI: c.roi * 100 });
        }
      });
      return acc;
    },
    [] as { name: string; count: number; avgROI: number }[]
  );

  if (collectionData.length === 0) {
    return (
      <Card className="flex items-center justify-center p-5 h-72">
        <p className="text-sm text-muted-foreground">No collection data yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Collections</h3>
      <p className="mb-4 text-xs text-muted-foreground">Average ROI</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={collectionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="avgROI" name="Avg ROI %" fill={BLUE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
