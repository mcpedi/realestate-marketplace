CREATE TABLE "accountNotifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accountNotifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"href" varchar(512),
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencyProfiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agencyProfiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"agencyName" varchar(255) NOT NULL,
	"logoUrl" text,
	"bannerUrl" text,
	"description" text,
	"website" varchar(512),
	"socialMedia" jsonb,
	"verified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentContacts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agentContacts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ownerUserId" integer NOT NULL,
	"inquiryId" integer,
	"propertyId" integer,
	"name" varchar(160) NOT NULL,
	"email" varchar(320),
	"phone" varchar(48),
	"stage" text DEFAULT 'new' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"notes" text,
	"nextFollowUpAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogPosts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blogPosts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"coverImage" varchar(512),
	"authorId" integer,
	"published" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogPosts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"description" text,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "favorites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"propertyId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featuredListings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "featuredListings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"userId" integer NOT NULL,
	"paymentId" integer,
	"featuredUntil" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inquiries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"userId" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"message" text NOT NULL,
	"leadStatus" text DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadActivities" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leadActivities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"contactId" integer NOT NULL,
	"agentUserId" integer NOT NULL,
	"type" text DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"fromStage" varchar(32),
	"toStage" varchar(32),
	"activityAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listingTemplates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "listingTemplates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ownerUserId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"templateData" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moduleAuditLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "moduleAuditLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actorUserId" integer NOT NULL,
	"action" varchar(128) NOT NULL,
	"resourceType" varchar(64) NOT NULL,
	"resourceId" integer NOT NULL,
	"propertyId" integer,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"subscriptionId" integer,
	"propertyId" integer,
	"amount" double precision NOT NULL,
	"currency" varchar(8) DEFAULT 'KES' NOT NULL,
	"method" text DEFAULT 'free' NOT NULL,
	"reference" varchar(255),
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planningAnalyses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "planningAnalyses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"propertyId" integer,
	"kind" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"inputs" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planningAssumptionTemplates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "planningAssumptionTemplates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(160) NOT NULL,
	"description" varchar(400),
	"kind" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdByUserId" integer NOT NULL,
	"updatedByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platformModuleSettings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platformModuleSettings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"moduleKey" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updatedByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platformModuleSettings_moduleKey_unique" UNIQUE("moduleKey")
);
--> statement-breakpoint
CREATE TABLE "postCategories" (
	"postId" integer NOT NULL,
	"categoryId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "properties_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" double precision NOT NULL,
	"location" varchar(255) NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"propertyType" text NOT NULL,
	"listingType" text NOT NULL,
	"bedrooms" integer DEFAULT 0,
	"bathrooms" integer DEFAULT 0,
	"landSize" double precision,
	"floorArea" double precision,
	"amenities" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"featured" boolean DEFAULT false,
	"viewsCount" integer DEFAULT 0,
	"inquiriesCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyActivity" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyActivity_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"propertyId" integer NOT NULL,
	"eventType" text NOT NULL,
	"keywords" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyAlerts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyAlerts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" text NOT NULL,
	"criteria" jsonb,
	"propertyId" integer,
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyDocumentAccess" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyDocumentAccess_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"documentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"grantedByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyDocuments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyDocuments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"uploadedByUserId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"mimeType" varchar(128) NOT NULL,
	"sizeBytes" integer NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyIdentifiers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyIdentifiers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"identifier" varchar(48) NOT NULL,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propertyIdentifiers_propertyId_unique" UNIQUE("propertyId"),
	CONSTRAINT "propertyIdentifiers_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "propertyModerationSignals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyModerationSignals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"riskLevel" text DEFAULT 'none' NOT NULL,
	"categories" jsonb NOT NULL,
	"summary" varchar(600) NOT NULL,
	"confidence" integer NOT NULL,
	"model" varchar(96) NOT NULL,
	"inputFingerprint" varchar(64) NOT NULL,
	"analyzedByUserId" integer NOT NULL,
	"analyzedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propertyModerationSignals_propertyId_unique" UNIQUE("propertyId")
);
--> statement-breakpoint
CREATE TABLE "propertyOperationRecords" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyOperationRecords_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"ownerUserId" integer NOT NULL,
	"type" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(64) NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"participantName" varchar(160),
	"participantContact" varchar(160),
	"tenantUserId" integer,
	"amount" numeric(14, 2),
	"dueDate" timestamp,
	"completedAt" timestamp,
	"details" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyPhotos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyPhotos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"url" varchar(512) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"sortOrder" integer DEFAULT 0,
	"is360" smallint DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyScores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyScores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"score" integer NOT NULL,
	"valueScore" integer NOT NULL,
	"locationScore" integer NOT NULL,
	"amenitiesScore" integer NOT NULL,
	"accessibilityScore" integer NOT NULL,
	"breakdown" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propertyScores_propertyId_unique" UNIQUE("propertyId")
);
--> statement-breakpoint
CREATE TABLE "propertyShareRecords" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyShareRecords_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"propertyIdentifierId" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdByUserId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propertyShareRecords_propertyId_unique" UNIQUE("propertyId"),
	CONSTRAINT "propertyShareRecords_propertyIdentifierId_unique" UNIQUE("propertyIdentifierId")
);
--> statement-breakpoint
CREATE TABLE "propertyTenantAssignments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyTenantAssignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"ownerUserId" integer NOT NULL,
	"tenantUserId" integer,
	"invitationCode" varchar(32) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"unitLabel" varchar(120),
	"expiresAt" timestamp,
	"acceptedAt" timestamp,
	"endedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "propertyTenantAssignments_invitationCode_unique" UNIQUE("invitationCode")
);
--> statement-breakpoint
CREATE TABLE "propertyTransactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyTransactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"ownerUserId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"stage" text DEFAULT 'intake' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"counterpartyName" varchar(160),
	"counterpartyContact" varchar(160),
	"amount" numeric(14, 2),
	"notes" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propertyVideos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "propertyVideos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"url" varchar(512) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"thumbnailUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referralClaims" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "referralClaims_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"referralProfileId" integer NOT NULL,
	"referrerUserId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewedByUserId" integer,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralClaims_referredUserId_unique" UNIQUE("referredUserId")
);
--> statement-breakpoint
CREATE TABLE "referralProfiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "referralProfiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"referralCode" varchar(32) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referralProfiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "referralProfiles_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "rewardLedger" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rewardLedger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"referralClaimId" integer,
	"points" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" varchar(280),
	"createdByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptionPlans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptionPlans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(128) NOT NULL,
	"description" text,
	"price" double precision NOT NULL,
	"currency" varchar(8) DEFAULT 'KES' NOT NULL,
	"period" text NOT NULL,
	"maxImages" integer DEFAULT 5,
	"maxVideos" integer DEFAULT 0,
	"featured" boolean DEFAULT false,
	"prioritySearch" boolean DEFAULT false,
	"aiDescriptions" boolean DEFAULT false,
	"aiPriceRecommendations" boolean DEFAULT false,
	"leadManagement" boolean DEFAULT false,
	"verifiedBadge" boolean DEFAULT false,
	"agencyBranding" boolean DEFAULT false,
	"socialSharing" boolean DEFAULT false,
	"prioritySupport" boolean DEFAULT false,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"planId" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp,
	"autoRenew" boolean DEFAULT true,
	"lastPaymentDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "testimonials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"role" varchar(128),
	"content" text NOT NULL,
	"rating" integer DEFAULT 5,
	"avatarUrl" varchar(512),
	"featured" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPreferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "userPreferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"budgetMin" double precision,
	"budgetMax" double precision,
	"preferredLocations" jsonb,
	"preferredTypes" jsonb,
	"minBedrooms" integer DEFAULT 0,
	"listingType" text DEFAULT 'any',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"phone" varchar(32),
	"location" text,
	"bio" text,
	"profilePicture" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "viewingBookings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "viewingBookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"propertyId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlistCollectionItems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wishlistCollectionItems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"collectionId" integer NOT NULL,
	"propertyId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlistCollections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wishlistCollections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ownerUserId" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(280),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_contact_owner_stage_idx" ON "agentContacts" USING btree ("ownerUserId","stage");--> statement-breakpoint
