import express from 'express';
import { neon } from '@neondatabase/serverless';
import logger from '../utils/logger.js';

const router = express.Router();

function getSql() {
  return neon(process.env.DATABASE_URL);
}

router.get('/', async (req, res) => {
  try {
    const parsedLimit = parseInt(req.query.limit);
    const parsedOffset = parseInt(req.query.offset);
    
    if ((req.query.limit && isNaN(parsedLimit)) || (req.query.offset && isNaN(parsedOffset))) {
      return res.status(400).json({ error: 'Invalid limit or offset parameters' });
    }
    
    const limit = Math.max(1, Math.min(parsedLimit || 100, 1000));
    const offset = Math.max(0, parsedOffset || 0);
    
    logger.info('Fetching activity log', { limit, offset });
    
    const sql = getSql();
    const activities = await sql`
      SELECT 
        al.id,
        al.action,
        al.entity_type as "entityType",
        al.entity_id as "entityId",
        al.details,
        al.created_at as "createdAt",
        u.name as "userName",
        u.email as "userEmail",
        u.picture as "userPicture"
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    logger.info('Activity log fetched successfully', { count: activities.length });
    res.json(activities);
  } catch (error) {
    logger.error('Error fetching activity log', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

export default router;
