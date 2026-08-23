CREATE TABLE `propertyTenantAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`tenantUserId` int,
	`invitationCode` varchar(32) NOT NULL,
	`status` enum('pending','active','ended','revoked') NOT NULL DEFAULT 'pending',
	`unitLabel` varchar(120),
	`expiresAt` timestamp,
	`acceptedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyTenantAssignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyTenantAssignments_invitationCode_unique` UNIQUE(`invitationCode`)
);
--> statement-breakpoint
ALTER TABLE `propertyOperationRecords` ADD `tenantUserId` int;--> statement-breakpoint
CREATE INDEX `tenant_assignment_owner_property_idx` ON `propertyTenantAssignments` (`ownerUserId`,`propertyId`);--> statement-breakpoint
CREATE INDEX `tenant_assignment_tenant_status_idx` ON `propertyTenantAssignments` (`tenantUserId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_assignment_property_status_idx` ON `propertyTenantAssignments` (`propertyId`,`status`);--> statement-breakpoint
CREATE INDEX `operation_tenant_status_idx` ON `propertyOperationRecords` (`tenantUserId`,`status`);