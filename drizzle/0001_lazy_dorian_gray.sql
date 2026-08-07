CREATE TABLE `designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareToken` varchar(16) NOT NULL,
	`userId` int,
	`stateJson` json NOT NULL,
	`thumbnailDataUrl` text,
	`name` varchar(255) DEFAULT 'Untitled Stamp',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designs_id` PRIMARY KEY(`id`),
	CONSTRAINT `designs_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `icons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`svgContent` text NOT NULL,
	`tags` varchar(512) DEFAULT '',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `icons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeSessionId` varchar(128),
	`stripePaymentIntentId` varchar(128),
	`designId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`plan` enum('promo','econom','premium','vip') NOT NULL,
	`status` enum('pending','paid','fulfilled','failed') NOT NULL DEFAULT 'pending',
	`effects` varchar(64) DEFAULT '',
	`downloadLinks` json,
	`amountCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`stateJson` json NOT NULL,
	`thumbnailSvg` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
