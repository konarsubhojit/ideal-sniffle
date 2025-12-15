import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logging utility
const logger = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  error: (message, error = {}, data = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error.message || error,
      stack: error.stack,
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...data
      }));
    }
  }
};

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Initialize Neon database connection
let sql;
try {
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    throw new Error('DATABASE_URL is required');
  }
  sql = neon(process.env.DATABASE_URL);
  logger.info('Database connection initialized', {
    host: process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'
  });
} catch (error) {
  logger.error('Failed to initialize database connection', error);
  throw error;
}

// Initialize database table
async function initDatabase() {
  try {
    logger.info('Initializing database schema...');
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        paid_by INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing database schema', error);
    throw error;
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    logger.info('Fetching all expenses');
    const expenses = await sql`
      SELECT id, paid_by as "paidBy", amount, description, created_at as "createdAt"
      FROM expenses
      ORDER BY created_at DESC
    `;
    logger.info('Expenses fetched successfully', { count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching expenses', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Add new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { paidBy, amount, description } = req.body;
    
    logger.info('Adding new expense', { paidBy, amount, description });
    
    if (!paidBy || !amount) {
      logger.warn('Invalid expense data - missing required fields', { paidBy, amount });
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    const result = await sql`
      INSERT INTO expenses (paid_by, amount, description)
      VALUES (${paidBy}, ${amount}, ${description || 'No description'})
      RETURNING id, paid_by as "paidBy", amount, description, created_at as "createdAt"
    `;
    
    logger.info('Expense added successfully', { expenseId: result[0].id, paidBy, amount });
    res.status(201).json(result[0]);
  } catch (error) {
    logger.error('Error adding expense', error, { body: req.body });
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('Deleting expense', { expenseId: id });
    
    const result = await sql`
      DELETE FROM expenses
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      logger.warn('Expense not found for deletion', { expenseId: id });
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    logger.info('Expense deleted successfully', { expenseId: id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Error deleting expense', error, { expenseId: req.params.id });
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Reset all expenses
app.delete('/api/expenses', async (req, res) => {
  try {
    logger.warn('Resetting all expenses - DELETE ALL operation initiated');
    await sql`DELETE FROM expenses`;
    logger.info('All expenses deleted successfully');
    res.json({ message: 'All expenses deleted successfully' });
  } catch (error) {
    logger.error('Error resetting expenses', error);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    path: req.path,
    body: req.body
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server (only for local development, not for Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    logger.info('Server started', { 
      port: PORT, 
      environment: process.env.NODE_ENV || 'development'
    });
    await initDatabase();
  });
} else {
  // For Vercel serverless, initialize database on first request
  let dbInitialized = false;
  app.use(async (req, res, next) => {
    if (!dbInitialized) {
      try {
        await initDatabase();
        dbInitialized = true;
      } catch (error) {
        logger.error('Failed to initialize database on serverless startup', error);
      }
    }
    next();
  });
}

// Export the Express app for Vercel
export default app;
