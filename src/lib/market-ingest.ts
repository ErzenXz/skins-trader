import { createHash } from "crypto";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { skins } from "@/lib/db/schema";
import type { Rarity, SkinPrice, Wear } from "@/lib/types";

type SteamTag = {
  category?: string;
  category_name?: string;
  localized_tag_name?: string;
};

type SteamSearchResult = {
  hash_name?: string;
  sell_price?: number;
  sell_price_text?: string;
  sell_listings?: number;
  asset_description?: {
    icon_url?: string;
    tags?: SteamTag[];
  };
};

type SteamSearchResponse = {
  results?: SteamSearchResult[];
};

const WEAR_FLOATS: Record<Wear, { min: number; max: number }> = {
  "Factory New": { min: 0.0, max: 0.07 },
  "Minimal Wear": { min: 0.07, max: 0.15 },
  "Field-Tested": { min: 0.15, max: 0.38 },
  "Well-Worn": { min: 0.38, max: 0.45 },
  "Battle-Scarred": { min: 0.45, max: 1.0 },
};

function skinIdFromHashName(marketHashName: string): string {
  const hash = createHash("sha1").update(marketHashName).digest("hex").slice(0, 20);
  return `s_${hash}`;
}

function parseWear(marketHashName: string, tags?: SteamTag[]): Wear | null {
  const regex = /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/i;
  const match = marketHashName.match(regex)?.[1];
  if (match) {
    const normalized = match
      .replace(/factory new/i, "Factory New")
      .replace(/minimal wear/i, "Minimal Wear")
      .replace(/field-tested/i, "Field-Tested")
      .replace(/well-worn/i, "Well-Worn")
      .replace(/battle-scarred/i, "Battle-Scarred");

    return normalized as Wear;
  }

  const wearTag = tags?.find(
    (t) =>
      (t.category || "").toLowerCase() === "exterior" ||
      (t.category_name || "").toLowerCase().includes("exterior")
  )?.localized_tag_name;

  if (!wearTag) return null;

  if (wearTag.includes("Factory New")) return "Factory New";
  if (wearTag.includes("Minimal Wear")) return "Minimal Wear";
  if (wearTag.includes("Field-Tested")) return "Field-Tested";
  if (wearTag.includes("Well-Worn")) return "Well-Worn";
  if (wearTag.includes("Battle-Scarred")) return "Battle-Scarred";

  return null;
}

function parseRarity(tags?: SteamTag[]): Rarity | null {
  const rarityTag = tags?.find(
    (t) =>
      (t.category || "").toLowerCase() === "rarity" ||
      (t.category_name || "").toLowerCase().includes("rarity")
  )?.localized_tag_name;

  if (!rarityTag) return null;

  const v = rarityTag.toLowerCase();
  if (v.includes("consumer")) return "Consumer";
  if (v.includes("industrial")) return "Industrial";
  if (v.includes("mil-spec") || v.includes("milspec")) return "Mil-Spec";
  if (v.includes("restricted")) return "Restricted";
  if (v.includes("classified")) return "Classified";
  if (v.includes("covert")) return "Covert";

  return null;
}

function parseCollection(tags?: SteamTag[]): string {
  const tag = tags?.find(
    (t) =>
      (t.category || "").toLowerCase() === "collection" ||
      (t.category_name || "").toLowerCase().includes("collection")
  )?.localized_tag_name;

  return tag || "Unknown Collection";
}

