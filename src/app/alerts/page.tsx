"use client";

import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  TrendingUp,
  Flame,
  Crosshair,
  TrendingDown,
  Globe,
  Mail,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  useAlerts,
  useAlertConfigs,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useToggleAlertConfig,
} from "@/lib/queries";

const icons: Record<string, typeof TrendingUp> = {
  profitable: TrendingUp,
  high_roi: Flame,
  float_opportunity: Crosshair,
  price_drop: TrendingDown,
};

const colors: Record<string, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

const deliveryIcons: Record<string, typeof Globe> = { web: Globe, email: Mail, discord: MessageSquare };

export default function AlertsPage() {
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const { data: alertConfigs = [], isLoading: configsLoading } = useAlertConfigs();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const toggleConfig = useToggleAlertConfig();

  const unread = alerts.filter((a) => !a.read).length;
  const [tab, setTab] = useState("all");

  const list = tab === "unread" ? alerts.filter((a) => !a.read) : alerts;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Notifications for profitable finds and price changes.
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="mr-2 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="lg:col-span-2">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All ({alerts.length})</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Unread ({unread})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="mt-4">
              {alertsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : list.length > 0 ? (
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{a.title}</p>
                            {!a.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
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
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={() => markRead.mutate(a.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No alerts to show.
                </div>
              )}
            </Card>
          </div>

          {/* Config */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold">Alert Rules</h3>
              {configsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {alertConfigs.map((c) => {
                    const Icon = icons[c.type] || TrendingUp;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium">{c.label}</p>
                            <div className="mt-1 flex gap-1">
                              {c.delivery.map((d: string) => {
                                const DIcon = deliveryIcons[d] || Globe;
                                return (
                                  <Badge key={d} variant="outline" className="gap-1 text-[8px]">
                                    <DIcon className="h-2.5 w-2.5" />
                                    {d}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={c.enabled}
                          onCheckedChange={() => toggleConfig.mutate(c.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold">Channels</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Web Push</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Email</span>
                  </div>
                  <Badge variant="outline" className="text-[9px]">Setup needed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Discord</span>
                  </div>
                  <Badge variant="outline" className="text-[9px]">Coming soon</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
