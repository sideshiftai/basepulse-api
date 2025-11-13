ALTER TABLE "Shift" ADD COLUMN "fundingTxHash" text;--> statement-breakpoint
CREATE INDEX "Shift_fundingTxHash_idx" ON "Shift" USING btree ("fundingTxHash");