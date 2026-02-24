import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, alerts, scanHistory } from "@/lib/db/schema";
import { eq, desc, gt, and, count, sum, max, avg } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import type { DashboardStats } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Count contracts
    const allContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.userId, userId));

    const profitable = allContracts.filter((c) => c.profit > 0);
    const totalProfit = allContracts.reduce((s, c) => s + c.profit, 0);
    const bestRoi = allContracts.length > 0 ? Math.max(...allContracts.map((c) => c.roi)) : 0;
    const avgRoi = allContracts.length > 0 ? allContracts.reduce((s, c) => s + c.roi, 0) / allContracts.length : 0;

    // Count unread alerts
    const unreadAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.userId, userId), eq(alerts.read, false)));

    // Last scan
    const [lastScan] = await db
      .select()
      .from(scanHistory)
      .where(eq(scanHistory.userId, userId))
      .orderBy(desc(scanHistory.completedAt))
      .limit(1);

    // Total scanned across all scans
    const scanRows = await db
      .select()
      .from(scanHistory)
      .where(eq(scanHistory.userId, userId));
    const totalScanned = scanRows.reduce((s, r) => s + r.totalScanned, 0);

    const stats: DashboardStats = {
      total_scanned: totalScanned,
      profitable_count: profitable.length,
      avg_roi: avgRoi,
      best_roi: bestRoi,
      total_potential_profit: totalProfit > 0 ? totalProfit : 0,
      last_scan: lastScan?.completedAt || new Date(),
      active_alerts: unreadAlerts.length,
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
