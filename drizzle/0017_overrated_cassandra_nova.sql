CREATE TABLE `propertyModerationSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`riskLevel` enum('none','low','medium','high') NOT NULL DEFAULT 'none',
	`categories` json NOT NULL,
	`summary` varchar(600) NOT NULL,
	`confidence` int NOT NULL,
	`model` varchar(96) NOT NULL,
	`inputFingerprint` varchar(64) NOT NULL,
	`analyzedByUserId` int NOT NULL,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyModerationSignals_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyModerationSignals_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE INDEX `moderation_signal_level_updated_idx` ON `propertyModerationSignals` (`riskLevel`,`updatedAt`);