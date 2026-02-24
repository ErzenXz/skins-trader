"use client";

import { Search, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useRunScan } from "@/lib/queries";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const { isScanning, scanProgress, startScan, stopScan, filters, setFilter } =
    useAppStore();
  const { data: session } = useSession();
  const runScan = useRunScan();

  async function handleScan() {
    if (isScanning || runScan.isPending) return;

    startScan();
    try {
      const result = await runScan.mutateAsync({});
      toast.success(`Scan complete: ${result.contractsGenerated} contracts generated`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      toast.error(message);
    } finally {
      stopScan();
    }
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search skins, collections..."
          className="h-9 pl-9 text-sm"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Scanner */}
        {isScanning ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Scanning… {Math.min(100, Math.round(scanProgress))}%</span>
          </div>
        ) : (
          <Button size="sm" onClick={handleScan} disabled={runScan.isPending}>
            {runScan.isPending ? "Scanning..." : "Scan Market"}
          </Button>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-[10px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/login");
                router.refresh();
              }}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
