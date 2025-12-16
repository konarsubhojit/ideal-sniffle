# Role-Based Access Control (RBAC) Guide

## Overview

The application now implements role-based access control to restrict access to authorized users only.

## User Roles

### Admin
- **Full access** to all features
- Can manage groups (create, update, delete)
- Can manage expenses (create, update, delete)
- Can view all data

### Contributor
- Can manage groups (create, update)
- Can manage expenses (create, update, delete)
- Can view all data
- **Cannot** delete groups

### Reader
- **Read-only access**
- Can view expenses, settlements, and groups
- **Cannot** create, update, or delete anything

### No Role (null)
- **403 Forbidden** - No access to the application
- Must contact an administrator to be assigned a role

## Assigning Roles

Roles must be assigned directly in the database. There is no UI for this yet.

### Using SQL

Connect to your Neon database and run:

```sql
-- List all users
SELECT id, email, name, role FROM users;

-- Assign admin role
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Assign contributor role
UPDATE users SET role = 'contributor' WHERE email = 'user@example.com';

-- Assign reader role
UPDATE users SET role = 'reader' WHERE email = 'viewer@example.com';

-- Remove role (deny access)
UPDATE users SET role = NULL WHERE email = 'blocked@example.com';
```

## First-Time Setup

When deploying this update, **all existing users will have `role = NULL`** and will see a 403 Forbidden page.

**You must assign at least one admin user** to be able to use the application:

1. Log in to your Neon database console
2. Run the SQL to assign admin role to yourself:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Log out and log back in to the application

## API Endpoints & Permissions

| Endpoint | Admin | Contributor | Reader |
|----------|-------|-------------|--------|
| GET /api/expenses | ✓ | ✓ | ✓ |
| POST /api/expenses | ✓ | ✓ | ✗ |
| PUT /api/expenses/:id | ✓ | ✓ | ✗ |
| DELETE /api/expenses/:id | ✓ | ✓ | ✗ |
| GET /api/groups | ✓ | ✓ | ✓ |
| POST /api/groups | ✓ | ✓ | ✗ |
| PUT /api/groups/:id | ✓ | ✓ | ✗ |
| DELETE /api/groups/:id | ✓ | ✗ | ✗ |
| GET /api/settlement | ✓ | ✓ | ✓ |
| GET /api/activity | ✓ | ✓ | ✓ |

## Soft-Delete for Expenses

Expenses are now **soft-deleted** instead of permanently deleted:

- When you delete an expense, it sets `deleted_at` timestamp
- Deleted expenses are excluded from:
  - Expense listings
  - Settlement calculations
  - Reports
- Deleted expenses remain in the database for audit purposes
- Only admins can view or restore deleted expenses (future feature)

## Groups Management

Groups are now **stored in the database** instead of being hardcoded:

- Groups are migrated automatically on first startup
- Admins and contributors can create new groups
- Admins and contributors can edit group names and member counts
- Only admins can delete groups
- Groups cannot be deleted if they're used in any active expenses

## Security Notes

### CSRF Protection
- The app uses JWT tokens via Authorization header for most operations
- Session-based auth is still available as fallback
- CSRF protection for session cookies is planned for a future update
- For now, ensure you're using JWT authentication in production

### JWT Token Security
- Tokens are passed via URL hash fragments (not query params)
- Tokens expire after 7 days (configurable via JWT_EXPIRY)
- Tokens include user role information
- Always use HTTPS in production

## Troubleshooting

### "403 - Access Forbidden" Error

**Cause**: Your user account has no role assigned.

**Solution**: Contact an administrator to assign you a role, or assign it yourself in the database if you have access.

### "Authentication required" Error

**Cause**: Your JWT token has expired or is invalid.

**Solution**: Log out and log back in to get a new token.

### Groups Not Showing Up

**Cause**: Migration might not have run successfully.

**Solution**: Restart the backend server. Check logs for migration errors.

## Migration Notes

The database migrations run automatically when the backend starts:

1. Adds `role` column to `users` table
2. Adds `deleted_at` and `deleted_by` columns to `expenses` table
3. Creates `groups` table
4. Creates `group_members` table
5. Migrates hardcoded groups to database

If migrations fail, check:
- Database connection is working
- DATABASE_URL is correctly set
- User has sufficient permissions to ALTER tables
