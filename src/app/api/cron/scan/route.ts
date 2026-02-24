import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { runScanForUser } from "@/lib/scan";
import { ensureUserSettingsTable } from "@/lib/db/ensure-user-settings";
import { ensureFreshMarketSkins } from "@/lib/market-ingest";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await ensureUserSettingsTable();

  const market = await ensureFreshMarketSkins({
    minRows: 150,
    maxAgeMinutes: 60,
    ingestPages: 4,
  });

  const users = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(and(eq(userSettings.autoScan, true), isNotNull(userSettings.steamApiKey)));

  let scannedUsers = 0;
  let failedUsers = 0;

  for (const user of users) {
    try {
      await runScanForUser(user.userId);
      scannedUsers += 1;
    } catch {
      failedUsers += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    market,
    scannedUsers,
    failedUsers,
  });
}
