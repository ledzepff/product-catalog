-- Migration: Modify product_bundle_items to reference rate_plans instead of products
-- Description: Bundle items should link to specific rate plans, not just products

-- Step 1: Add rate_plan_id column (nullable first for migration)
ALTER TABLE product_bundle_items
ADD COLUMN IF NOT EXISTS rate_plan_id UUID REFERENCES rate_plans(id) ON DELETE CASCADE;

-- Step 2: Drop the unique constraint on bundle_id + product_id
ALTER TABLE product_bundle_items
DROP CONSTRAINT IF EXISTS product_bundle_items_bundle_id_product_id_key;

-- Step 3: Create new unique constraint on bundle_id + rate_plan_id
-- (a rate plan can only be added once per bundle)
ALTER TABLE product_bundle_items
ADD CONSTRAINT product_bundle_items_bundle_id_rate_plan_id_key UNIQUE(bundle_id, rate_plan_id);

-- Step 4: Make product_id nullable (it will be derived from rate_plan's product)
ALTER TABLE product_bundle_items
ALTER COLUMN product_id DROP NOT NULL;

-- Step 5: Create index for rate_plan_id
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_rate_plan_id ON product_bundle_items(rate_plan_id);

-- Update comments
COMMENT ON TABLE product_bundle_items IS 'Rate plans that belong to a bundle - allows grouping specific pricing variations';
COMMENT ON COLUMN product_bundle_items.rate_plan_id IS 'Reference to the specific rate plan included in the bundle';
COMMENT ON COLUMN product_bundle_items.product_id IS 'Derived from rate_plan for quick lookups (denormalized)';
