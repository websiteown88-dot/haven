CREATE TABLE `analytics_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`kind` text NOT NULL,
	`target` text NOT NULL,
	`seconds` integer DEFAULT 0 NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`device` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_created_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_session_idx` ON `analytics_events` (`session`);