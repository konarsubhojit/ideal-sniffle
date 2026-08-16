import express from 'express';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin, requireRole, ROLES } from '../middleware/authorization.js';
import logger from '../utils/logger.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

function getSql() {
  return neon(process.env.DATABASE_URL);
}

router.patch('/me/digest-preference', requireAuth, requireRole, async (req, res) => {
  if (typeof req.body.optOut !== 'boolean') {
    return res.status(400).json({ error: 'optOut must be a boolean' });
  }
  try {
    const sql = getSql();
    const rows = await sql`
      UPDATE users
      SET digest_opt_out = ${req.body.optOut}
      WHERE id = ${req.user.id}
      RETURNING digest_opt_out as "optOut"
    `;
    await logActivity(req.user.id, 'UPDATE', 'digest_preference', req.user.id, {
      optOut: req.body.optOut,
    });

    res.json(rows[0]);
  } catch (error) {
    logger.error('Error updating digest preference', error);
    res.status(500).json({ error: 'Failed to update digest preference' });
  }
});

router.get('/me/digest-preference', requireAuth, requireRole, async (req, res) => {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT digest_opt_out as "optOut" FROM users WHERE id = ${req.user.id}
    `;
    res.json(rows[0] || { optOut: false });
  } catch (error) {
    logger.error('Error fetching digest preference', error);
    res.status(500).json({ error: 'Failed to fetch digest preference' });
  }
});

async function logActivity(userId, action, entityType, entityId, details = {}) {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (${userId}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(details)})
    `;
  } catch (error) {
    logger.error('Error logging activity', error);
  }
}

// List all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    logger.info('Fetching all users');
    const sql = getSql();
    const users = await sql`
      SELECT 
        id, 
        google_id as "googleId",
        email, 
        name, 
        picture, 
        role,
        created_at as "createdAt",
        last_login as "lastLogin"
      FROM users
      ORDER BY created_at DESC
    `;
    
    logger.info('Users fetched successfully', { count: users.length });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;
    
    logger.info('Updating user role', { userId: id, newRole: role, adminId });
    
    // Validate role using constants from authorization middleware
    const validRoles = [ROLES.ADMIN, ROLES.CONTRIBUTOR, ROLES.READER, null];
    if (role !== null && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        message: `Role must be one of: ${Object.values(ROLES).join(', ')}, or null`
      });
    }
    
    const sql = getSql();
    
    // Get old user data
    const oldUser = await sql`
      SELECT id, email, name, role FROM users WHERE id = ${id}
    `;
    
    if (oldUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update role
    const result = await sql`
      UPDATE users
      SET role = ${role}
      WHERE id = ${id}
      RETURNING id, email, name, role, picture, created_at as "createdAt", last_login as "lastLogin"
    `;
    
    const updatedUser = result[0];
    
    // Log the activity
    await logActivity(adminId, 'UPDATE', 'user_role', parseInt(id), {
      email: oldUser[0].email,
      oldRole: oldUser[0].role,
      newRole: role
    });
    
    logger.info('User role updated successfully', { userId: id, newRole: role });
    
    res.json({
      ...updatedUser,
      message: 'Role updated successfully. User must log out and log back in for the new permissions to take effect.'
    });
  } catch (error) {
    logger.error('Error updating user role', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get user statistics (admin only)
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sql = getSql();
    
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'contributor') as contributors,
        COUNT(*) FILTER (WHERE role = 'reader') as readers,
        COUNT(*) FILTER (WHERE role IS NULL) as no_role
      FROM users
    `;
    
    res.json(stats[0]);
  } catch (error) {
    logger.error('Error fetching user stats', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;
