ALTER TABLE `templates` ADD `nameDE` varchar(255);--> statement-breakpoint
ALTER TABLE `templates` ADD `slug` varchar(128);--> statement-breakpoint
ALTER TABLE `templates` ADD `shape` varchar(32) DEFAULT 'round';--> statement-breakpoint
ALTER TABLE `templates` ADD `searchTerms` text;