CREATE TABLE `propertyIdentifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`identifier` varchar(48) NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyIdentifiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyIdentifiers_propertyId_unique` UNIQUE(`propertyId`),
	CONSTRAINT `propertyIdentifiers_identifier_unique` UNIQUE(`identifier`)
);
--> statement-breakpoint
CREATE TABLE `wishlistCollectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`propertyId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlistCollectionItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_collection_property_unique` UNIQUE(`collectionId`,`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `wishlistCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(280),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wishlistCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `property_identifier_creator_idx` ON `propertyIdentifiers` (`createdByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `wishlist_item_property_idx` ON `wishlistCollectionItems` (`propertyId`);--> statement-breakpoint
CREATE INDEX `wishlist_collection_owner_updated_idx` ON `wishlistCollections` (`ownerUserId`,`updatedAt`);