import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runScanForUser } from "@/lib/scan";
import { ensureUserSettingsTable } from "@/lib/db/ensure-user-settings";
import { ensureFreshMarketSkins } from "@/lib/market-ingest";

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
        { error: "Please save your Steam API key in Settings before scanning." },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      rarity?: string;
      minROI?: number;
      maxCost?: number;
    };

    const market = await ensureFreshMarketSkins({
      minRows: 150,
      maxAgeMinutes: 60,
      ingestPages: 3,
    });

    const result = await runScanForUser(session.user.id, {
      rarity: body.rarity,
      minROI: typeof body.minROI === "number" ? body.minROI : undefined,
      maxCost: typeof body.maxCost === "number" ? body.maxCost : undefined,
    });

    return NextResponse.json({
      ...result,
      market,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
