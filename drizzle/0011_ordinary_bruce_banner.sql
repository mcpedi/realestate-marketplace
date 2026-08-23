CREATE TABLE `agentContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`inquiryId` int,
	`propertyId` int,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(48),
	`stage` enum('new','contacted','qualified','viewing','negotiating','won','lost') NOT NULL DEFAULT 'new',
	`source` enum('marketplace','inquiry','manual','referral') NOT NULL DEFAULT 'manual',
	`notes` text,
	`nextFollowUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`agentUserId` int NOT NULL,
	`type` enum('note','call','email','whatsapp','viewing','stage_change') NOT NULL DEFAULT 'note',
	`body` text NOT NULL,
	`fromStage` varchar(32),
	`toStage` varchar(32),
	`activityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listingTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('sale','rent','general') NOT NULL DEFAULT 'general',
	`templateData` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`stage` enum('intake','listing','viewing','offer','negotiation','contract','completed','cancelled') NOT NULL DEFAULT 'intake',
	`status` enum('active','on_hold','completed','cancelled') NOT NULL DEFAULT 'active',
	`counterpartyName` varchar(160),
	`counterpartyContact` varchar(160),
	`amount` decimal(14,2),
	`notes` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_contact_owner_stage_idx` ON `agentContacts` (`ownerUserId`,`stage`);--> statement-breakpoint
CREATE INDEX `agent_contact_owner_followup_idx` ON `agentContacts` (`ownerUserId`,`nextFollowUpAt`);--> statement-breakpoint
CREATE INDEX `agent_contact_inquiry_idx` ON `agentContacts` (`inquiryId`);--> statement-breakpoint
CREATE INDEX `lead_activity_contact_idx` ON `leadActivities` (`contactId`,`activityAt`);--> statement-breakpoint
CREATE INDEX `lead_activity_agent_idx` ON `leadActivities` (`agentUserId`,`activityAt`);--> statement-breakpoint
CREATE INDEX `listing_template_owner_active_idx` ON `listingTemplates` (`ownerUserId`,`active`);--> statement-breakpoint
CREATE INDEX `property_transaction_owner_stage_idx` ON `propertyTransactions` (`ownerUserId`,`stage`);--> statement-breakpoint
CREATE INDEX `property_transaction_property_idx` ON `propertyTransactions` (`propertyId`,`createdAt`);