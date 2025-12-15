import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL);

// Initialize database table
async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        paid_by INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description, created_at as "createdAt"
      FROM expenses
      ORDER BY created_at DESC
    `;
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Add new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { paidBy, amount, description } = req.body;
    
    if (!paidBy || !amount) {
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    const result = await sql`
      INSERT INTO expenses (paid_by, amount, description)
      VALUES (${paidBy}, ${amount}, ${description || 'No description'})
      RETURNING id, paid_by as "paidBy", amount, description, created_at as "createdAt"
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await sql`
      DELETE FROM expenses
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Reset all expenses
app.delete('/api/expenses', async (req, res) => {
  try {
    await sql`DELETE FROM expenses`;
    res.json({ message: 'All expenses deleted successfully' });
  } catch (error) {
    console.error('Error resetting expenses:', error);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});
