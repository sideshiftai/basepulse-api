CREATE TABLE "Badge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"imageUrl" text NOT NULL,
	"rarity" text NOT NULL,
	"tokenId" text,
	"contractAddress" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Badge_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "UserBadge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"badgeId" uuid NOT NULL,
	"earnedAt" timestamp DEFAULT now() NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"claimTxHash" text,
	CONSTRAINT "UserBadge_address_badge_key" UNIQUE("address","badgeId")
);
--> statement-breakpoint
CREATE TABLE "LevelThreshold" (
	"level" integer PRIMARY KEY NOT NULL,
	"xpRequired" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserLevel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"totalXp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserLevel_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "QuestDefinition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"xpReward" integer DEFAULT 0 NOT NULL,
	"badgeId" uuid,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"recurringPeriod" text,
	"requirements" jsonb NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "QuestDefinition_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "UserQuest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"questId" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"periodStart" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserQuest_address_quest_period_key" UNIQUE("address","questId","periodStart")
);
--> statement-breakpoint
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_Badge_id_fk" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "QuestDefinition" ADD CONSTRAINT "QuestDefinition_badgeId_Badge_id_fk" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_questId_QuestDefinition_id_fk" FOREIGN KEY ("questId") REFERENCES "public"."QuestDefinition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Badge_slug_idx" ON "Badge" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Badge_rarity_idx" ON "Badge" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "UserBadge_address_idx" ON "UserBadge" USING btree ("address");--> statement-breakpoint
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge" USING btree ("badgeId");--> statement-breakpoint
CREATE INDEX "UserLevel_address_idx" ON "UserLevel" USING btree ("address");--> statement-breakpoint
CREATE INDEX "UserLevel_totalXp_idx" ON "UserLevel" USING btree ("totalXp");--> statement-breakpoint
CREATE INDEX "UserLevel_level_idx" ON "UserLevel" USING btree ("level");--> statement-breakpoint
CREATE INDEX "QuestDef_slug_idx" ON "QuestDefinition" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "QuestDef_category_idx" ON "QuestDefinition" USING btree ("category");--> statement-breakpoint
CREATE INDEX "QuestDef_active_idx" ON "QuestDefinition" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "QuestDef_order_idx" ON "QuestDefinition" USING btree ("displayOrder");--> statement-breakpoint
CREATE INDEX "UserQuest_address_idx" ON "UserQuest" USING btree ("address");--> statement-breakpoint
CREATE INDEX "UserQuest_questId_idx" ON "UserQuest" USING btree ("questId");--> statement-breakpoint
CREATE INDEX "UserQuest_completed_idx" ON "UserQuest" USING btree ("isCompleted");