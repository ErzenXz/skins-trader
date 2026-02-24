import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alertConfigs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";

// Toggle alert config
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(alertConfigs)
      .where(and(eq(alertConfigs.id, id), eq(alertConfigs.userId, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(alertConfigs)
      .set({ enabled: !existing.enabled })
      .where(eq(alertConfigs.id, id));

    return NextResponse.json({ ok: true, enabled: !existing.enabled });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
