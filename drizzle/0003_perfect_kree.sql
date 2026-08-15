CREATE TABLE `agencyProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agencyName` varchar(255) NOT NULL,
	`logoUrl` text,
	`bannerUrl` text,
	`description` text,
	`website` varchar(512),
	`socialMedia` json,
	`verified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencyProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featuredListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`userId` int NOT NULL,
	`paymentId` int,
	`featuredUntil` timestamp NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featuredListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int,
	`propertyId` int,
	`amount` double NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`method` enum('mpesa','card','bank_transfer','free') NOT NULL DEFAULT 'free',
	`reference` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`type` enum('subscription','featured_listing','video_upload') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`url` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`thumbnailUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`price` double NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KES',
	`period` enum('monthly','annual') NOT NULL,
	`maxImages` int DEFAULT 5,
	`maxVideos` int DEFAULT 0,
	`featured` boolean DEFAULT false,
	`prioritySearch` boolean DEFAULT false,
	`aiDescriptions` boolean DEFAULT false,
	`aiPriceRecommendations` boolean DEFAULT false,
	`leadManagement` boolean DEFAULT false,
	`verifiedBadge` boolean DEFAULT false,
	`agencyBranding` boolean DEFAULT false,
	`socialSharing` boolean DEFAULT false,
	`prioritySupport` boolean DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`autoRenew` boolean DEFAULT true,
	`lastPaymentDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
