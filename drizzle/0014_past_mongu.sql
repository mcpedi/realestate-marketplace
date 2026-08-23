CREATE TABLE `propertyShareRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`propertyIdentifierId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyShareRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyShareRecords_propertyId_unique` UNIQUE(`propertyId`),
	CONSTRAINT `propertyShareRecords_propertyIdentifierId_unique` UNIQUE(`propertyIdentifierId`)
);
--> statement-breakpoint
CREATE INDEX `property_share_enabled_idx` ON `propertyShareRecords` (`enabled`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `property_share_creator_idx` ON `propertyShareRecords` (`createdByUserId`,`createdAt`);