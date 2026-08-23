CREATE TABLE `referralClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralProfileId` int NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`status` enum('pending','qualified','rewarded','rejected') NOT NULL DEFAULT 'pending',
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralClaims_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralClaims_referredUserId_unique` UNIQUE(`referredUserId`)
);
--> statement-breakpoint
CREATE TABLE `referralProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(32) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralProfiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `referralProfiles_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `rewardLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralClaimId` int,
	`points` int NOT NULL,
	`type` enum('referral','admin_adjustment','redemption','reversal') NOT NULL,
	`status` enum('pending','earned','spent','reversed') NOT NULL DEFAULT 'pending',
	`note` varchar(280),
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rewardLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `referral_claim_referrer_status_idx` ON `referralClaims` (`referrerUserId`,`status`);--> statement-breakpoint
CREATE INDEX `referral_claim_profile_created_idx` ON `referralClaims` (`referralProfileId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reward_ledger_user_status_created_idx` ON `rewardLedger` (`userId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `reward_ledger_referral_idx` ON `rewardLedger` (`referralClaimId`);