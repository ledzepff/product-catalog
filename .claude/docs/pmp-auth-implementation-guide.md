# Product Management Portal (PMP) — Authentication & Authorization Implementation Guide

This document provides comprehensive instructions for implementing authentication and authorization in the Product Management Portal (PMP) application. PMP shares the same Supabase instance as Product Catalog Portal.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Database Setup](#database-setup)
4. [Supabase Client Setup](#supabase-client-setup)
5. [Authentication Flows](#authentication-flows)
6. [Authorization & Role Checks](#authorization--role-checks)
7. [Protected Routes](#protected-routes)
8. [API Pattern Examples](#api-pattern-examples)
9. [Migration File](#migration-file)
10. [UI Recommendations](#ui-recommendations)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### Key Characteristics

- **Single-tenant**: All PMP users operate at the platform level (no multi-tenancy)
- **Invitation-only**: No public sign-up; users must be invited by `platform_admin`
- **Shared Supabase**: Uses the same Supabase project as Product Catalog Portal
- **Shared user base**: A user invited to PMP may already exist in `auth.users` from Product Catalog Portal

### Roles in PMP

| Role | Description | Can Invite |
|------|-------------|------------|
| `platform_admin` | Full access, can invite other users, manage all products | Yes |
| `product_editor` | Can create, edit, delete products | No |
| `products_viewer` | Read-only access to products | No |

---

## Architecture Summary

### Existing Database Schema (Shared with Product Catalog Portal)

```
auth.users                  ← Supabase Auth (users login here)
    │
    ├── profiles            ← Extended user info (tenant_id, full_name, etc.)
    │
    ├── user_roles          ← Links users to roles
    │       │
    │       └── roles       ← Role definitions (platform_admin, product_editor, etc.)
    │
    ├── user_settings       ← User preferences (theme, language)
    │
    └── pending_invitations ← Invitation records before user signs up
```

### How It Works

1. **Invitation**: `platform_admin` creates a `pending_invitations` record with email, role, and tenant
2. **Email**: Supabase sends an invitation email to the user
3. **Sign-up**: User clicks link, sets password, Supabase creates `auth.users` record
4. **Trigger**: Database trigger `on_auth_user_created` automatically creates:
   - `profiles` record
   - `user_settings` record
   - `user_roles` record (linking user to invited role)
5. **Claim**: Invitation is marked as claimed

---

## Database Setup

### Environment Variables

Add these to your `.env` (or `.env.local`):

```env
# Supabase Configuration (same instance as Product Catalog Portal)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# For server-side operations (invitation sending)
# IMPORTANT: Never expose this in client-side code
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Platform Tenant

PMP users belong to the **platform tenant**. Query to find it:

```sql
SELECT id, name, slug FROM tenants WHERE tenant_type = 'platform';
```

This tenant ID is used when creating invitations for PMP users.

---

## Supabase Client Setup

### Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Create Supabase Client (`src/lib/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

### Create Service Role Client (for admin operations)

**IMPORTANT**: Only use this server-side or in secure backend functions. Never expose the service role key to the client.

```javascript
// src/lib/supabase-admin.js (server-side only)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
```

---

## Authentication Flows

### Flow 1: Sign In (Existing User)

```javascript
// Sign in with email and password
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Handle error - do NOT reveal if user exists
    // Always show generic "Invalid email or password"
    throw new Error('Invalid email or password')
  }

  return data
}
```

### Flow 2: Sign Out

```javascript
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  // Redirect to sign-in page
  window.location.href = '/sign-in'
}
```

### Flow 3: Get Current User with Roles

```javascript
const getCurrentUser = async () => {
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Get user's roles using the RPC function
  const { data: roles, error: rolesError } = await supabase
    .rpc('get_user_roles', { p_user_id: user.id })

  if (rolesError) {
    console.error('Error fetching roles:', rolesError)
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    profile,
    roles: roles || [],
    isPlatformAdmin: roles?.some(r => r.role_name === 'platform_admin') || false,
    isProductEditor: roles?.some(r => r.role_name === 'product_editor') || false,
    isProductsViewer: roles?.some(r => r.role_name === 'products_viewer') || false,
  }
}
```

### Flow 4: Listen to Auth State Changes

```javascript
// In your main App component or auth context
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Fetch user data and roles
        const user = await getCurrentUser()
        setUser(user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## Authorization & Role Checks

### Check if User Has Role

```javascript
// Using the existing RPC function
const hasRole = async (userId, roleName) => {
  const { data, error } = await supabase
    .rpc('has_role', { p_user_id: userId, p_role_name: roleName })

  return data === true
}

// Usage
const canEditProducts = await hasRole(user.id, 'product_editor')
const canViewProducts = await hasRole(user.id, 'products_viewer')
const isAdmin = await hasRole(user.id, 'platform_admin')
```

### Client-Side Role Check (from cached user data)

```javascript
// In your auth context, after fetching user with roles
const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

// Check roles
const { isPlatformAdmin, isProductEditor, isProductsViewer, roles } = useAuth()

// Can edit = platform_admin OR product_editor
const canEdit = isPlatformAdmin || isProductEditor

// Can view = any of the PMP roles
const canView = isPlatformAdmin || isProductEditor || isProductsViewer
```

### Role Hierarchy for PMP

```
platform_admin
    ├── Can invite users (product_editor, products_viewer)
    ├── Can manage ALL products (create, edit, delete)
    ├── Can view all products
    └── Full admin access

product_editor
    ├── Can create products
    ├── Can edit products
    ├── Can delete products
    └── Can view all products

products_viewer
    └── Can view all products (read-only)
```

---

## Protected Routes

### Create a ProtectedRoute Component

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({
  children,
  requiredRoles = [],  // e.g., ['platform_admin', 'product_editor']
  requireAny = true,   // true = any role matches, false = all roles required
}) => {
  const { user, loading, roles } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>Loading...</div> // Or your loading component
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const userRoleNames = roles.map(r => r.role_name)

    const hasAccess = requireAny
      ? requiredRoles.some(role => userRoleNames.includes(role))
      : requiredRoles.every(role => userRoleNames.includes(role))

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}
```

### Usage in Router

```javascript
// src/App.jsx or routes.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/sign-in" element={<SignIn />} />

        {/* Protected: Any authenticated PMP user */}
        <Route
          path="/products"
          element={
            <ProtectedRoute requiredRoles={['platform_admin', 'product_editor', 'products_viewer']}>
              <ProductsList />
            </ProtectedRoute>
          }
        />

        {/* Protected: Can edit products */}
        <Route
          path="/products/new"
          element={
            <ProtectedRoute requiredRoles={['platform_admin', 'product_editor']}>
              <CreateProduct />
            </ProtectedRoute>
          }
        />

        {/* Protected: Admin only */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRoles={['platform_admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## API Pattern Examples

### Invite User (Platform Admin Only)

```javascript
// This should be a server-side function or API endpoint
// Never expose service role key to client

const inviteUser = async (email, fullName, roleName) => {
  // 1. Get the platform tenant ID
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('tenant_type', 'platform')
    .single()

  if (!tenant) throw new Error('Platform tenant not found')

  // 2. Get the role ID
  const { data: role } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .is('tenant_id', null)  // System roles have null tenant_id
    .single()

  if (!role) throw new Error(`Role "${roleName}" not found`)

  // 3. Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  if (existingUser) {
    // User exists - just assign the role
    // Check if they already have this role
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', existingUser.id)
      .eq('role_id', role.id)
      .single()

    if (existingRole) {
      throw new Error('User already has this role')
    }

    // Assign the role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: existingUser.id,
        role_id: role.id,
        assigned_by: currentUserId, // The admin doing the invite
      })

    if (roleError) throw roleError

    return { message: 'Role assigned to existing user' }
  }

  // 4. Create pending invitation
  const { error: inviteError } = await supabaseAdmin
    .from('pending_invitations')
    .insert({
      email,
      tenant_id: tenant.id,
      role_id: role.id,
      full_name: fullName,
      invited_by: currentUserId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })

  if (inviteError) throw inviteError

  // 5. Send invitation email via Supabase Auth
  const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      pending_tenant_id: tenant.id,
      pending_role_id: role.id,
      full_name: fullName,
    },
    redirectTo: `${process.env.REACT_APP_URL}/auth/callback`,
  })

  if (emailError) throw emailError

  return { message: 'Invitation sent successfully' }
}
```

### Get Products (with Role-Based Filtering)

```javascript
const getProducts = async () => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // All PMP roles can view products - just fetch them
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data
}
```

### Create Product (Requires Editor Role)

```javascript
const createProduct = async (productData) => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check role (additional security - RLS should also enforce this)
  const canEdit = await hasRole(user.id, 'platform_admin') ||
                  await hasRole(user.id, 'product_editor')

  if (!canEdit) {
    throw new Error('Not authorized to create products')
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return data
}
```

---

## Migration File

Run this migration to add the new PMP roles to your Supabase database.

### File: `supabase/migrations/XXX_pmp_roles.sql`

```sql
-- =====================================================
-- PMP (Product Management Portal) Roles Migration
-- =====================================================
-- This migration adds roles specific to PMP:
-- - product_editor: Can create, edit, delete products
-- - products_viewer: Read-only access to products
-- =====================================================

-- Insert product_editor role (system role, tenant_id is NULL)
INSERT INTO roles (id, tenant_id, name, description, is_system, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  NULL,  -- System role (not tenant-specific)
  'product_editor',
  'Can create, edit, and delete products in PMP',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insert products_viewer role (system role, tenant_id is NULL)
INSERT INTO roles (id, tenant_id, name, description, is_system, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  NULL,  -- System role (not tenant-specific)
  'products_viewer',
  'Read-only access to products in PMP',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- =====================================================
-- Assign permissions to product_editor role
-- =====================================================
DO $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get product_editor role ID
  SELECT id INTO v_role_id FROM roles WHERE name = 'product_editor' AND tenant_id IS NULL;

  IF v_role_id IS NOT NULL THEN
    -- Create permissions if they don't exist, then assign them

    -- products:create
    INSERT INTO permissions (resource, action, description)
    VALUES ('products', 'create', 'Create new products')
    ON CONFLICT (resource, action) DO NOTHING;

    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'products' AND action = 'create';
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id, scope_type)
      VALUES (v_role_id, v_permission_id, 'all')
      ON CONFLICT (role_id, permission_id, scope_type, scope_value) DO NOTHING;
    END IF;

    -- products:read
    INSERT INTO permissions (resource, action, description)
    VALUES ('products', 'read', 'View products')
    ON CONFLICT (resource, action) DO NOTHING;

    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'products' AND action = 'read';
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id, scope_type)
      VALUES (v_role_id, v_permission_id, 'all')
      ON CONFLICT (role_id, permission_id, scope_type, scope_value) DO NOTHING;
    END IF;

    -- products:update
    INSERT INTO permissions (resource, action, description)
    VALUES ('products', 'update', 'Edit products')
    ON CONFLICT (resource, action) DO NOTHING;

    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'products' AND action = 'update';
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id, scope_type)
      VALUES (v_role_id, v_permission_id, 'all')
      ON CONFLICT (role_id, permission_id, scope_type, scope_value) DO NOTHING;
    END IF;

    -- products:delete
    INSERT INTO permissions (resource, action, description)
    VALUES ('products', 'delete', 'Delete products')
    ON CONFLICT (resource, action) DO NOTHING;

    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'products' AND action = 'delete';
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id, scope_type)
      VALUES (v_role_id, v_permission_id, 'all')
      ON CONFLICT (role_id, permission_id, scope_type, scope_value) DO NOTHING;
    END IF;
  END IF;
