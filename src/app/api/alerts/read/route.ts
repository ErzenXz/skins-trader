import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alerts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";

// Mark one alert as read
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { id, all } = await request.json();

    if (all) {
      await db
        .update(alerts)
        .set({ read: true })
        .where(eq(alerts.userId, session.user.id));
    } else if (id) {
      await db
        .update(alerts)
        .set({ read: true })
        .where(and(eq(alerts.id, id), eq(alerts.userId, session.user.id)));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
