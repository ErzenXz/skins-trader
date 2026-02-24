import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractInputs, contractOutputs, skins } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-server";
import { generateId } from "@/lib/id";
import type { TradeUpContract, SkinPrice, PossibleOutcome, Wear, Rarity, RiskLevel } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const rarity = url.searchParams.get("rarity");
    const minRoi = url.searchParams.get("min_roi");
    const maxCost = url.searchParams.get("max_cost");

    // Get contracts for user
    const rows = await db
      .select()
      .from(contracts)
      .where(eq(contracts.userId, session.user.id))
      .orderBy(desc(contracts.roi));

    // Hydrate each contract with inputs and outputs
    const result: TradeUpContract[] = [];

    for (const row of rows) {
      // Filter by params
      if (rarity && rarity !== "all" && row.inputRarity !== rarity) continue;
      if (minRoi && row.roi < parseFloat(minRoi) / 100) continue;
      if (maxCost && row.inputCost > parseFloat(maxCost)) continue;

      // Get inputs
      const inputRows = await db
        .select({
          input: contractInputs,
          skin: skins,
        })
        .from(contractInputs)
        .innerJoin(skins, eq(contractInputs.skinId, skins.id))
        .where(eq(contractInputs.contractId, row.id))
        .orderBy(contractInputs.slotIndex);

      // Get outputs
      const outputRows = await db
        .select({
          output: contractOutputs,
          skin: skins,
        })
        .from(contractOutputs)
        .innerJoin(skins, eq(contractOutputs.skinId, skins.id))
        .where(eq(contractOutputs.contractId, row.id));

      const inputSkins: SkinPrice[] = inputRows.map((r) => ({
        id: r.skin.id,
        market_hash_name: r.skin.marketHashName,
        name: r.skin.name,
        collection: r.skin.collection,
        rarity: r.skin.rarity as Rarity,
        price: r.skin.price,
        volume: r.skin.volume,
        median_price: r.skin.medianPrice,
        float_min: r.skin.floatMin,
        float_max: r.skin.floatMax,
        wear: r.skin.wear as Wear,
        image_url: r.skin.imageUrl || "",
        updated_at: r.skin.updatedAt,
        price_trend: r.skin.priceTrend,
        stattrak: r.skin.stattrak,
      }));

      const outputOutcomes: PossibleOutcome[] = outputRows.map((r) => ({
        skin: {
          id: r.skin.id,
          market_hash_name: r.skin.marketHashName,
          name: r.skin.name,
          collection: r.skin.collection,
          rarity: r.skin.rarity as Rarity,
          price: r.skin.price,
          volume: r.skin.volume,
          median_price: r.skin.medianPrice,
          float_min: r.skin.floatMin,
          float_max: r.skin.floatMax,
          wear: r.skin.wear as Wear,
          image_url: r.skin.imageUrl || "",
          updated_at: r.skin.updatedAt,
          price_trend: r.skin.priceTrend,
          stattrak: r.skin.stattrak,
        },
        probability: r.output.probability,
        float_range: { min: r.output.floatMin, max: r.output.floatMax },
        expected_wear: r.output.expectedWear as Wear,
      }));

      result.push({
        id: row.id,
        inputs: inputSkins,
        outputs: outputOutcomes,
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
      });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const contract = body as TradeUpContract;

    const id = generateId("c_");
    const now = new Date();

    // Insert contract
    await db.insert(contracts).values({
      id,
      userId: session.user.id,
      inputCost: contract.input_cost,
      expectedValue: contract.expected_value,
      profit: contract.profit,
      roi: contract.roi,
      riskLevel: contract.risk_level,
      inputRarity: contract.input_rarity,
      outputRarity: contract.output_rarity,
      avgFloat: contract.avg_float,
      outputFloatMin: contract.output_float_range.min,
      outputFloatMax: contract.output_float_range.max,
      collections: JSON.stringify(contract.collections),
      volumeScore: contract.volume_score,
      confidence: contract.confidence,
      createdAt: now,
      updatedAt: now,
    });

    // Insert inputs
    for (let i = 0; i < contract.inputs.length; i++) {
      await db.insert(contractInputs).values({
        id: generateId("ci_"),
        contractId: id,
        skinId: contract.inputs[i].id,
        slotIndex: i,
      });
    }

    // Insert outputs
    for (const output of contract.outputs) {
      await db.insert(contractOutputs).values({
        id: generateId("co_"),
        contractId: id,
        skinId: output.skin.id,
        probability: output.probability,
        floatMin: output.float_range.min,
        floatMax: output.float_range.max,
        expectedWear: output.expected_wear,
      });
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
