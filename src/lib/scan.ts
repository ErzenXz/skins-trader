import { db } from "@/lib/db";
import {
  alerts,
  alertConfigs,
  contractInputs,
  contractOutputs,
  contracts,
  scanHistory,
  skins,
} from "@/lib/db/schema";
import { buildTradeUpContract, scoreOpportunity } from "@/lib/engine";
import { generateId } from "@/lib/id";
import { asc, eq, inArray } from "drizzle-orm";
import type { Rarity, ScanResult, SkinPrice, TradeUpContract, Wear } from "@/lib/types";

const SCANNABLE_RARITIES: Rarity[] = [
  "Consumer",
  "Industrial",
  "Mil-Spec",
  "Restricted",
  "Classified",
];

function mapSkin(row: typeof skins.$inferSelect): SkinPrice {
  return {
    id: row.id,
    market_hash_name: row.marketHashName,
    name: row.name,
    collection: row.collection,
    rarity: row.rarity as Rarity,
    price: row.price,
    volume: row.volume,
    median_price: row.medianPrice,
    float_min: row.floatMin,
    float_max: row.floatMax,
    wear: row.wear as Wear,
    image_url: row.imageUrl || "",
    updated_at: row.updatedAt,
    price_trend: row.priceTrend,
    stattrak: row.stattrak,
  };
}

interface ScanOptions {
  rarity?: string;
  minROI?: number;
  maxCost?: number;
  maxContracts?: number;
}

export async function runScanForUser(
  userId: string,
  options?: ScanOptions
): Promise<ScanResult> {
  const maxContracts = options?.maxContracts ?? 25;

  const skinRows = await db.select().from(skins).orderBy(asc(skins.price));
  const allSkins = skinRows.map(mapSkin);

  if (allSkins.length < 10) {
    const emptyResult: ScanResult = {
      totalScanned: 0,
      contractsGenerated: 0,
      profitableFound: 0,
      bestRoi: 0,
    };

    await db.insert(scanHistory).values({
      id: generateId("scan_"),
      userId,
      totalScanned: 0,
      profitableFound: 0,
      bestRoi: 0,
      completedAt: new Date(),
    });

    return emptyResult;
  }

  const candidates: TradeUpContract[] = [];
  let totalScanned = 0;

  for (const rarity of SCANNABLE_RARITIES) {
    if (options?.rarity && options.rarity !== "all" && options.rarity !== rarity) {
      continue;
    }

    const inputsForRarity = allSkins
      .filter((s) => s.rarity === rarity)
      .sort((a, b) => a.price - b.price);

    if (inputsForRarity.length < 10) continue;

    const maxWindowStart = Math.min(inputsForRarity.length - 10, 60);

    for (let start = 0; start <= maxWindowStart; start++) {
      const inputSet = inputsForRarity.slice(start, start + 10);
      totalScanned += 1;

      const contract = buildTradeUpContract(inputSet, allSkins);
      if (!contract) continue;

      if (options?.maxCost !== undefined && contract.input_cost > options.maxCost) {
        continue;
      }

      if (options?.minROI !== undefined && contract.roi * 100 < options.minROI) {
        continue;
      }

      candidates.push(contract);
    }
  }

  const topContracts = candidates
    .sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a))
    .slice(0, maxContracts);

  const previousContracts = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.userId, userId));

  const previousIds = previousContracts.map((c) => c.id);
  if (previousIds.length > 0) {
    await db.delete(contractInputs).where(inArray(contractInputs.contractId, previousIds));
    await db.delete(contractOutputs).where(inArray(contractOutputs.contractId, previousIds));
    await db.delete(contracts).where(inArray(contracts.id, previousIds));
  }

  const now = new Date();

  for (const contract of topContracts) {
    const contractId = generateId("c_");

    await db.insert(contracts).values({
      id: contractId,
      userId,
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

    for (let i = 0; i < contract.inputs.length; i++) {
      await db.insert(contractInputs).values({
        id: generateId("ci_"),
        contractId,
        skinId: contract.inputs[i].id,
        slotIndex: i,
      });
    }

    for (const output of contract.outputs) {
      await db.insert(contractOutputs).values({
        id: generateId("co_"),
        contractId,
        skinId: output.skin.id,
        probability: output.probability,
        floatMin: output.float_range.min,
        floatMax: output.float_range.max,
        expectedWear: output.expected_wear,
      });
    }
  }

  const profitableFound = topContracts.filter((c) => c.profit > 0).length;
  const bestRoi = topContracts.length > 0 ? Math.max(...topContracts.map((c) => c.roi)) : 0;

  await db.insert(scanHistory).values({
    id: generateId("scan_"),
    userId,
    totalScanned,
    profitableFound,
    bestRoi,
    completedAt: now,
  });

  const configs = await db
    .select()
    .from(alertConfigs)
    .where(eq(alertConfigs.userId, userId));

  const profitableCfg = configs.find((c) => c.enabled && c.type === "profitable");
  if (profitableCfg && profitableFound > 0) {
    await db.insert(alerts).values({
      id: generateId("a_"),
      userId,
      type: "profitable",
      title: "New profitable contracts found",
      message: `Found ${profitableFound} profitable trade-up opportunities in the latest scan.`,
      severity: "success",
      read: false,
      createdAt: now,
    });
  }

  const highRoiCfg = configs.find((c) => c.enabled && c.type === "high_roi");
  const highRoiThreshold = highRoiCfg?.threshold ?? 1;
  const highRoiCount = topContracts.filter((c) => c.roi >= highRoiThreshold).length;

  if (highRoiCfg && highRoiCount > 0) {
    await db.insert(alerts).values({
      id: generateId("a_"),
      userId,
      type: "high_roi",
      title: "High ROI spike detected",
      message: `${highRoiCount} contracts are above ${(highRoiThreshold * 100).toFixed(0)}% ROI.`,
      severity: "warning",
      read: false,
      createdAt: now,
    });
  }

  return {
    totalScanned,
    contractsGenerated: topContracts.length,
    profitableFound,
    bestRoi,
  };
}