END $$;

-- =====================================================
-- Assign permissions to products_viewer role
-- =====================================================
DO $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get products_viewer role ID
  SELECT id INTO v_role_id FROM roles WHERE name = 'products_viewer' AND tenant_id IS NULL;

  IF v_role_id IS NOT NULL THEN
    -- products:read only
    INSERT INTO permissions (resource, action, description)
    VALUES ('products', 'read', 'View products')
    ON CONFLICT (resource, action) DO NOTHING;

    SELECT id INTO v_permission_id FROM permissions WHERE resource = 'products' AND action = 'read';
    IF v_permission_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id, scope_type)
      VALUES (v_role_id, v_permission_id, 'all')
      ON CONFLICT (role_id, permission_id, scope_type, scope_value) DO NOTHING;
    END IF;
  END IF;
END $$;

-- =====================================================
-- Verify the roles were created
-- =====================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM roles
  WHERE name IN ('product_editor', 'products_viewer')
  AND tenant_id IS NULL;

  IF v_count < 2 THEN
    RAISE WARNING 'Expected 2 PMP roles, found %', v_count;
  ELSE
    RAISE NOTICE 'PMP roles created successfully: product_editor, products_viewer';
  END IF;
END $$;
```

### How to Run the Migration

Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard > SQL Editor
2. Paste the migration SQL
3. Click "Run"

Option 2: Via Supabase CLI
```bash
supabase db push
```

Option 3: Via direct psql
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/XXX_pmp_roles.sql
```

