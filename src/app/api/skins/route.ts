import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skins } from "@/lib/db/schema";
import { eq, desc, like } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import { generateId } from "@/lib/id";
import type { SkinPrice, Rarity, Wear } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const url = new URL(request.url);
    const rarity = url.searchParams.get("rarity");
    const collection = url.searchParams.get("collection");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "100");

    let query = db.select().from(skins).orderBy(desc(skins.price)).limit(limit).$dynamic();

    const rows = await query;

    let result = rows.map((s): SkinPrice => ({
      id: s.id,
      market_hash_name: s.marketHashName,
      name: s.name,
      collection: s.collection,
      rarity: s.rarity as Rarity,
      price: s.price,
      volume: s.volume,
      median_price: s.medianPrice,
      float_min: s.floatMin,
      float_max: s.floatMax,
      wear: s.wear as Wear,
      image_url: s.imageUrl || "",
      updated_at: s.updatedAt,
      price_trend: s.priceTrend,
      stattrak: s.stattrak,
    }));

    // Client-side filtering (simpler for SQLite)
    if (rarity && rarity !== "all") {
      result = result.filter((s) => s.rarity === rarity);
    }
    if (collection && collection !== "all") {
      result = result.filter((s) => s.collection === collection);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.collection.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();

    // Accept single skin or array
    const items: SkinPrice[] = Array.isArray(body) ? body : [body];
    const now = new Date();

    for (const skin of items) {
      await db
        .insert(skins)
        .values({
          id: skin.id || generateId("s_"),
          marketHashName: skin.market_hash_name,
          name: skin.name,
          collection: skin.collection,
          rarity: skin.rarity,
          price: skin.price,
          volume: skin.volume,
          medianPrice: skin.median_price,
          floatMin: skin.float_min,
          floatMax: skin.float_max,
          wear: skin.wear,
          imageUrl: skin.image_url,
          priceTrend: skin.price_trend,
          stattrak: skin.stattrak,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: skins.id,
          set: {
            price: skin.price,
            volume: skin.volume,
            medianPrice: skin.median_price,
            priceTrend: skin.price_trend,
            updatedAt: now,
          },
        });
    }

    return NextResponse.json({ inserted: items.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