function parsePrice(raw: SteamSearchResult): number | null {
  if (typeof raw.sell_price === "number" && Number.isFinite(raw.sell_price)) {
    return raw.sell_price / 100;
  }

  if (raw.sell_price_text) {
    const cleaned = raw.sell_price_text
      .replace(/[^\d.,]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function toSkin(result: SteamSearchResult): SkinPrice | null {
  const marketHashName = result.hash_name;
  if (!marketHashName || !marketHashName.includes("|")) return null;

  const tags = result.asset_description?.tags;
  const rarity = parseRarity(tags);
  const wear = parseWear(marketHashName, tags);
  const price = parsePrice(result);

  if (!rarity || !wear || price === null || price <= 0) return null;

  const [namePart] = marketHashName.split("(");
  const cleanName = namePart.replace(/StatTrak™\s*/g, "").trim();
  const floatRange = WEAR_FLOATS[wear];
  const icon = result.asset_description?.icon_url;

  return {
    id: skinIdFromHashName(marketHashName),
    market_hash_name: marketHashName,
    name: cleanName,
    collection: parseCollection(tags),
    rarity,
    price,
    volume: Number(result.sell_listings || 0),
    median_price: price,
    float_min: floatRange.min,
    float_max: floatRange.max,
    wear,
    image_url: icon ? `https://community.cloudflare.steamstatic.com/economy/image/${icon}/96fx96f` : "",
    updated_at: new Date(),
    price_trend: 0,
    stattrak: marketHashName.includes("StatTrak"),
  };
}

async function fetchMarketPage(start: number, count: number, query?: string): Promise<SteamSearchResult[]> {
  const url = new URL("https://steamcommunity.com/market/search/render/");
  url.searchParams.set("appid", "730");
  url.searchParams.set("norender", "1");
  url.searchParams.set("currency", "1");
  url.searchParams.set("start", String(start));
  url.searchParams.set("count", String(count));
  if (query) url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "TradeUPHunter/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Steam market request failed (${res.status})`);
  }

  const data = (await res.json()) as SteamSearchResponse;
  return data.results || [];
}

export async function ingestMarketSkins(options?: { pages?: number; pageSize?: number; query?: string }) {
  const pages = Math.max(1, Math.min(options?.pages ?? 3, 10));
  const pageSize = Math.max(20, Math.min(options?.pageSize ?? 100, 100));

  const dedup = new Map<string, SkinPrice>();

  for (let i = 0; i < pages; i++) {
    const start = i * pageSize;
    const rows = await fetchMarketPage(start, pageSize, options?.query);

    for (const row of rows) {
      const parsed = toSkin(row);
      if (!parsed) continue;

      const existing = dedup.get(parsed.market_hash_name);
      if (!existing || parsed.price < existing.price) {
        dedup.set(parsed.market_hash_name, parsed);
      }
    }
  }

  const now = new Date();

  for (const skin of dedup.values()) {
    await db
      .insert(skins)
      .values({
        id: skin.id,
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
          stattrak: skin.stattrak,
          updatedAt: now,
        },
      });
  }

  return {
    fetched: pages * pageSize,
    parsed: dedup.size,
    saved: dedup.size,
  };
}

export async function ensureFreshMarketSkins(options?: {
  minRows?: number;
  maxAgeMinutes?: number;
  ingestPages?: number;
}) {
  const minRows = options?.minRows ?? 150;
  const maxAgeMinutes = options?.maxAgeMinutes ?? 60;

  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(skins);
  const totalRows = Number(countRow?.count ?? 0);

  const [latest] = await db
    .select({ updatedAt: skins.updatedAt })
    .from(skins)
    .orderBy(desc(skins.updatedAt))
    .limit(1);

  const ageMinutes = latest?.updatedAt
    ? (Date.now() - new Date(latest.updatedAt).getTime()) / (1000 * 60)
    : Infinity;

  if (totalRows >= minRows && ageMinutes <= maxAgeMinutes) {
    return {
      refreshed: false,
      totalRows,
      ageMinutes,
      fetched: 0,
      parsed: 0,
      saved: 0,
    };
  }

  const ingest = await ingestMarketSkins({ pages: options?.ingestPages ?? 3 });

  const [newCount] = await db.select({ count: sql<number>`count(*)` }).from(skins);

  return {
    refreshed: true,
    totalRows: Number(newCount?.count ?? 0),
    ageMinutes,
    ...ingest,
  };
}
