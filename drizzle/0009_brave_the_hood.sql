CREATE TABLE `moduleAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` int NOT NULL,
	`propertyId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moduleAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyDocumentAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`permission` enum('view','download') NOT NULL DEFAULT 'view',
	`grantedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyDocumentAccess_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('ownership','lease','sale','receipt','inspection','certificate','other') NOT NULL DEFAULT 'other',
	`fileKey` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `module_audit_resource_idx` ON `moduleAuditLogs` (`resourceType`,`resourceId`);--> statement-breakpoint
CREATE INDEX `module_audit_property_idx` ON `moduleAuditLogs` (`propertyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `module_audit_actor_idx` ON `moduleAuditLogs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `document_access_document_idx` ON `propertyDocumentAccess` (`documentId`);--> statement-breakpoint
CREATE INDEX `document_access_user_idx` ON `propertyDocumentAccess` (`userId`);--> statement-breakpoint
CREATE INDEX `property_document_property_idx` ON `propertyDocuments` (`propertyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `property_document_uploader_idx` ON `propertyDocuments` (`uploadedByUserId`,`createdAt`);