import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alertConfigs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import { generateId } from "@/lib/id";
import type { AlertConfig } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();

    const rows = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.userId, session.user.id));

    // If user has no configs yet, seed defaults
    if (rows.length === 0) {
      const defaults: Omit<AlertConfig, "id">[] = [
        { type: "profitable", label: "New Profitable Contracts", enabled: true, threshold: 0.10, delivery: ["web"] },
        { type: "high_roi", label: "High ROI Spikes (>100%)", enabled: true, threshold: 1.00, delivery: ["web"] },
        { type: "float_opportunity", label: "Float Snipe Opportunities", enabled: true, delivery: ["web"] },
        { type: "price_drop", label: "Input Price Drops (>10%)", enabled: false, threshold: 0.10, delivery: ["web"] },
      ];

      for (const cfg of defaults) {
        await db.insert(alertConfigs).values({
          id: generateId("ac_"),
          userId: session.user.id,
          type: cfg.type,
          label: cfg.label,
          enabled: cfg.enabled,
          threshold: cfg.threshold || null,
          delivery: JSON.stringify(cfg.delivery),
        });
      }

      // Re-fetch
      const fresh = await db
        .select()
        .from(alertConfigs)
        .where(eq(alertConfigs.userId, session.user.id));

      return NextResponse.json(
        fresh.map((r) => ({
          id: r.id,
          type: r.type,
          label: r.label,
          enabled: r.enabled,
          threshold: r.threshold,
          delivery: JSON.parse(r.delivery),
        }))
      );
    }

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        type: r.type,
        label: r.label,
        enabled: r.enabled,
        threshold: r.threshold,
        delivery: JSON.parse(r.delivery),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
