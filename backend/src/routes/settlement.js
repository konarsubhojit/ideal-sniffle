import express from 'express';
import { neon } from '@neondatabase/serverless';
import { getGroups, calculateSettlement, calculateOptimizedSettlements } from '../services/settlement.js';
import logger from '../utils/logger.js';

const router = express.Router();

function getSql() {
  return neon(process.env.DATABASE_URL);
}

router.get('/groups', (req, res) => {
  logger.info('Fetching groups');
  res.json(getGroups());
});

router.get('/settlement', async (req, res) => {
  try {
    logger.info('Calculating settlement');
    
    const sql = getSql();
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description
      FROM expenses
    `;
    
    const settlement = calculateSettlement(expenses);
    
    logger.info('Settlement calculated successfully');
    res.json(settlement);
  } catch (error) {
    logger.error('Error calculating settlement', error);
    res.status(500).json({ error: 'Failed to calculate settlement' });
  }
});

router.get('/settlement/optimized', async (req, res) => {
  try {
    logger.info('Calculating optimized settlements');
    
    const sql = getSql();
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description
      FROM expenses
    `;
    
    const optimizedSettlements = calculateOptimizedSettlements(expenses);
    
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
