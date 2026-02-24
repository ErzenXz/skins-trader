// ============================================
// TradeUp Hunter — Trade-Up Calculation Engine
// ============================================

import type {
  SkinPrice,
  PossibleOutcome,
  TradeUpContract,
  Rarity,
  RiskLevel,
  Wear,
} from "./types";

const RARITY_ORDER: Rarity[] = [
  "Consumer",
  "Industrial",
  "Mil-Spec",
  "Restricted",
  "Classified",
  "Covert",
];

const WEAR_RANGES: Record<Wear, { min: number; max: number }> = {
  "Factory New": { min: 0.0, max: 0.07 },
  "Minimal Wear": { min: 0.07, max: 0.15 },
  "Field-Tested": { min: 0.15, max: 0.38 },
  "Well-Worn": { min: 0.38, max: 0.45 },
  "Battle-Scarred": { min: 0.45, max: 1.0 },
};

export function getNextRarity(rarity: Rarity): Rarity | null {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx === -1 || idx >= RARITY_ORDER.length - 1) return null;
  return RARITY_ORDER[idx + 1];
}

export function getWearFromFloat(float: number): Wear {
  if (float <= 0.07) return "Factory New";
  if (float <= 0.15) return "Minimal Wear";
  if (float <= 0.38) return "Field-Tested";
  if (float <= 0.45) return "Well-Worn";
  return "Battle-Scarred";
}

/**
 * Compute the output float range based on input floats and output skin's float bounds.
 * Formula: output_float = (avg_input_float) * (output_max - output_min) + output_min
 */
export function computeOutputFloat(
  avgInputFloat: number,
  outputMinFloat: number,
  outputMaxFloat: number
): { min: number; max: number; expected: number } {
  const expected =
    avgInputFloat * (outputMaxFloat - outputMinFloat) + outputMinFloat;
  // Range accounts for ±5% variance
  const variance = (outputMaxFloat - outputMinFloat) * 0.05;
  return {
    min: Math.max(outputMinFloat, expected - variance),
    max: Math.min(outputMaxFloat, expected + variance),
    expected: Math.min(outputMaxFloat, Math.max(outputMinFloat, expected)),
  };
}

/**
 * Calculate EV = Σ(probability_i × price_i)
 */
export function calculateEV(outcomes: PossibleOutcome[]): number {
  return outcomes.reduce((sum, o) => sum + o.probability * o.skin.price, 0);
}

/**
 * Compute risk level based on outcome distribution and ROI
 */
export function computeRiskLevel(
  outcomes: PossibleOutcome[],
  roi: number
): RiskLevel {
  const maxProb = Math.max(...outcomes.map((o) => o.probability));
  const outcomeCount = outcomes.length;

  if (outcomeCount <= 2 && roi > 0.1 && maxProb > 0.5) return "low";
  if (outcomeCount <= 4 && roi > 0.05) return "medium";
  return "high";
}

/**
 * Compute confidence score (0-100) based on volume, price stability, data freshness
 */
export function computeConfidence(
  inputs: SkinPrice[],
  outputs: PossibleOutcome[]
): number {
  // Volume score (avg volume of inputs)
  const avgVolume =
    inputs.reduce((s, i) => s + i.volume, 0) / inputs.length;
  const volumeScore = Math.min(40, (avgVolume / 100) * 40);

  // Price stability (low trend = stable)
  const avgTrend =
    inputs.reduce((s, i) => s + Math.abs(i.price_trend), 0) / inputs.length;
  const stabilityScore = Math.max(0, 30 - avgTrend * 3);

  // Output diversity (fewer outputs = more predictable)
  const diversityScore = Math.max(0, 30 - outputs.length * 5);

  return Math.round(
    Math.min(100, volumeScore + stabilityScore + diversityScore)
  );
}

/**
 * Build a full trade-up contract from 10 input skins and a pool of possible outputs
 */
export function buildTradeUpContract(
  inputs: SkinPrice[],
  outputPool: SkinPrice[]
): TradeUpContract | null {
  if (inputs.length !== 10) return null;

  const inputRarity = inputs[0].rarity;
  const outputRarity = getNextRarity(inputRarity);
  if (!outputRarity) return null;

  // Calculate input cost
  const input_cost = inputs.reduce((sum, s) => sum + s.price, 0);

  // Calculate average float
  const avg_float =
    inputs.reduce(
      (sum, s) => sum + (s.float_min + s.float_max) / 2,
      0
    ) / inputs.length;

  // Determine collections used
  const collectionCounts = new Map<string, number>();
  inputs.forEach((s) => {
    collectionCounts.set(
      s.collection,
      (collectionCounts.get(s.collection) || 0) + 1
    );
  });

  // Build outcomes: each collection contributes proportionally
  const outcomes: PossibleOutcome[] = [];
  const collections = Array.from(collectionCounts.entries());

  for (const [collection, count] of collections) {
    const probability = count / 10;
    const collectionOutputs = outputPool.filter(
      (s) => s.collection === collection && s.rarity === outputRarity
    );

    for (const output of collectionOutputs) {
      const floatData = computeOutputFloat(
        avg_float,
        output.float_min,
        output.float_max
      );
      outcomes.push({
        skin: output,
        probability: probability / Math.max(1, collectionOutputs.length),
        float_range: { min: floatData.min, max: floatData.max },
        expected_wear: getWearFromFloat(floatData.expected),
      });
    }
  }

  if (outcomes.length === 0) return null;

  const expected_value = calculateEV(outcomes);
  const profit = expected_value - input_cost;
  const roi = input_cost > 0 ? profit / input_cost : 0;
  const risk_level = computeRiskLevel(outcomes, roi);
  const confidence = computeConfidence(inputs, outcomes);

  const outputFloats = outcomes.map((o) => o.float_range);
  const output_float_range = {
    min: Math.min(...outputFloats.map((f) => f.min)),
    max: Math.max(...outputFloats.map((f) => f.max)),
  };

  const volume_score = Math.min(
    100,
    Math.round(
      inputs.reduce((s, i) => s + i.volume, 0) / inputs.length
    )
  );

  return {
    id: `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inputs,
    outputs: outcomes,
    input_cost,
    expected_value,
    profit,
    roi,
    risk_level,
    input_rarity: inputRarity,
    output_rarity: outputRarity,
    avg_float,
    output_float_range,
    collections: Array.from(collectionCounts.keys()),
    created_at: new Date(),
    updated_at: new Date(),
    volume_score,
    confidence,
  };
}

/**
 * Find cheapest skins by collection and rarity for trade-up inputs
 */
export function findCheapestInputs(
  skins: SkinPrice[],
  rarity: Rarity,
  collection?: string,
  maxFloat?: number
): SkinPrice[] {
  let filtered = skins.filter((s) => s.rarity === rarity);
  if (collection) filtered = filtered.filter((s) => s.collection === collection);
  if (maxFloat !== undefined)
    filtered = filtered.filter(
      (s) => (s.float_min + s.float_max) / 2 <= maxFloat
    );

  return filtered.sort((a, b) => a.price - b.price);
}

/**
 * Score a trade-up opportunity for ranking
 */
export function scoreOpportunity(contract: TradeUpContract): number {
  // Weighted scoring: ROI (40%), confidence (30%), volume (20%), recency (10%)
  const roiScore = Math.min(1, Math.max(0, contract.roi + 0.5)) * 40;
  const confScore = (contract.confidence / 100) * 30;
  const volScore = (contract.volume_score / 100) * 20;
  const age =
    (Date.now() - contract.updated_at.getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 10 - age * 0.5);

  return roiScore + confScore + volScore + recencyScore;
}
