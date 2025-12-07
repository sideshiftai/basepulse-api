CREATE TABLE "DailyVoteCount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"date" date NOT NULL,
	"voteCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "DailyVoteCount_address_date_key" UNIQUE("address","date")
);
--> statement-breakpoint
CREATE TABLE "MembershipTier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"dailyVoteLimit" integer NOT NULL,
	"maxSeasonPoints" integer NOT NULL,
	"requirements" jsonb NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "MembershipTier_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "UserMembership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"currentTier" text DEFAULT 'bronze' NOT NULL,
	"tierUpdatedAt" timestamp DEFAULT now() NOT NULL,
	"pollsParticipated" integer DEFAULT 0 NOT NULL,
	"totalVotesCast" integer DEFAULT 0 NOT NULL,
	"pollsCreated" integer DEFAULT 0 NOT NULL,
	"seasonsCompleted" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserMembership_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "Season" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creatorAddress" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"totalPulsePool" text DEFAULT '0' NOT NULL,
	"pulsePerPoint" text,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PointsTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"seasonId" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"questId" uuid,
	"description" text,
	"reversedAt" timestamp,
	"reversedBy" text,
	"reversalReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserSeasonPoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"seasonId" uuid NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"pulseEarned" text DEFAULT '0' NOT NULL,
	"pulseClaimed" boolean DEFAULT false NOT NULL,
	"claimTxHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserSeasonPoints_address_season_key" UNIQUE("address","seasonId")
);
--> statement-breakpoint
CREATE TABLE "CreatorQuestParticipation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questId" uuid NOT NULL,
	"participantAddress" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"pointsAwarded" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CreatorQuestParticipation_quest_participant_key" UNIQUE("questId","participantAddress")
);
--> statement-breakpoint
CREATE TABLE "CreatorQuest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creatorAddress" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"questType" text NOT NULL,
	"requirements" jsonb NOT NULL,
	"pointsReward" integer NOT NULL,
	"maxCompletions" integer,
	"currentCompletions" integer DEFAULT 0 NOT NULL,
	"pollScope" text DEFAULT 'all' NOT NULL,
	"specificPollIds" jsonb,
	"seasonId" uuid,
	"isActive" boolean DEFAULT true NOT NULL,
	"startTime" timestamp,
	"endTime" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PointsTransaction" ADD CONSTRAINT "PointsTransaction_seasonId_Season_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserSeasonPoints" ADD CONSTRAINT "UserSeasonPoints_seasonId_Season_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CreatorQuestParticipation" ADD CONSTRAINT "CreatorQuestParticipation_questId_CreatorQuest_id_fk" FOREIGN KEY ("questId") REFERENCES "public"."CreatorQuest"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CreatorQuest" ADD CONSTRAINT "CreatorQuest_seasonId_Season_id_fk" FOREIGN KEY ("seasonId") REFERENCES "public"."Season"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "DailyVoteCount_address_idx" ON "DailyVoteCount" USING btree ("address");--> statement-breakpoint
CREATE INDEX "DailyVoteCount_date_idx" ON "DailyVoteCount" USING btree ("date");--> statement-breakpoint
CREATE INDEX "MembershipTier_slug_idx" ON "MembershipTier" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "MembershipTier_displayOrder_idx" ON "MembershipTier" USING btree ("displayOrder");--> statement-breakpoint
CREATE INDEX "UserMembership_address_idx" ON "UserMembership" USING btree ("address");--> statement-breakpoint
CREATE INDEX "UserMembership_tier_idx" ON "UserMembership" USING btree ("currentTier");--> statement-breakpoint
CREATE INDEX "Season_creator_idx" ON "Season" USING btree ("creatorAddress");--> statement-breakpoint
CREATE INDEX "Season_status_idx" ON "Season" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Season_startTime_idx" ON "Season" USING btree ("startTime");--> statement-breakpoint
CREATE INDEX "Season_endTime_idx" ON "Season" USING btree ("endTime");--> statement-breakpoint
CREATE INDEX "PointsTransaction_address_idx" ON "PointsTransaction" USING btree ("address");--> statement-breakpoint
CREATE INDEX "PointsTransaction_season_idx" ON "PointsTransaction" USING btree ("seasonId");--> statement-breakpoint
CREATE INDEX "PointsTransaction_type_idx" ON "PointsTransaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "PointsTransaction_quest_idx" ON "PointsTransaction" USING btree ("questId");--> statement-breakpoint
CREATE INDEX "UserSeasonPoints_address_idx" ON "UserSeasonPoints" USING btree ("address");--> statement-breakpoint
CREATE INDEX "UserSeasonPoints_season_idx" ON "UserSeasonPoints" USING btree ("seasonId");--> statement-breakpoint
CREATE INDEX "UserSeasonPoints_points_idx" ON "UserSeasonPoints" USING btree ("totalPoints");--> statement-breakpoint
CREATE INDEX "CreatorQuestParticipation_quest_idx" ON "CreatorQuestParticipation" USING btree ("questId");--> statement-breakpoint
CREATE INDEX "CreatorQuestParticipation_participant_idx" ON "CreatorQuestParticipation" USING btree ("participantAddress");--> statement-breakpoint
CREATE INDEX "CreatorQuestParticipation_completed_idx" ON "CreatorQuestParticipation" USING btree ("isCompleted");--> statement-breakpoint
CREATE INDEX "CreatorQuest_creator_idx" ON "CreatorQuest" USING btree ("creatorAddress");--> statement-breakpoint
CREATE INDEX "CreatorQuest_type_idx" ON "CreatorQuest" USING btree ("questType");--> statement-breakpoint
CREATE INDEX "CreatorQuest_season_idx" ON "CreatorQuest" USING btree ("seasonId");--> statement-breakpoint
CREATE INDEX "CreatorQuest_active_idx" ON "CreatorQuest" USING btree ("isActive");