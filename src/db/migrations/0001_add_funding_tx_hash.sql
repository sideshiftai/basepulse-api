-- Add fundingTxHash column to Shift table
ALTER TABLE "Shift" ADD COLUMN "fundingTxHash" text;

-- Add index for quick lookups
CREATE INDEX "Shift_fundingTxHash_idx" ON "Shift" USING btree ("fundingTxHash");
