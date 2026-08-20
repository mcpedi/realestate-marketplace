CREATE TABLE `propertyActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int NOT NULL,
	`eventType` enum('view','save','search') NOT NULL,
	`keywords` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('instant','priceDrop') NOT NULL,
	`criteria` json,
	`propertyId` int,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`score` int NOT NULL,
	`valueScore` int NOT NULL,
	`locationScore` int NOT NULL,
	`amenitiesScore` int NOT NULL,
	`accessibilityScore` int NOT NULL,
	`breakdown` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyScores_propertyId_unique` UNIQUE(`propertyId`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`budgetMin` double,
	`budgetMax` double,
	`preferredLocations` json,
	`preferredTypes` json,
	`minBedrooms` int DEFAULT 0,
	`listingType` enum('sale','rent','any') DEFAULT 'any',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viewingBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`buyerId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`type` enum('virtual','physical') NOT NULL,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewingBookings_id` PRIMARY KEY(`id`)
);