CREATE INDEX "agent_contact_owner_followup_idx" ON "agentContacts" USING btree ("ownerUserId","nextFollowUpAt");--> statement-breakpoint
CREATE INDEX "agent_contact_inquiry_idx" ON "agentContacts" USING btree ("inquiryId");--> statement-breakpoint
CREATE INDEX "lead_activity_contact_idx" ON "leadActivities" USING btree ("contactId","activityAt");--> statement-breakpoint
CREATE INDEX "lead_activity_agent_idx" ON "leadActivities" USING btree ("agentUserId","activityAt");--> statement-breakpoint
CREATE INDEX "listing_template_owner_active_idx" ON "listingTemplates" USING btree ("ownerUserId","active");--> statement-breakpoint
CREATE INDEX "module_audit_resource_idx" ON "moduleAuditLogs" USING btree ("resourceType","resourceId");--> statement-breakpoint
CREATE INDEX "module_audit_property_idx" ON "moduleAuditLogs" USING btree ("propertyId","createdAt");--> statement-breakpoint
CREATE INDEX "module_audit_actor_idx" ON "moduleAuditLogs" USING btree ("actorUserId","createdAt");--> statement-breakpoint
CREATE INDEX "planning_user_created_idx" ON "planningAnalyses" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "planning_property_idx" ON "planningAnalyses" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "planning_template_kind_active_idx" ON "planningAssumptionTemplates" USING btree ("kind","active","updatedAt");--> statement-breakpoint
CREATE INDEX "planning_template_creator_idx" ON "planningAssumptionTemplates" USING btree ("createdByUserId","createdAt");--> statement-breakpoint
CREATE INDEX "document_access_document_idx" ON "propertyDocumentAccess" USING btree ("documentId");--> statement-breakpoint
CREATE INDEX "document_access_user_idx" ON "propertyDocumentAccess" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "property_document_property_idx" ON "propertyDocuments" USING btree ("propertyId","createdAt");--> statement-breakpoint
CREATE INDEX "property_document_uploader_idx" ON "propertyDocuments" USING btree ("uploadedByUserId","createdAt");--> statement-breakpoint
CREATE INDEX "property_identifier_creator_idx" ON "propertyIdentifiers" USING btree ("createdByUserId","createdAt");--> statement-breakpoint
CREATE INDEX "moderation_signal_level_updated_idx" ON "propertyModerationSignals" USING btree ("riskLevel","updatedAt");--> statement-breakpoint
CREATE INDEX "operation_property_type_idx" ON "propertyOperationRecords" USING btree ("propertyId","type");--> statement-breakpoint
CREATE INDEX "operation_owner_status_idx" ON "propertyOperationRecords" USING btree ("ownerUserId","status");--> statement-breakpoint
CREATE INDEX "operation_tenant_status_idx" ON "propertyOperationRecords" USING btree ("tenantUserId","status");--> statement-breakpoint
CREATE INDEX "operation_due_date_idx" ON "propertyOperationRecords" USING btree ("dueDate");--> statement-breakpoint
CREATE INDEX "property_share_enabled_idx" ON "propertyShareRecords" USING btree ("enabled","updatedAt");--> statement-breakpoint
CREATE INDEX "property_share_creator_idx" ON "propertyShareRecords" USING btree ("createdByUserId","createdAt");--> statement-breakpoint
CREATE INDEX "tenant_assignment_owner_property_idx" ON "propertyTenantAssignments" USING btree ("ownerUserId","propertyId");--> statement-breakpoint
CREATE INDEX "tenant_assignment_tenant_status_idx" ON "propertyTenantAssignments" USING btree ("tenantUserId","status");--> statement-breakpoint
CREATE INDEX "tenant_assignment_property_status_idx" ON "propertyTenantAssignments" USING btree ("propertyId","status");--> statement-breakpoint
CREATE INDEX "property_transaction_owner_stage_idx" ON "propertyTransactions" USING btree ("ownerUserId","stage");--> statement-breakpoint
CREATE INDEX "property_transaction_property_idx" ON "propertyTransactions" USING btree ("propertyId","createdAt");--> statement-breakpoint
CREATE INDEX "referral_claim_referrer_status_idx" ON "referralClaims" USING btree ("referrerUserId","status");--> statement-breakpoint
CREATE INDEX "referral_claim_profile_created_idx" ON "referralClaims" USING btree ("referralProfileId","createdAt");--> statement-breakpoint
CREATE INDEX "reward_ledger_user_status_created_idx" ON "rewardLedger" USING btree ("userId","status","createdAt");--> statement-breakpoint
CREATE INDEX "reward_ledger_referral_idx" ON "rewardLedger" USING btree ("referralClaimId");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_collection_property_unique" ON "wishlistCollectionItems" USING btree ("collectionId","propertyId");--> statement-breakpoint
CREATE INDEX "wishlist_item_property_idx" ON "wishlistCollectionItems" USING btree ("propertyId");--> statement-breakpoint
CREATE INDEX "wishlist_collection_owner_updated_idx" ON "wishlistCollections" USING btree ("ownerUserId","updatedAt");