---

## UI Recommendations

### Sign-In Page

- Simple email/password form
- No "Sign Up" link (invitation-only)
- "Forgot Password" link for password reset
- Show generic error "Invalid email or password" (never reveal if user exists)
- After sign-in, redirect to `/products` or last visited page

### User Management (Admin Only)

- Table showing all PMP users with their roles
- "Invite User" button that opens a form:
  - Email (required)
  - Full Name (optional)
  - Role dropdown: `product_editor`, `products_viewer`
- Show pending invitations with option to resend or cancel

### Navigation

- Show/hide menu items based on role:
  - "Products" - visible to all roles
  - "Create Product" - visible to `platform_admin`, `product_editor`
  - "User Management" - visible to `platform_admin` only

### Error Handling

- 401 Unauthorized: Redirect to sign-in
- 403 Forbidden: Show "Access Denied" page
- Session expired: Auto-redirect to sign-in with message

---

## Troubleshooting

### User Signs In But Has No Access

**Cause**: User exists in `auth.users` but has no PMP role.

**Diagnosis**:
```sql
SELECT
  u.email,
  array_agg(r.name) as roles
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email;
```

**Fix**: Assign the appropriate role:
```sql
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  (SELECT id FROM roles WHERE name = 'product_editor' AND tenant_id IS NULL),
  (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

### Invitation Not Received

**Causes**:
1. Email in spam folder
2. Supabase email rate limits
3. Missing `SUPABASE_SERVICE_ROLE_KEY`

**Check pending invitations**:
```sql
SELECT * FROM pending_invitations WHERE email = 'user@example.com';
```

### Profile/Roles Not Created After Sign-Up

**Cause**: The `on_auth_user_created` trigger is missing or broken.

**Check trigger exists**:
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**If missing, recreate**:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### RLS Blocking Queries

**Symptom**: Queries return empty results or permission denied.

**Cause**: Row Level Security policies are blocking access.

**Debug**: Run query as service role to compare:
```javascript
// This bypasses RLS
const { data } = await supabaseAdmin.from('products').select('*')
```

---

## Key Helper Functions (Already Exist in Database)

These RPC functions are available in Supabase:

| Function | Description | Usage |
|----------|-------------|-------|
| `get_user_roles(p_user_id)` | Returns all roles for a user | `supabase.rpc('get_user_roles', { p_user_id: userId })` |
| `has_role(p_user_id, p_role_name)` | Checks if user has specific role | `supabase.rpc('has_role', { p_user_id: userId, p_role_name: 'platform_admin' })` |
| `has_permission(p_user_id, p_resource, p_action, p_scope_type, p_scope_value)` | Checks specific permission | `supabase.rpc('has_permission', { p_user_id: userId, p_resource: 'products', p_action: 'create', p_scope_type: null, p_scope_value: null })` |
| `is_platform_admin(check_user_id)` | Quick check for platform admin | `supabase.rpc('is_platform_admin', { check_user_id: userId })` |

---

## Summary Checklist

- [ ] Set up Supabase client with correct environment variables
- [ ] Run the PMP roles migration
- [ ] Create AuthContext with user, roles, and helper functions
- [ ] Implement sign-in page (no sign-up)
- [ ] Create ProtectedRoute component for route guards
- [ ] Implement user invitation flow (admin only)
- [ ] Add role-based UI visibility (show/hide based on role)
- [ ] Test with different roles: `platform_admin`, `product_editor`, `products_viewer`

---

## Files to Create in PMP

```
src/
├── lib/
│   ├── supabase.js           # Client-side Supabase client
│   └── supabase-admin.js     # Server-side client (if needed)
├── contexts/
│   └── AuthContext.jsx       # Authentication context provider
├── components/
│   ├── ProtectedRoute.jsx    # Route guard component
│   └── ...
├── pages/
│   ├── SignIn.jsx            # Sign-in page
│   ├── Unauthorized.jsx      # Access denied page
│   └── ...
└── .env                      # Environment variables
```

---

**Document Version**: 1.0
**Last Updated**: 2026-02-04
**Applies To**: Product Management Portal (PMP) with shared Supabase instance
