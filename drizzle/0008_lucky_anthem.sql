CREATE TABLE `planningAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int,
	`kind` enum('roi','rental_yield','construction','development') NOT NULL,
	`name` varchar(160) NOT NULL,
	`inputs` json NOT NULL,
	`results` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planningAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `planning_user_created_idx` ON `planningAnalyses` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `planning_property_idx` ON `planningAnalyses` (`propertyId`);