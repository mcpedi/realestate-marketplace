CREATE TABLE `propertyOperationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`type` enum('lease','inspection','maintenance','rent','vacancy') NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` varchar(64) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`participantName` varchar(160),
	`participantContact` varchar(160),
	`amount` decimal(14,2),
	`dueDate` timestamp,
	`completedAt` timestamp,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyOperationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `operation_property_type_idx` ON `propertyOperationRecords` (`propertyId`,`type`);--> statement-breakpoint
CREATE INDEX `operation_owner_status_idx` ON `propertyOperationRecords` (`ownerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `operation_due_date_idx` ON `propertyOperationRecords` (`dueDate`);