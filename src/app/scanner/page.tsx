"use client";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { useContracts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function ScannerPage() {
  const { isScanning, scanProgress, startScan, stopScan } = useAppStore();
  const { data: contracts = [], isLoading } = useContracts();
  const [maxCost, setMaxCost] = useState([50]);
  const [minROI, setMinROI] = useState([10]);
  const [autoScan, setAutoScan] = useState(false);
  const [rarity, setRarity] = useState("all");

  // Filter contracts based on scanner settings
  let results = contracts;
  if (rarity !== "all") results = results.filter((c) => c.input_rarity === rarity);
  results = results.filter((c) => c.input_cost <= maxCost[0]);
  results = results.filter((c) => c.roi * 100 >= minROI[0]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Scanner</h1>
          <p className="text-sm text-muted-foreground">
            Configure your scan and find profitable trade-ups.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Config */}
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Scan Settings</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Input Rarity</Label>
                <Select value={rarity} onValueChange={setRarity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Mil-Spec">Mil-Spec</SelectItem>
                    <SelectItem value="Restricted">Restricted</SelectItem>
                    <SelectItem value="Classified">Classified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Max Cost</Label>
                  <span className="font-mono">${maxCost[0]}</span>
                </div>
                <Slider value={maxCost} onValueChange={setMaxCost} max={500} min={1} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label>Min ROI</Label>
                  <span className="font-mono">{minROI[0]}%</span>
                </div>
                <Slider value={minROI} onValueChange={setMinROI} max={500} min={0} step={5} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs font-medium">Auto-Scan</p>
                  <p className="text-[10px] text-muted-foreground">
                    Repeat every 5 minutes
                  </p>
                </div>
                <Switch checked={autoScan} onCheckedChange={setAutoScan} />
              </div>

              <div className="flex gap-2">
                {isScanning ? (
                  <Button onClick={stopScan} variant="destructive" className="flex-1">
                    <Pause className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                ) : (
                  <Button onClick={startScan} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Start Scan
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={stopScan}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4 lg:col-span-2">
            {isScanning && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-medium">Scanning…</span>
                  </div>
                  <span className="font-mono text-sm">
                    {Math.min(100, Math.round(scanProgress))}%
                  </span>
                </div>
                <Progress value={Math.min(100, scanProgress)} className="h-2" />
              </Card>
            )}

            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Results</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No contracts found. Adjust filters or run a scan.
                </p>
              ) : (
                <div className="space-y-2">
                  {results.slice(0, 8).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            c.profit > 0 ? "bg-emerald-500" : "bg-red-400"
                          )}
                        />
                        <span className="text-xs">
                          {c.input_rarity}
                          <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                          {c.output_rarity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.collections[0]
                            ?.replace("The ", "")
                            .replace(" Collection", "")
                            .replace(" Case", "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-mono">${c.input_cost.toFixed(2)}</span>
                        <span
                          className={cn(
                            "font-mono font-semibold",
                            c.profit > 0 ? "text-emerald-600" : "text-red-500"
                          )}
                        >
                          {c.profit > 0 ? "+" : ""}
                          {(c.roi * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
