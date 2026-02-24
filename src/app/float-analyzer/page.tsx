"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useContracts } from "@/lib/queries";
import { computeOutputFloat, getWearFromFloat } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { Wear } from "@/lib/types";

const WEAR_COLORS: Record<Wear, string> = {
  "Factory New": "text-emerald-600 bg-emerald-50 border-emerald-200",
  "Minimal Wear": "text-blue-600 bg-blue-50 border-blue-200",
  "Field-Tested": "text-amber-600 bg-amber-50 border-amber-200",
  "Well-Worn": "text-orange-600 bg-orange-50 border-orange-200",
  "Battle-Scarred": "text-red-600 bg-red-50 border-red-200",
};

export default function FloatAnalyzerPage() {
  const [floats, setFloats] = useState<number[]>(Array(10).fill(0.15));
  const [outMin, setOutMin] = useState(0);
  const [outMax, setOutMax] = useState(0.5);
  const [active, setActive] = useState(0);

  const { data: contracts = [] } = useContracts();

  const avg = floats.reduce((a, b) => a + b, 0) / floats.length;
  const result = computeOutputFloat(avg, outMin, outMax);
  const wear = getWearFromFloat(result.expected);

  const fnContracts = contracts.filter(
    (c) => c.output_float_range.min < 0.07 && c.profit > 0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Float Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Calculate what wear your trade-up output will be.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calculator */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Output Skin Float Range</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Float</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={outMin}
                    onChange={(e) => setOutMin(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Float</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={outMax}
                    onChange={(e) => setOutMax(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>

              <Separator className="my-5" />

              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Input Floats</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setFloats(Array(10).fill(0.001))}
                  >
                    All Low
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setFloats(Array(10).fill(0.15))}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {floats.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "rounded-lg border p-2 text-center transition-colors",
                      active === i
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <p className="text-[10px] text-muted-foreground">#{i + 1}</p>
                    <p className="font-mono text-xs font-medium">
                      {f.toFixed(3)}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg border p-3">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Slot {active + 1}</span>
                  <span className="font-mono">{floats[active].toFixed(4)}</span>
                </div>
                <Slider
                  value={[floats[active] * 1000]}
                  onValueChange={([v]) => {
                    const next = [...floats];
                    next[active] = v / 1000;
                    setFloats(next);
                  }}
                  max={1000}
                  min={0}
                  step={1}
                />
              </div>
            </Card>

            {/* FN Opportunities */}
            {fnContracts.length > 0 && (
              <Card className="p-5">
                <h3 className="mb-3 text-sm font-semibold">
                  Factory New Opportunities ({fnContracts.length})
                </h3>
                <div className="space-y-2">
                  {fnContracts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs"
                    >
                      <div>
                        <span>
                          {c.input_rarity}
                          <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                          {c.output_rarity}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          min float: {c.output_float_range.min.toFixed(4)}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-emerald-600">
                        +{(c.roi * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Result */}
          <div className="space-y-4">
            <Card className="border-primary/20 p-5">
              <h3 className="mb-4 text-sm font-semibold text-primary">
                Calculated Output
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Average Input Float
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-semibold">
                    {avg.toFixed(6)}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Expected Output Float
                  </p>
                  <p className="mt-0.5 font-mono text-2xl font-bold text-primary">
                    {result.expected.toFixed(6)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Min</span>
                    <p className="font-mono font-medium">{result.min.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max</span>
                    <p className="font-mono font-medium">{result.max.toFixed(6)}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground">Expected Wear</p>
                  <Badge
                    variant="outline"
                    className={cn("mt-1 text-sm font-semibold", WEAR_COLORS[wear])}
                  >
                    {wear}
                  </Badge>
                </div>

                {/* Float bar */}
                <div>
                  <div className="relative h-6 rounded-lg bg-gradient-to-r from-emerald-100 via-amber-100 to-red-100 border overflow-hidden">
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded bg-primary/30 border border-primary/50"
                      style={{
                        left: `${result.min * 100}%`,
                        width: `${Math.max(1, (result.max - result.min) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
                    <span>FN</span>
                    <span>MW</span>
                    <span>FT</span>
                    <span>WW</span>
                    <span>BS</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Tips</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Lower input floats = better output.</strong>{" "}
                  The average of all 10 inputs directly affects the result.
                </p>
                <p>
                  <strong className="text-foreground">Factory New = below 0.07.</strong>{" "}
                  FN skins are worth significantly more.
                </p>
                <p>
                  <strong className="text-foreground">Narrow output ranges help.</strong>{" "}
                  Skins with 0.00–0.08 range make FN much more likely.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
