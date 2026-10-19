-- Optional review evidence; no state changes, data rewrites or approvals.
ALTER TABLE "formulation_versions" ADD COLUMN "sourceReviewSnapshot" JSONB;
