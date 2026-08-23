CREATE TABLE `planningAssumptionTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` varchar(400),
	`kind` enum('roi','rental_yield','construction','development') NOT NULL,
	`inputs` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planningAssumptionTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformModuleSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleKey` enum('planning') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformModuleSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformModuleSettings_moduleKey_unique` UNIQUE(`moduleKey`)
);
--> statement-breakpoint
CREATE INDEX `planning_template_kind_active_idx` ON `planningAssumptionTemplates` (`kind`,`active`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `planning_template_creator_idx` ON `planningAssumptionTemplates` (`createdByUserId`,`createdAt`);