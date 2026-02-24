import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import type { Alert } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireAuth();

    const rows = await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, session.user.id))
      .orderBy(desc(alerts.createdAt))
      .limit(50);

    const result: Alert[] = rows.map((r) => ({
      id: r.id,
      type: r.type as Alert["type"],
      title: r.title,
      message: r.message,
      contract_id: r.contractId || undefined,
      severity: r.severity as Alert["severity"],
      read: r.read,
      created_at: r.createdAt,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
