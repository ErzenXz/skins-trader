CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`steam_api_key` text,
	`rate_limit` integer DEFAULT 20 NOT NULL,
	`cache_enabled` integer DEFAULT true NOT NULL,
	`cache_ttl` integer DEFAULT 300 NOT NULL,
	`auto_refresh` integer DEFAULT true NOT NULL,
	`refresh_interval` integer DEFAULT 60 NOT NULL,
	`notifications` integer DEFAULT true NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`auto_scan` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);