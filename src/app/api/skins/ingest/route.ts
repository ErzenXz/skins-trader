import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUserSettingsTable } from "@/lib/db/ensure-user-settings";
import { ingestMarketSkins } from "@/lib/market-ingest";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await ensureUserSettingsTable();

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id));

    if (!settings?.steamApiKey) {
      return NextResponse.json(
        { error: "Please save your Steam API key in Settings first." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { pages?: number };
    const result = await ingestMarketSkins({ pages: body.pages ?? 3 });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
