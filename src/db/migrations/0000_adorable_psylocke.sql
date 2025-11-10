CREATE TABLE "Poll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chainId" integer NOT NULL,
	"pollId" bigint NOT NULL,
	"distributionMode" text DEFAULT 'MANUAL_PULL' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Poll_chainId_pollId_key" UNIQUE("chainId","pollId")
);
--> statement-breakpoint
CREATE TABLE "DistributionLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pollId" uuid NOT NULL,
	"recipient" text NOT NULL,
	"amount" text NOT NULL,
	"token" text DEFAULT '0x0000000000000000000000000000000000000000' NOT NULL,
	"txHash" text NOT NULL,
	"eventType" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserPreference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"preferredToken" text,
	"autoClaimEnabled" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserPreference_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "Leaderboard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"totalRewards" text DEFAULT '0' NOT NULL,
	"pollsParticipated" integer DEFAULT 0 NOT NULL,
	"totalVotes" integer DEFAULT 0 NOT NULL,
	"pollsCreated" integer DEFAULT 0 NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Leaderboard_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "Shift" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sideshiftOrderId" text NOT NULL,
	"pollId" text NOT NULL,
	"userAddress" text NOT NULL,
	"purpose" text NOT NULL,
	"sourceAsset" text NOT NULL,
	"destAsset" text NOT NULL,
	"sourceNetwork" text NOT NULL,
	"destNetwork" text NOT NULL,
	"sourceAmount" text,
	"destAmount" text,
	"depositAddress" text NOT NULL,
	"settleAddress" text NOT NULL,
	"shiftType" text NOT NULL,
	"status" text NOT NULL,
	"depositTxHash" text,
	"settleTxHash" text,
	"contractTxHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "Shift_sideshiftOrderId_unique" UNIQUE("sideshiftOrderId")
);
--> statement-breakpoint
CREATE TABLE "Checkpoint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chainId" text NOT NULL,
	"lastBlockNumber" bigint NOT NULL,
	"lastProcessedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Checkpoint_chainId_unique" UNIQUE("chainId")
);
--> statement-breakpoint
CREATE TABLE "Announcement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"link" text,
	"linkText" text DEFAULT 'Learn More',
	"status" text DEFAULT 'draft' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"dismissible" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DistributionLog" ADD CONSTRAINT "DistributionLog_pollId_Poll_id_fk" FOREIGN KEY ("pollId") REFERENCES "public"."Poll"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Poll_chainId_idx" ON "Poll" USING btree ("chainId");--> statement-breakpoint
CREATE INDEX "Poll_pollId_idx" ON "Poll" USING btree ("pollId");--> statement-breakpoint
CREATE INDEX "DistributionLog_pollId_idx" ON "DistributionLog" USING btree ("pollId");--> statement-breakpoint
CREATE INDEX "DistributionLog_recipient_idx" ON "DistributionLog" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "DistributionLog_eventType_idx" ON "DistributionLog" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "DistributionLog_timestamp_idx" ON "DistributionLog" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "UserPreference_address_idx" ON "UserPreference" USING btree ("address");--> statement-breakpoint
CREATE INDEX "Leaderboard_address_idx" ON "Leaderboard" USING btree ("address");--> statement-breakpoint
CREATE INDEX "Leaderboard_totalRewards_idx" ON "Leaderboard" USING btree ("totalRewards");--> statement-breakpoint
CREATE INDEX "Leaderboard_pollsParticipated_idx" ON "Leaderboard" USING btree ("pollsParticipated");--> statement-breakpoint
CREATE INDEX "Leaderboard_totalVotes_idx" ON "Leaderboard" USING btree ("totalVotes");--> statement-breakpoint
CREATE INDEX "Shift_userAddress_idx" ON "Shift" USING btree ("userAddress");--> statement-breakpoint
CREATE INDEX "Shift_pollId_idx" ON "Shift" USING btree ("pollId");--> statement-breakpoint
CREATE INDEX "Shift_status_idx" ON "Shift" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Shift_purpose_idx" ON "Shift" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "Shift_createdAt_idx" ON "Shift" USING btree ("createdAt");