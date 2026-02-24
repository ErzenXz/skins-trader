"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, TrendingUp, Flame, Crosshair, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead } from "@/lib/queries";

const icons = {
  profitable: TrendingUp,
  high_roi: Flame,
  float_opportunity: Crosshair,
  price_drop: TrendingDown,
};

const colors = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

export function AlertsFeed({ limit = 5 }: { limit?: number }) {
  const { data: alerts, isLoading } = useAlerts();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const list = (alerts || []).slice(0, limit);
  const unread = (alerts || []).filter((a) => !a.read).length;

  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Recent Alerts</h3>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-xs text-muted-foreground">No alerts yet.</p>
        </div>
      ) : (
        <div className="divide-y">
          {list.map((a) => {
            const Icon = icons[a.type] || TrendingUp;
            return (
              <div
                key={a.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3",
                  a.read && "opacity-50"
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", colors[a.severity])} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{a.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {a.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!a.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => markRead.mutate(a.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
