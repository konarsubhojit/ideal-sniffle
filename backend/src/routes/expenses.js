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

router.get('/', requireAuth, requireRole, async (req, res) => {
  try {
    logger.info('Fetching all expenses');
    const sql = getSql();
    const expenses = await sql`
      SELECT 
        e.id, 
        e.paid_by as "paidBy", 
        e.amount, 
        e.description, 
        e.created_at as "createdAt",
        e.updated_at as "updatedAt",
        e.created_by as "createdBy",
        e.updated_by as "updatedBy",
        cu.name as "createdByName",
        uu.name as "updatedByName"
      FROM expenses e
      LEFT JOIN users cu ON e.created_by = cu.id
      LEFT JOIN users uu ON e.updated_by = uu.id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
    `;
    logger.info('Expenses fetched successfully', { count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching expenses', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', requireAuth, requireContributor, async (req, res) => {
  try {
    const { paidBy, amount, description } = req.body;
    const userId = req.user.id;
    
    logger.info('Adding new expense', { paidBy, amount, description, userId });
    
    if (!paidBy || !amount) {
      logger.warn('Invalid expense data - missing required fields', { paidBy, amount });
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    const sql = getSql();
    const result = await sql`
      INSERT INTO expenses (paid_by, amount, description, created_by, updated_by)
      VALUES (${paidBy}, ${amount}, ${description || 'No description'}, ${userId}, ${userId})
      RETURNING id, paid_by as "paidBy", amount, description, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const expense = result[0];
    
    await logActivity(userId, 'CREATE', 'expense', expense.id, {
      paidBy,
      amount,
      description
    });
    
    logger.info('Expense added successfully', { expenseId: expense.id, paidBy, amount });
    res.status(201).json(expense);
  } catch (error) {
    logger.error('Error adding expense', error, { body: req.body });
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

router.put('/:id', requireAuth, requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const { paidBy, amount, description } = req.body;
    const userId = req.user.id;
    
    logger.info('Updating expense', { expenseId: id, paidBy, amount, description, userId });
    
    if (!paidBy || !amount) {
      logger.warn('Invalid expense data - missing required fields', { paidBy, amount });
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    const sql = getSql();
    const oldExpense = await sql`
      SELECT * FROM expenses WHERE id = ${id}
    `;
    
    if (oldExpense.length === 0) {
      logger.warn('Expense not found for update', { expenseId: id });
      return res.status(404).json({ error: 'Expense not found' });
    }

    const result = await sql`
      UPDATE expenses 
      SET 
        paid_by = ${paidBy}, 
        amount = ${amount}, 
        description = ${description || 'No description'},
        updated_by = ${userId},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, paid_by as "paidBy", amount, description, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const expense = result[0];
    
    await logActivity(userId, 'UPDATE', 'expense', expense.id, {
      old: {
        paidBy: oldExpense[0].paid_by,
        amount: oldExpense[0].amount,
        description: oldExpense[0].description
      },
      new: {
        paidBy,
        amount,
        description
      }
    });
    
    logger.info('Expense updated successfully', { expenseId: id });
    res.json(expense);
  } catch (error) {
    logger.error('Error updating expense', error, { expenseId: req.params.id });
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', requireAuth, requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    logger.info('Soft-deleting expense', { expenseId: id, userId });
    
    const sql = getSql();
    const expenseToDelete = await sql`
      SELECT * FROM expenses WHERE id = ${id} AND deleted_at IS NULL
    `;
    
    if (expenseToDelete.length === 0) {
      logger.warn('Expense not found or already deleted', { expenseId: id });
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Soft delete by setting deleted_at timestamp
    await sql`
      UPDATE expenses
      SET deleted_at = NOW(), deleted_by = ${userId}
      WHERE id = ${id}
    `;
    
    await logActivity(userId, 'DELETE', 'expense', id, {
      paidBy: expenseToDelete[0].paid_by,
      amount: expenseToDelete[0].amount,
      description: expenseToDelete[0].description
    });
    
    logger.info('Expense soft-deleted successfully', { expenseId: id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Error deleting expense', error, { expenseId: req.params.id });
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
