import express from 'express';
import { neon } from '@neondatabase/serverless';
import { getGroups, calculateSettlement, calculateOptimizedSettlements } from '../services/settlement.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorization.js';
import logger from '../utils/logger.js';

const router = express.Router();

function getSql() {
  return neon(process.env.DATABASE_URL);
}

router.get('/groups', requireAuth, requireRole, async (req, res) => {
  try {
    logger.info('Fetching groups from database');
    const sql = getSql();
    const groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    res.json(groups);
  } catch (error) {
    logger.error('Error fetching groups', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/settlement', requireAuth, requireRole, async (req, res) => {
  try {
    logger.info('Calculating settlement');
    
    const sql = getSql();
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description
      FROM expenses
      WHERE deleted_at IS NULL
    `;
    
    const groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    
    const settlement = calculateSettlement(expenses, groups);
    
    logger.info('Settlement calculated successfully');
    res.json(settlement);
  } catch (error) {
    logger.error('Error calculating settlement', error);
    res.status(500).json({ error: 'Failed to calculate settlement' });
  }
});

router.get('/settlement/optimized', requireAuth, requireRole, async (req, res) => {
  try {
    logger.info('Calculating optimized settlements');
    
    const sql = getSql();
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description
      FROM expenses
      WHERE deleted_at IS NULL
    `;
    
    const groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    
    const optimizedSettlements = calculateOptimizedSettlements(expenses, groups);
    
    logger.info('Optimized settlements calculated successfully', { 
      transactionCount: optimizedSettlements.length 
    });
    res.json(optimizedSettlements);
  } catch (error) {
    logger.error('Error calculating optimized settlements', error);
    res.status(500).json({ error: 'Failed to calculate optimized settlements' });
  }
});

export default router;
