# CLAUDE.md - Project Instructions for Claude Code

## Project Overview

This is a React-based Product Catalog application built with Material Dashboard 2 React template and Supabase as the backend database. It manages products, pricing, bundles, and availability across different channels.

## Tech Stack

- **Frontend**: React 18, Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL)
- **Template**: Material Dashboard 2 React by Creative Tim
- **State Management**: React useState/useEffect, localStorage for persistence
- **Tables**: React Table with DnD Kit for drag-and-drop column reordering
- **CSV Parsing**: PapaParse for bulk imports

## Key Commands

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable UI components (MDBox, MDTypography, MDButton, etc.)
├── context/          # React Context providers
├── examples/         # Template example components (Sidenav, Navbar, Footer, DataTable)
├── layouts/          # Page components organized by feature
│   ├── attributes/   # Attribute definitions management
│   ├── pricing/      # Pricing-related pages
│   │   ├── Units.js
│   │   ├── Periods.js
│   │   ├── Meters.js
│   │   ├── MeterValueTypes.js
│   │   ├── PricingTypes.js
│   │   ├── PricingAttributes.js
│   │   ├── RatePlans.js
│   │   ├── Bundles.js
│   │   └── ConsoleProducts.js  # Product/bundle availability per channel
│   ├── products/     # Product management (TemplateProducts)
│   ├── regions/      # Region management
│   └── ...
├── routes.js         # Application routing configuration
└── supabaseClient.js # Supabase client configuration
migrations/           # SQL migration files for database schema
```

## Database Schema Reference

**IMPORTANT**: When working with database queries, Supabase operations, or any database-related tasks, always refer to the `DATABASE_SCHEMA.md` file in the project root. This file contains:

- Complete table structures with column types
- Foreign key relationships
- Example Supabase queries
- Constraints and notes about each table

## Coding Conventions

### Supabase Queries

- Use soft delete pattern with `deleted_at` column
- Filter active records with `.is("deleted_at", null)`
- Check `is_active` boolean for enabled/disabled status
- Use nested select for related data: `product:products(id, name)`
- **IMPORTANT**: Filtering on nested relations like `.eq("product.is_active", true)` does NOT work in Supabase - filter in JavaScript instead

```javascript
// DON'T do this - silently fails:
.eq("product.is_active", true)

// DO this instead - filter in JS:
const filtered = data.filter(d => d.product?.is_active === true);
```

### Component Patterns

- Use MUI components wrapped in MD* components (MDBox, MDTypography, MDButton)
- DataTable component for tabular data with sorting, pagination, column visibility
- Dialog components for modals (add, edit, delete confirmation)
- FormControl with Select (displayEmpty, minHeight: 40) for dropdowns
- Chip components for status badges and tags

### State Management

- Local state with useState for component-specific data
- useEffect for data fetching on mount/dependency changes
- useMemo for computed/filtered data
- useCallback for memoized functions
- localStorage for user preferences (column order, hidden columns, entries per page)

### localStorage Persistence Pattern

Each page with DataTable persists user preferences:

```javascript
// Define keys
const COLUMN_ORDER_KEY = "page-name-column-order";
const HIDDEN_COLUMNS_KEY = "page-name-hidden-columns";
const ENTRIES_PER_PAGE_KEY = "page-name-entries-per-page";

// Initialize state from localStorage
const [entriesPerPage, setEntriesPerPage] = useState(() => {
  const saved = localStorage.getItem(ENTRIES_PER_PAGE_KEY);
  return saved ? parseInt(saved, 10) : 10;
});

// Save on change
const handleEntriesPerPageChange = useCallback((newValue) => {
  setEntriesPerPage(newValue);
  localStorage.setItem(ENTRIES_PER_PAGE_KEY, newValue.toString());
}, []);
```

## Common Patterns

### Fetching Data from Supabase

```javascript
const { data, error } = await supabase
  .from("table_name")
  .select(`
    *,
    related_table(id, name)
  `)
  .is("deleted_at", null)
  .order("name");
```

### Soft Delete

```javascript
await supabase
  .from("table_name")
  .update({
    deleted_at: new Date().toISOString(),
    is_active: false
  })
  .eq("id", rowId);
```

### Insert with Timestamps

```javascript
await supabase
  .from("table_name")
  .insert({
    ...formData,
    created_at: new Date().toISOString()
  });
```

### Update with Timestamp

```javascript
await supabase
  .from("table_name")
  .update({
    ...formData,
    updated_at: new Date().toISOString()
  })
  .eq("id", rowId);
```

## Key Business Logic

### Product Availability (ConsoleProducts)

- Products are available per **region** (via rate_plans)
- Bundles are available globally (no region)
- Availability can be time-bound (available_from, available_until)
- Multiple channels supported: cloud_console, partner_portal, reseller_api

### Rate Plans

- Link products to regions with pricing
- Each product can have different prices per region
- Referenced by product_availability for channel availability

### Product Templates

- Define which attributes a product type should have
- product_template_attributes links templates to attribute_definitions
- Products inherit attributes from their template

## Notes

- All timestamps use TIMESTAMPTZ with timezone
- Foreign keys typically cascade on delete
- Row Level Security (RLS) is enabled on most tables
- Use `!inner` join for required relationships in Supabase queries


## Authentication & Authorization

This project uses **Supabase Auth** with a shared database from Product Catalog Portal.

### Key Concepts

- **Invitation-only**: Users cannot self-register. Only `platform_admin` can invite users.
- **Single-tenant**: All PMP users operate at the platform level (no multi-tenancy).
- **Shared user base**: Users may already exist in Supabase from other apps (Product Catalog Portal).

### Roles

| Role | Permissions |
|------|-------------|
| `platform_admin` | Full access, can invite users, manage all products |
| `product_editor` | Create, edit, delete products |
| `products_viewer` | Read-only access to products |

### Authentication Flow

1. User receives invitation email from `platform_admin`
2. User clicks link, sets password via Supabase Auth
3. Database trigger `on_auth_user_created` creates:
   - `profiles` record
   - `user_settings` record
   - `user_roles` record (with invited role)
4. User can now sign in to PMP

### Implementation Reference

See `docs/pmp-auth-implementation-guide.md` (or the document provided) for:
- Supabase client setup
- Auth context pattern
- Protected routes
- Role checking
- User invitation API
- Migration file for PMP roles

### Database Tables (Shared)

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth users |
| `profiles` | Extended user info |
| `user_roles` | User-to-role assignments |
| `roles` | Role definitions |
| `pending_invitations` | Invitation records |
| `user_settings` | User preferences |

### Helper RPC Functions

```javascript
// Check user roles
const { data } = await supabase.rpc('get_user_roles', { p_user_id: userId })

// Check specific role
const { data } = await supabase.rpc('has_role', {
  p_user_id: userId,
  p_role_name: 'platform_admin'
})

// Check permission
const { data } = await supabase.rpc('has_permission', {
  p_user_id: userId,
  p_resource: 'products',
  p_action: 'create',
  p_scope_type: null,
  p_scope_value: null
})
```

### Environment Variables

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!
```

### Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- Always use `supabase.auth.getUser()` to verify authentication (not `getSession()`)
- Show generic error "Invalid email or password" on sign-in failures
- Implement rate limiting on sign-in endpoint (10 requests/minute)

### Migration Required

Before using auth in PMP, run the migration to create `product_editor` and `products_viewer` roles. See the implementation guide for the full SQL.
