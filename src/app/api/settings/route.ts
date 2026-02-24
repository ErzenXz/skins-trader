import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-server";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";
import type { UserSettings } from "@/lib/types";
import { ensureUserSettingsTable } from "@/lib/db/ensure-user-settings";

function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function getOrCreateSettings(userId: string) {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (existing) return existing;

  const now = new Date();

  await db.insert(userSettings).values({
    id: generateId("us_"),
    userId,
    steamApiKey: null,
    rateLimit: 20,
    cacheEnabled: true,
    cacheTTL: 300,
    autoRefresh: true,
    refreshInterval: 60,
    notifications: true,
    currency: "USD",
    autoScan: false,
    createdAt: now,
    updatedAt: now,
  });

  const [created] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  return created;
}

function toResponseModel(row: typeof userSettings.$inferSelect): UserSettings {
  return {
    steamApiKeySet: !!row.steamApiKey,
    steamApiKeyMasked: maskApiKey(row.steamApiKey),
    rateLimit: row.rateLimit,
    cacheEnabled: row.cacheEnabled,
    cacheTTL: row.cacheTTL,
    autoRefresh: row.autoRefresh,
    refreshInterval: row.refreshInterval,
    notifications: row.notifications,
    currency: (row.currency as UserSettings["currency"]) || "USD",
    autoScan: row.autoScan,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    await ensureUserSettingsTable();
    const settings = await getOrCreateSettings(session.user.id);
    return NextResponse.json(toResponseModel(settings));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    await ensureUserSettingsTable();
    const settings = await getOrCreateSettings(session.user.id);
    const body = (await request.json()) as Partial<
      UserSettings & {
        steamApiKey?: string;
        clearSteamApiKey?: boolean;
      }
    >;

    const updates: Partial<typeof userSettings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.rateLimit === "number") updates.rateLimit = Math.max(1, Math.min(120, body.rateLimit));
    if (typeof body.cacheEnabled === "boolean") updates.cacheEnabled = body.cacheEnabled;
    if (typeof body.cacheTTL === "number") updates.cacheTTL = Math.max(30, Math.min(3600, body.cacheTTL));
    if (typeof body.autoRefresh === "boolean") updates.autoRefresh = body.autoRefresh;
    if (typeof body.refreshInterval === "number") updates.refreshInterval = Math.max(15, Math.min(3600, body.refreshInterval));
    if (typeof body.notifications === "boolean") updates.notifications = body.notifications;
    if (typeof body.autoScan === "boolean") updates.autoScan = body.autoScan;

    if (body.currency === "USD" || body.currency === "EUR" || body.currency === "GBP") {
      updates.currency = body.currency;
    }

    if (body.clearSteamApiKey === true) {
      updates.steamApiKey = null;
    } else if (typeof body.steamApiKey === "string") {
      const key = body.steamApiKey.trim();
      if (key.length > 0) updates.steamApiKey = key;
    }

    await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.id, settings.id));

    const [fresh] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.id, settings.id));

    return NextResponse.json(toResponseModel(fresh));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
