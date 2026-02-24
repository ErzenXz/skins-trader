import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractInputs, contractOutputs, skins } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import type { TradeUpContract, SkinPrice, PossibleOutcome, Wear, Rarity, RiskLevel } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const [row] = await db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.userId, session.user.id)));

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const inputRows = await db
      .select({ input: contractInputs, skin: skins })
      .from(contractInputs)
      .innerJoin(skins, eq(contractInputs.skinId, skins.id))
      .where(eq(contractInputs.contractId, id))
      .orderBy(contractInputs.slotIndex);

    const outputRows = await db
      .select({ output: contractOutputs, skin: skins })
      .from(contractOutputs)
      .innerJoin(skins, eq(contractOutputs.skinId, skins.id))
      .where(eq(contractOutputs.contractId, id));

    const mapSkin = (s: typeof skins.$inferSelect): SkinPrice => ({
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
    });

    const contract: TradeUpContract = {
      id: row.id,
      inputs: inputRows.map((r) => mapSkin(r.skin)),
      outputs: outputRows.map((r) => ({
        skin: mapSkin(r.skin),
        probability: r.output.probability,
        float_range: { min: r.output.floatMin, max: r.output.floatMax },
        expected_wear: r.output.expectedWear as Wear,
      })),
      input_cost: row.inputCost,
      expected_value: row.expectedValue,
      profit: row.profit,
      roi: row.roi,
      risk_level: row.riskLevel as RiskLevel,
      input_rarity: row.inputRarity as Rarity,
      output_rarity: row.outputRarity as Rarity,
      avg_float: row.avgFloat,
      output_float_range: { min: row.outputFloatMin, max: row.outputFloatMax },
      collections: JSON.parse(row.collections),
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      volume_score: row.volumeScore,
      confidence: row.confidence,
    };

    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db
      .delete(contracts)
      .where(and(eq(contracts.id, id), eq(contracts.userId, session.user.id)));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
