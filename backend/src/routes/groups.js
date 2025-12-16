import express from 'express';
import { neon } from '@neondatabase/serverless';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, requireContributor, requireAdmin } from '../middleware/authorization.js';
import logger from '../utils/logger.js';

const router = express.Router();

function getSql() {
  return neon(process.env.DATABASE_URL);
}

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

// Get all groups
router.get('/', requireAuth, requireRole, async (req, res) => {
  try {
    logger.info('Fetching all groups');
    const sql = getSql();
    const groups = await sql`
      SELECT 
        g.id,
        g.name,
        g.count,
        g.type,
        g.created_at as "createdAt",
        g.updated_at as "updatedAt",
        cu.name as "createdByName",
        uu.name as "updatedByName"
      FROM groups g
      LEFT JOIN users cu ON g.created_by = cu.id
      LEFT JOIN users uu ON g.updated_by = uu.id
      ORDER BY g.id
    `;
    logger.info('Groups fetched successfully', { count: groups.length });
    res.json(groups);
  } catch (error) {
    logger.error('Error fetching groups', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get single group with members
router.get('/:id', requireAuth, requireRole, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching group details', { groupId: id });
    
    const sql = getSql();
    const group = await sql`
      SELECT 
        g.id,
        g.name,
        g.count,
        g.type,
        g.created_at as "createdAt",
        g.updated_at as "updatedAt"
      FROM groups g
      WHERE g.id = ${id}
    `;
    
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const members = await sql`
      SELECT id, name, is_paying as "isPaying"
      FROM group_members
      WHERE group_id = ${id}
      ORDER BY id
    `;
    
    res.json({ ...group[0], members });
  } catch (error) {
    logger.error('Error fetching group', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create new group
router.post('/', requireAuth, requireContributor, async (req, res) => {
  try {
    const { name, count, type, members } = req.body;
    const userId = req.user.id;
    
    logger.info('Creating new group', { name, count, type, userId });
    
    if (!name || !count || !type) {
      return res.status(400).json({ error: 'name, count, and type are required' });
    }
    
    const sql = getSql();
    const result = await sql`
      INSERT INTO groups (name, count, type, created_by, updated_by)
      VALUES (${name}, ${count}, ${type}, ${userId}, ${userId})
      RETURNING id, name, count, type, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const group = result[0];
    
    // Add members if provided
    if (members && Array.isArray(members) && members.length > 0) {
      for (const member of members) {
        await sql`
          INSERT INTO group_members (group_id, name, is_paying)
          VALUES (${group.id}, ${member.name}, ${member.isPaying ? 1 : 0})
        `;
      }
    }
    
    await logActivity(userId, 'CREATE', 'group', group.id, {
      name,
      count,
      type
    });
    
    logger.info('Group created successfully', { groupId: group.id });
    res.status(201).json(group);
  } catch (error) {
    logger.error('Error creating group', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', requireAuth, requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, count, type } = req.body;
    const userId = req.user.id;
    
    logger.info('Updating group', { groupId: id, name, count, type, userId });
    
    if (!name || !count || !type) {
      return res.status(400).json({ error: 'name, count, and type are required' });
    }
    
    const sql = getSql();
    const oldGroup = await sql`
      SELECT * FROM groups WHERE id = ${id}
    `;
    
    if (oldGroup.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const result = await sql`
      UPDATE groups 
      SET 
        name = ${name},
        count = ${count},
        type = ${type},
        updated_by = ${userId},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, count, type, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const group = result[0];
    
    await logActivity(userId, 'UPDATE', 'group', group.id, {
      old: {
        name: oldGroup[0].name,
        count: oldGroup[0].count,
        type: oldGroup[0].type
      },
      new: { name, count, type }
    });
    
    logger.info('Group updated successfully', { groupId: id });
    res.json(group);
  } catch (error) {
    logger.error('Error updating group', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    logger.info('Deleting group', { groupId: id, userId });
    
    const sql = getSql();
    
    // Check if group is used in any expenses
    const expensesUsingGroup = await sql`
      SELECT COUNT(*) as count 
      FROM expenses 
      WHERE paid_by = ${id} AND deleted_at IS NULL
    `;
    
    if (expensesUsingGroup[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete group that is used in expenses',
        message: `This group is used in ${expensesUsingGroup[0].count} expense(s). Please delete or reassign those expenses first.`
      });
    }
    
    const groupToDelete = await sql`
      SELECT * FROM groups WHERE id = ${id}
    `;
    
    if (groupToDelete.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Delete group members first
    await sql`DELETE FROM group_members WHERE group_id = ${id}`;
    
    // Delete group
    await sql`DELETE FROM groups WHERE id = ${id}`;
    
    await logActivity(userId, 'DELETE', 'group', id, {
      name: groupToDelete[0].name,
      count: groupToDelete[0].count,
      type: groupToDelete[0].type
    });
    
    logger.info('Group deleted successfully', { groupId: id });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Error deleting group', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Add member to group
router.post('/:id/members', requireAuth, requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isPaying } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: 'Member name is required' });
    }
    
    const sql = getSql();
    const result = await sql`
      INSERT INTO group_members (group_id, name, is_paying)
      VALUES (${id}, ${name}, ${isPaying ? 1 : 0})
      RETURNING id, name, is_paying as "isPaying"
    `;
    
    await logActivity(userId, 'CREATE', 'group_member', result[0].id, {
      groupId: id,
      name,
      isPaying
    });
    
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error adding group member', error);
    res.status(500).json({ error: 'Failed to add group member' });
  }
});

// Remove member from group
router.delete('/:id/members/:memberId', requireAuth, requireContributor, async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;
    
    const sql = getSql();
    const member = await sql`
      SELECT * FROM group_members WHERE id = ${memberId} AND group_id = ${id}
    `;
    
    if (member.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    await sql`DELETE FROM group_members WHERE id = ${memberId}`;
    
    await logActivity(userId, 'DELETE', 'group_member', memberId, {
      groupId: id,
      name: member[0].name
    });
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    logger.error('Error removing group member', error);
    res.status(500).json({ error: 'Failed to remove group member' });
  }
});

export default router;
