import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================
// Better Auth Tables
// ============================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  steamApiKey: text("steam_api_key"),
  rateLimit: integer("rate_limit").notNull().default(20),
  cacheEnabled: integer("cache_enabled", { mode: "boolean" }).notNull().default(true),
  cacheTTL: integer("cache_ttl").notNull().default(300),
  autoRefresh: integer("auto_refresh", { mode: "boolean" }).notNull().default(true),
  refreshInterval: integer("refresh_interval").notNull().default(60),
  notifications: integer("notifications", { mode: "boolean" }).notNull().default(true),
  currency: text("currency").notNull().default("USD"),
  autoScan: integer("auto_scan", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// App Tables
// ============================================

export const skins = sqliteTable("skins", {
  id: text("id").primaryKey(),
  marketHashName: text("market_hash_name").notNull(),
  name: text("name").notNull(),
  collection: text("collection").notNull(),
  rarity: text("rarity").notNull(), // Consumer | Industrial | Mil-Spec | Restricted | Classified | Covert
  price: real("price").notNull().default(0),
  volume: integer("volume").notNull().default(0),
  medianPrice: real("median_price").notNull().default(0),
  floatMin: real("float_min").notNull().default(0),
  floatMax: real("float_max").notNull().default(1),
  wear: text("wear").notNull(), // Factory New | Minimal Wear | Field-Tested | Well-Worn | Battle-Scarred
  imageUrl: text("image_url").default(""),
  priceTrend: real("price_trend").notNull().default(0),
  stattrak: integer("stattrak", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  inputCost: real("input_cost").notNull(),
  expectedValue: real("expected_value").notNull(),
  profit: real("profit").notNull(),
  roi: real("roi").notNull(),
  riskLevel: text("risk_level").notNull(), // low | medium | high
  inputRarity: text("input_rarity").notNull(),
  outputRarity: text("output_rarity").notNull(),
  avgFloat: real("avg_float").notNull(),
  outputFloatMin: real("output_float_min").notNull(),
  outputFloatMax: real("output_float_max").notNull(),
  collections: text("collections").notNull(), // JSON array
  volumeScore: integer("volume_score").notNull().default(0),
  confidence: integer("confidence").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const contractInputs = sqliteTable("contract_inputs", {
  id: text("id").primaryKey(),
  contractId: text("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  skinId: text("skin_id").notNull().references(() => skins.id),
  slotIndex: integer("slot_index").notNull(), // 0-9
});

export const contractOutputs = sqliteTable("contract_outputs", {
  id: text("id").primaryKey(),
  contractId: text("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  skinId: text("skin_id").notNull().references(() => skins.id),
  probability: real("probability").notNull(),
  floatMin: real("float_min").notNull(),
  floatMax: real("float_max").notNull(),
  expectedWear: text("expected_wear").notNull(),
});

export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // profitable | high_roi | float_opportunity | price_drop
  title: text("title").notNull(),
  message: text("message").notNull(),
  contractId: text("contract_id"),
  severity: text("severity").notNull().default("info"), // info | success | warning
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const alertConfigs = sqliteTable("alert_configs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  threshold: real("threshold"),
  delivery: text("delivery").notNull().default('["web"]'), // JSON array
});

export const priceHistory = sqliteTable("price_history", {
  id: text("id").primaryKey(),
  skinId: text("skin_id").notNull().references(() => skins.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  volume: integer("volume").notNull().default(0),
  date: text("date").notNull(), // YYYY-MM-DD
});

export const scanHistory = sqliteTable("scan_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  totalScanned: integer("total_scanned").notNull().default(0),
  profitableFound: integer("profitable_found").notNull().default(0),
  bestRoi: real("best_roi").notNull().default(0),
  completedAt: integer("completed_at", { mode: "timestamp" }).notNull(),
});
