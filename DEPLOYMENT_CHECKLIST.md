# Deployment Checklist for RBAC & Soft-Delete Update

## Pre-Deployment

- [ ] Review all changes in this PR
- [ ] Ensure DATABASE_URL is correctly configured
- [ ] Verify JWT_SECRET and SESSION_SECRET are set (production)
- [ ] Backup database before deployment

## Deployment Steps

### 1. Deploy Backend

```bash
# The backend will automatically run migrations on startup
# Migrations create:
# - role column in users table
# - deleted_at, deleted_by columns in expenses table  
# - groups table
# - group_members table
# - Migrate hardcoded groups to database
```

### 2. Assign Initial Admin Role

**CRITICAL**: After deployment, all users will have `role = NULL` and cannot access the app.

Connect to your Neon database and run:

```sql
-- List all users
SELECT id, email, name, role FROM users;

-- Assign yourself as admin (replace with your email)
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Deploy Frontend

```bash
# No special configuration needed
# Frontend automatically detects user roles
```

### 4. Verify Deployment

- [ ] Log in with admin account
- [ ] Verify role badge shows "Admin" in header
- [ ] Create a test expense
- [ ] Delete test expense (should soft-delete)
- [ ] Verify deleted expense doesn't appear in list
- [ ] Check groups are loaded from database
- [ ] Verify settlements still calculate correctly

### 5. Assign Roles to Other Users

In the database, run:

```sql
-- Assign contributor role
UPDATE users SET role = 'contributor' WHERE email = 'contributor@example.com';

-- Assign reader role  
UPDATE users SET role = 'reader' WHERE email = 'viewer@example.com';
```

Ask users to log out and log back in to refresh their tokens.

## Post-Deployment

### Monitoring

Monitor for:
- Migration errors in backend logs
- Authentication/authorization failures
- Users reporting 403 errors

### User Communication

Inform all users:
1. The "Reset All" feature has been removed for safety
2. They may see a 403 error and need to contact you for role assignment
3. They should log out and log back in after role assignment

## Rollback Plan

If issues occur:

### Database Rollback

```sql
-- Remove new columns (if needed)
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE expenses DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE expenses DROP COLUMN IF EXISTS deleted_by;

-- Drop new tables (if needed)  
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
```

### Application Rollback

1. Revert to previous deployment
2. Database columns will remain but won't cause issues
3. Groups will revert to hardcoded values

## Testing Checklist

### Role-Based Access

- [ ] Admin can create/update/delete expenses
- [ ] Admin can create/update/delete groups
- [ ] Contributor can create/update/delete expenses
- [ ] Contributor can create/update groups
- [ ] Contributor cannot delete groups
- [ ] Reader can only view data
- [ ] Reader cannot modify anything
- [ ] User with no role sees 403 error

### Soft-Delete

- [ ] Deleted expenses don't appear in expense list
- [ ] Deleted expenses excluded from settlements
- [ ] Activity log shows deletion
- [ ] Database still has deleted expense with deleted_at timestamp

### Groups

- [ ] Existing hardcoded groups appear in database
- [ ] Can create new group
- [ ] Can update group name/count
- [ ] Can delete unused group
- [ ] Cannot delete group used in expenses
- [ ] Settlement calculations work with database groups

### UX

- [ ] Role badge displays correctly in header
- [ ] Snackbar notifications show for actions
- [ ] Delete confirmation dialog appears
- [ ] Loading states work properly
- [ ] Mobile responsive design works

## Common Issues & Solutions

### Issue: All users see 403 error

**Solution**: Assign admin role to at least one user in database

### Issue: Groups not showing

**Solution**: Check backend logs for migration errors. Restart backend to retry migrations.

### Issue: "Reset All" button still visible

**Solution**: Clear browser cache and reload

### Issue: Authentication errors after deployment

**Solution**: Users need to log out and log back in to get new JWT tokens with role information

## Support

For issues during deployment:
1. Check backend logs for errors
2. Verify database migrations completed
3. Confirm environment variables are set
4. Review RBAC_GUIDE.md for detailed documentation
