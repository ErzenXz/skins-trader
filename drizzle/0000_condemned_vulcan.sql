CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `alert_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`label` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`threshold` real,
	`delivery` text DEFAULT '["web"]' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`contract_id` text,
	`severity` text DEFAULT 'info' NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contract_inputs` (
	`id` text PRIMARY KEY NOT NULL,
	`contract_id` text NOT NULL,
	`skin_id` text NOT NULL,
	`slot_index` integer NOT NULL,
	FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skin_id`) REFERENCES `skins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contract_outputs` (
	`id` text PRIMARY KEY NOT NULL,
	`contract_id` text NOT NULL,
	`skin_id` text NOT NULL,
	`probability` real NOT NULL,
	`float_min` real NOT NULL,
	`float_max` real NOT NULL,
	`expected_wear` text NOT NULL,
	FOREIGN KEY (`contract_id`) REFERENCES `contracts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skin_id`) REFERENCES `skins`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`input_cost` real NOT NULL,
	`expected_value` real NOT NULL,
	`profit` real NOT NULL,
	`roi` real NOT NULL,
	`risk_level` text NOT NULL,
	`input_rarity` text NOT NULL,
	`output_rarity` text NOT NULL,
	`avg_float` real NOT NULL,
	`output_float_min` real NOT NULL,
	`output_float_max` real NOT NULL,
	`collections` text NOT NULL,
	`volume_score` integer DEFAULT 0 NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` text PRIMARY KEY NOT NULL,
	`skin_id` text NOT NULL,
	`price` real NOT NULL,
	`volume` integer DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`skin_id`) REFERENCES `skins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scan_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total_scanned` integer DEFAULT 0 NOT NULL,
	`profitable_found` integer DEFAULT 0 NOT NULL,
	`best_roi` real DEFAULT 0 NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `skins` (
	`id` text PRIMARY KEY NOT NULL,
	`market_hash_name` text NOT NULL,
	`name` text NOT NULL,
	`collection` text NOT NULL,
	`rarity` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`volume` integer DEFAULT 0 NOT NULL,
	`median_price` real DEFAULT 0 NOT NULL,
	`float_min` real DEFAULT 0 NOT NULL,
	`float_max` real DEFAULT 1 NOT NULL,
	`wear` text NOT NULL,
	`image_url` text DEFAULT '',
	`price_trend` real DEFAULT 0 NOT NULL,
	`stattrak` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
