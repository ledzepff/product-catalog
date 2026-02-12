# Database Schema

This document describes the database schema used in the Product Catalog application.

## Core Tables

### products
Main product table storing all products.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Product name |
| description | TEXT | Product description |
| is_active | BOOLEAN | Active status |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |
| scope_id | BIGINT (FK) | Reference to scopes table |
| service_id | BIGINT (FK) | Reference to service table |
| service_type_id | BIGINT (FK) | Reference to service_type table |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### attribute_definitions
Defines all available attributes in the system.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| attribute_key | VARCHAR | Unique key for the attribute |
| display_name | VARCHAR | Display name shown in UI |
| data_type | VARCHAR | Type: string, integer, decimal, boolean, text, list, json |
| is_required | BOOLEAN | Whether attribute is required |
| default_value | TEXT | Default value |
| validation_rules | JSONB | Validation rules |
| list_options | JSONB | Options for list type attributes |
| is_grouping | BOOLEAN | Used for grouping products in dropdowns |
| group_predecessor_id | BIGINT (FK) | Reference to parent grouping attribute |
| sort_order | INTEGER | Display order |
| tags | TEXT[] | Array of tags |
| is_active | BOOLEAN | Active status |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

### product_attributes
Junction table linking products to their attribute values.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| product_id | BIGINT (FK) | Reference to products table |
| product_template_id | BIGINT (FK) | Reference to product_templates table |
| attribute_definition_id | BIGINT (FK) | Reference to attribute_definitions table |
| value_string | VARCHAR | String value |
| value_integer | INTEGER | Integer value |
| value_decimal | DECIMAL | Decimal value |
| value_boolean | BOOLEAN | Boolean value |
| value_text | TEXT | Long text value |
| value_json | JSONB | JSON value |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### product_templates
Templates that define which attributes a product type should have.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Template name |
| description | TEXT | Template description |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### product_template_attributes
Junction table linking templates to attribute definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| template_id | BIGINT (FK) | Reference to product_templates |
| attribute_id | BIGINT (FK) | Reference to attribute_definitions |
| is_required | BOOLEAN | Whether required in this template |
| sort_order | INTEGER | Display order in template |
| is_active | BOOLEAN | Active status |
| is_overview_display | BOOLEAN | Show in overview table |

## Pricing Tables

### rate_plans
Pricing plans for products with region-specific rates.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| product_id | BIGINT (FK) | Reference to products table |
| region_id | BIGINT (FK) | Reference to regions table |
| name | VARCHAR | Rate plan name |
| description | TEXT | Description |
| unit_id | BIGINT (FK) | Reference to units table |
| period_id | BIGINT (FK) | Reference to periods table |
| meter_id | BIGINT (FK) | Reference to meters table |
| pricing_type_id | BIGINT (FK) | Reference to pricing_types table |
| base_price | DECIMAL | Base price |
| currency | VARCHAR | Currency code |
| is_active | BOOLEAN | Active status |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### units
Units of measurement (e.g., GB, hours, requests).

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Unit name |
| abbreviation | VARCHAR | Short form |
| is_active | BOOLEAN | Active status |

### periods
Time periods for pricing (e.g., hourly, monthly).

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Period name |
| duration_hours | INTEGER | Duration in hours |
| is_active | BOOLEAN | Active status |

### meters
Metering types for usage tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Meter name |
| meter_value_type_id | BIGINT (FK) | Reference to meter_value_types |
| is_active | BOOLEAN | Active status |

### meter_value_types
Types of meter values (e.g., cumulative, gauge).

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Type name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |

### pricing_types
Types of pricing models.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Type name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |

### pricing_attributes
Custom pricing attributes.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Attribute name |
| data_type | VARCHAR | Data type |
| is_active | BOOLEAN | Active status |

## Bundle Tables

### product_bundles
Container for grouping products together (e.g., S3 bundle with storage, transfer, requests).

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Bundle name |
| description | TEXT | Bundle description |
| tags | TEXT[] | Array of tags for categorization |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

### product_bundle_items
Products that belong to a bundle.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| bundle_id | BIGINT (FK) | Reference to product_bundles |
| product_id | UUID (FK) | Reference to products |
| is_required | BOOLEAN | Whether product is required in bundle |
| quantity_default | INTEGER | Default quantity |
| sort_order | VARCHAR | Display order within bundle |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Availability Tables

### product_availability
Manages product (per region) and bundle availability per channel/app.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| product_id | BIGINT (FK) | Reference to products (requires region_id, mutually exclusive with bundle_id) |
| region_id | BIGINT (FK) | Reference to region - specifies which region the product is available in |
| bundle_id | BIGINT (FK) | Reference to product_bundles (mutually exclusive with product_id/region_id) |
| channel | VARCHAR | Channel identifier (e.g., cloud_console, partner_portal) |
| is_available | BOOLEAN | Whether available in channel |
| available_from | TIMESTAMPTZ | When availability starts (NULL = from beginning) |
| available_until | TIMESTAMPTZ | When availability ends (NULL = forever) |
| sort_order | INTEGER | Display order in channel |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

**Constraints:**
- Either (product_id + region_id) OR bundle_id must be set (not both)
- Unique product+region per channel (product_id, region_id, channel, deleted_at)
- Unique bundle per channel (bundle_id, channel, deleted_at)

## Reference Tables

### regions
Geographic regions for pricing.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Region name |
| code | VARCHAR | Region code |
| is_active | BOOLEAN | Active status |

### services
Services that products belong to.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Service name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |

### service_types
Types/categories of services.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Type name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |

### scopes
Product scopes/visibility.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Primary key |
| name | VARCHAR | Scope name |
| description | TEXT | Description |
| is_active | BOOLEAN | Active status |

## Key Relationships

```
products
  ├── product_attributes (1:N) → attribute_definitions
  ├── rate_plans (1:N) → regions, units, periods, meters, pricing_types
  ├── scopes (N:1)
  ├── services (N:1)
  └── service_types (N:1)

product_templates
  └── product_template_attributes (1:N) → attribute_definitions

product_bundles
  ├── product_bundle_items (1:N) → products
  └── product_availability (1:N)

products
  └── product_availability (1:N)
```

## Supabase Query Examples

### Get products with grouping attribute
```javascript
const { data: products } = await supabase
  .from("products")
  .select(`
    id,
    name,
    rate_plans!inner(id),
    product_attributes(
      value_text,
      value_string,
      attribute:attribute_definitions(
        attribute_key,
        is_grouping
      )
    )
  `)
  .eq("is_active", true)
  .is("deleted_at", null);
```

### Get product availability for a channel
```javascript
const { data } = await supabase
  .from("product_availability")
  .select(`
    *,
    product:products(id, name, is_active),
    bundle:product_bundles(id, name, is_active)
  `)
  .eq("channel", "cloud_console")
  .is("deleted_at", null);
```

## Notes

- All tables use soft delete with `deleted_at` column
- All tables have `is_active` boolean for enabling/disabling
- Timestamps use TIMESTAMPTZ with timezone
- Foreign keys cascade on delete where appropriate
- Row Level Security (RLS) is enabled on most tables
