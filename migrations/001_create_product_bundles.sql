-- Migration: Create Product Bundles tables
-- Description: Tables for grouping products into bundles (e.g., S3 with Storage, Transfer, Requests)

-- Product Bundles (the container)
CREATE TABLE IF NOT EXISTS product_bundles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Bundle Items (products in a bundle)
CREATE TABLE IF NOT EXISTS product_bundle_items (
  id BIGSERIAL PRIMARY KEY,
  bundle_id BIGINT NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  quantity_default INTEGER DEFAULT 1,
  sort_order VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bundle_id, product_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_bundles_is_active ON product_bundles(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_bundles_tags ON product_bundles USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle_id ON product_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_product_bundle_items_product_id ON product_bundle_items(product_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_bundles_updated_at ON product_bundles;
CREATE TRIGGER trigger_update_product_bundles_updated_at
  BEFORE UPDATE ON product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_product_bundles_updated_at();

-- Enable RLS (Row Level Security) - adjust policies as needed
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundle_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access on product_bundles" ON product_bundles
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on product_bundles" ON product_bundles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on product_bundles" ON product_bundles
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on product_bundles" ON product_bundles
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access on product_bundle_items" ON product_bundle_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on product_bundle_items" ON product_bundle_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on product_bundle_items" ON product_bundle_items
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on product_bundle_items" ON product_bundle_items
  FOR DELETE USING (true);

-- Comments for documentation
COMMENT ON TABLE product_bundles IS 'Container for grouping products together (e.g., S3 bundle with storage, transfer, requests)';
COMMENT ON COLUMN product_bundles.tags IS 'Array of tags for categorization';
COMMENT ON TABLE product_bundle_items IS 'Products that belong to a bundle with required/optional flag';
COMMENT ON COLUMN product_bundle_items.is_required IS 'Whether this product is required in the bundle or an optional add-on';
COMMENT ON COLUMN product_bundle_items.quantity_default IS 'Default quantity for the product in this bundle';
COMMENT ON COLUMN product_bundle_items.sort_order IS 'Display order within the bundle';
