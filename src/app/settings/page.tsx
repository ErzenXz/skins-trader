"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheTTL, setCacheTTL] = useState("300");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("60");
  const [rateLimit, setRateLimit] = useState("20");
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState("USD");

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
                placeholder="Enter your key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                From steamcommunity.com/dev/apikey
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rate Limit</Label>
              <Select value={rateLimit} onValueChange={setRateLimit}>
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
              <Switch checked={cacheEnabled} onCheckedChange={setCacheEnabled} />
            </div>
            {cacheEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs">Cache Duration</Label>
                <Select value={cacheTTL} onValueChange={setCacheTTL}>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Auto-refresh prices</p>
                <p className="text-[10px] text-muted-foreground">
                  Keep data up to date
                </p>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            {autoRefresh && (
              <div className="space-y-1.5">
                <Label className="text-xs">Interval</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
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
              <Select value={currency} onValueChange={setCurrency}>
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
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={() => toast.success("Settings saved!")}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
