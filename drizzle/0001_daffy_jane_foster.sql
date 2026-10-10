ALTER TABLE `analytics_events` ADD `seq` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `version` integer DEFAULT 1 NOT NULL;