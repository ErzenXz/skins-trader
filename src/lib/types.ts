// ============================================
// TradeUp Hunter — Core Types
// ============================================

export type Rarity =
  | "Consumer"
  | "Industrial"
  | "Mil-Spec"
  | "Restricted"
  | "Classified"
  | "Covert";

export type Wear =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

export type RiskLevel = "low" | "medium" | "high";

export interface SkinPrice {
  id: string;
  market_hash_name: string;
  name: string;
  collection: string;
  rarity: Rarity;
  price: number;
  volume: number;
  median_price: number;
  float_min: number;
  float_max: number;
  wear: Wear;
  image_url: string;
  updated_at: Date;
  price_trend: number; // % change last 24h
  stattrak: boolean;
}

export interface PossibleOutcome {
  skin: SkinPrice;
  probability: number;
  float_range: { min: number; max: number };
  expected_wear: Wear;
}

export interface TradeUpContract {
  id: string;
  inputs: SkinPrice[];
  outputs: PossibleOutcome[];
  input_cost: number;
  expected_value: number;
  profit: number;
  roi: number;
  risk_level: RiskLevel;
  input_rarity: Rarity;
  output_rarity: Rarity;
  avg_float: number;
  output_float_range: { min: number; max: number };
  collections: string[];
  created_at: Date;
  updated_at: Date;
  volume_score: number; // 0-100, how liquid the contract is
  confidence: number; // 0-100
}

export interface AlertConfig {
  id: string;
  type: "profitable" | "high_roi" | "float_opportunity" | "price_drop";
  label: string;
  enabled: boolean;
  threshold?: number;
  delivery: ("web" | "email" | "discord")[];
}

export interface Alert {
  id: string;
  type: AlertConfig["type"];
  title: string;
  message: string;
  contract_id?: string;
  severity: "info" | "success" | "warning";
  read: boolean;
  created_at: Date;
}

export interface DashboardStats {
  total_scanned: number;
  profitable_count: number;
  avg_roi: number;
  best_roi: number;
  total_potential_profit: number;
  last_scan: Date;
  active_alerts: number;
}

export interface FilterState {
  rarity: Rarity | "all";
  max_cost: number;
  min_roi: number;
  collection: string;
  wear_target: Wear | "all";
  sort_by: "roi" | "profit" | "confidence" | "cost" | "updated";
  sort_order: "asc" | "desc";
  search: string;
}

export interface PriceHistory {
  date: string;
  price: number;
  volume: number;
}
