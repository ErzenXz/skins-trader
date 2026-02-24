"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useSaveSettings, useSettings } from "@/lib/queries";
import type { UserSettings } from "@/lib/types";

type DraftSettings = {
  apiKey: string;
  cacheEnabled?: boolean;
  cacheTTL?: string;
  autoRefresh?: boolean;
  refreshInterval?: string;
  rateLimit?: string;
  notifications?: boolean;
  currency?: UserSettings["currency"];
  autoScan?: boolean;
};

export default function SettingsPage() {
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();
  const [draft, setDraft] = useState<DraftSettings>({ apiKey: "" });

  const cacheEnabled = draft.cacheEnabled ?? settings?.cacheEnabled ?? true;
  const cacheTTL = draft.cacheTTL ?? String(settings?.cacheTTL ?? 300);
  const autoRefresh = draft.autoRefresh ?? settings?.autoRefresh ?? true;
  const refreshInterval = draft.refreshInterval ?? String(settings?.refreshInterval ?? 60);
  const rateLimit = draft.rateLimit ?? String(settings?.rateLimit ?? 20);
  const notifications = draft.notifications ?? settings?.notifications ?? true;
  const currency = draft.currency ?? settings?.currency ?? "USD";
  const autoScan = draft.autoScan ?? settings?.autoScan ?? false;

  async function onSave() {
    try {
      await saveSettings.mutateAsync({
        rateLimit: Number(rateLimit),
        cacheEnabled,
        cacheTTL: Number(cacheTTL),
        autoRefresh,
        refreshInterval: Number(refreshInterval),
        notifications,
        currency,
        autoScan,
        ...(draft.apiKey.trim() ? { steamApiKey: draft.apiKey.trim() } : {}),
      });

      setDraft((prev) => ({ ...prev, apiKey: "" }));
      toast.success("Settings saved!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(message);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure API, caching, and preferences.
          </p>
        </div>

        {/* API */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">API</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Steam Web API Key</Label>
              <Input
                type="password"
                placeholder={settings?.steamApiKeySet ? "Saved key exists (enter new key to replace)" : "Enter your key..."}
                value={draft.apiKey}
                onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                From steamcommunity.com/dev/apikey
                {settings?.steamApiKeyMasked ? ` • Saved: ${settings.steamApiKeyMasked}` : ""}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate Limit</Label>
              <Select
                value={rateLimit}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, rateLimit: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10/min (Safe)</SelectItem>
                  <SelectItem value="20">20/min (Default)</SelectItem>
                  <SelectItem value="40">40/min (Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Caching */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Caching</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Enable Cache</p>
                <p className="text-[10px] text-muted-foreground">
                  Reduces API calls
                </p>
              </div>
              <Switch
                checked={cacheEnabled}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, cacheEnabled: value }))}
              />
            </div>
            {cacheEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs">Cache Duration</Label>
                <Select
                  value={cacheTTL}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, cacheTTL: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </Card>

        {/* Refresh */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Auto-Refresh</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs font-medium">Enable Vercel Cron Auto-Scan</p>
                <p className="text-[10px] text-muted-foreground">
                  Runs scheduled scans on your account
                </p>
              </div>
              <Switch
                checked={autoScan}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, autoScan: value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Auto-refresh prices</p>
                <p className="text-[10px] text-muted-foreground">
                  Keep data up to date
                </p>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, autoRefresh: value }))}
              />
            </div>
            {autoRefresh && (
              <div className="space-y-1.5">
                <Label className="text-xs">Interval</Label>
                <Select
                  value={refreshInterval}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, refreshInterval: value }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Preferences</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Select
                value={currency}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, currency: value as UserSettings["currency"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Browser push notifications
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={(value) => setDraft((prev) => ({ ...prev, notifications: value }))}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={onSave} disabled={saveSettings.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
