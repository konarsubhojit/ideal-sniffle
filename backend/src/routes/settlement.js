import express from 'express';
import { neon } from '@neondatabase/serverless';
import { getGroups, calculateSettlement, calculateOptimizedSettlements } from '../services/settlement.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorization.js';
import logger from '../utils/logger.js';
import { fetchGroupsWithMembers } from '../utils/groupHelpers.js';
import { Resend } from 'resend';
import { runSettlementDigest, verifyDigestSecret } from '../services/settlementDigest.js';

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
    
    let groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    
    // Fetch excluded members for all groups in a single query
    groups = await fetchGroupsWithMembers(sql, groups);
    
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
    
    let groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    
    // Fetch excluded members for all groups in a single query
    groups = await fetchGroupsWithMembers(sql, groups);
    
    const optimizedSettlements = calculateOptimizedSettlements(expenses, groups);
    
    logger.info('Optimized settlements calculated successfully', { 
      transactionCount: optimizedSettlements.length 
    });

    router.post('/settlement/digest', verifyDigestSecret, async (req, res) => {
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
        return res.status(503).json({ error: 'Settlement email is not configured' });
      }
      try {
        const sql = getSql();
        const expenses = await sql`
          SELECT id, paid_by as "paidBy", amount, description
          FROM expenses
          WHERE deleted_at IS NULL
        `;
        let groups = await sql`
          SELECT id, name, count, type FROM groups ORDER BY id
        `;
        groups = await fetchGroupsWithMembers(sql, groups);
        const recipients = await sql`
          SELECT id, email, name, settlement_group_id as "groupId"
          FROM users
          WHERE email IS NOT NULL
            AND settlement_group_id IS NOT NULL
            AND digest_opt_out = FALSE
            AND role IS NOT NULL
        `;
        const period = new Date().toISOString().slice(0, 7);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const result = await runSettlementDigest({
          period,
          recipients,
          transactions: calculateOptimizedSettlements(expenses, groups),
          claimDelivery: async (deliveryPeriod, userId) => {
            const rows = await sql`
              INSERT INTO digest_deliveries (period, user_id)
              VALUES (${deliveryPeriod}, ${userId})
              ON CONFLICT (period, user_id) DO NOTHING
              RETURNING id
            `;
            return rows.length > 0;
          },
          releaseDelivery: async (deliveryPeriod, userId) => {
            await sql`
              DELETE FROM digest_deliveries
              WHERE period = ${deliveryPeriod} AND user_id = ${userId}
            `;
          },
          sendEmail: async email => {
            const response = await resend.emails.send({
              from: process.env.RESEND_FROM,
              ...email,
            });
            if (response.error) throw new Error(response.error.message);
            return response.data;
          },
        });
        res.json({ period, ...result });
      } catch (error) {
        logger.error('Error sending settlement digest', error);
        res.status(500).json({ error: 'Failed to send settlement digest' });
      }
    });
    res.json(optimizedSettlements);
  } catch (error) {
    logger.error('Error calculating optimized settlements', error);
    res.status(500).json({ error: 'Failed to calculate optimized settlements' });
  }
});

export default router;
