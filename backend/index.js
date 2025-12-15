import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser';
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
app.use(cookieParser());

// Session configuration
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  logger.error('SESSION_SECRET environment variable is required in production');
  throw new Error('SESSION_SECRET is required in production');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-only-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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

// Hardcoded groups as per requirement
const groups = [
  { id: 1, name: "Other Family", count: 3, type: "External" },
  { id: 2, name: "Subhojit Konar", count: 3, type: "Internal" },
  { id: 3, name: "Ravi Ranjan Verma", count: 3, type: "Internal" },
  { id: 4, name: "Abhijit Koner", count: 2, type: "Internal" },
  { id: 5, name: "Apurba Samanta", count: 2, type: "Internal" },
  { id: 6, name: "Gopal Samanta", count: 2, type: "Internal" },
  { id: 7, name: "Anupam Chakraborty", count: 2, type: "Internal" },
  { id: 8, name: "Arindra Sahana", count: 2, type: "Internal" },
  { id: 9, name: "Nupur Mondol", count: 2, type: "Internal" },
];

const TOTAL_BILLABLE_HEADS = 27;
const MAIN_FAMILY_PAYING_COUNT = 18;

// Passport Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth callback', { userId: profile.id, email: profile.emails?.[0]?.value });
        
        // Check if user exists
        const existingUser = await sql`
          SELECT * FROM users WHERE google_id = ${profile.id}
        `;
        
        if (existingUser.length > 0) {
          // Update last login
          await sql`
            UPDATE users 
            SET last_login = NOW() 
            WHERE google_id = ${profile.id}
          `;
          return done(null, existingUser[0]);
        }
        
        // Create new user
        const newUser = await sql`
          INSERT INTO users (google_id, email, name, picture)
          VALUES (
            ${profile.id},
            ${profile.emails?.[0]?.value || ''},
            ${profile.displayName || ''},
            ${profile.photos?.[0]?.value || ''}
          )
          RETURNING *
        `;
        
        logger.info('New user created', { userId: profile.id });
        return done(null, newUser[0]);
      } catch (error) {
        logger.error('Error in Google OAuth strategy', error);
        return done(error, null);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await sql`SELECT * FROM users WHERE id = ${id}`;
      done(null, user[0] || null);
    } catch (error) {
      done(error, null);
    }
  });
} else {
  logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set');
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Initialize database tables
async function initDatabase() {
  try {
    logger.info('Initializing database schema...');
    
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        name VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Expenses table (updated with user tracking)
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        paid_by INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Activity log table
    await sql`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    logger.info('Database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing database schema', error);
    throw error;
  }
}

// Helper function to log activity
async function logActivity(userId, action, entityType, entityId, details = {}) {
  try {
    await sql`
      INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
      VALUES (${userId}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(details)})
    `;
  } catch (error) {
    logger.error('Error logging activity', error);
  }
}

// Calculate settlement logic (moved from frontend)
function calculateSettlement(expenses) {
  const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;
  
  return groups.map(group => {
    const totalPaid = expenses
      .filter(exp => exp.paidBy === group.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    let fairShare;
    if (group.type === "External") {
      // Other Family pays base unit cost * their count
      fairShare = baseUnitCost * group.count;
    } else {
      // Main Family members share the remaining cost equally
      const otherFamilyCost = baseUnitCost * 3;
      const mainFamilyShare = (totalExpense - otherFamilyCost) / MAIN_FAMILY_PAYING_COUNT;
      fairShare = mainFamilyShare;
    }
    
    const balance = totalPaid - fairShare;
    
    return {
      ...group,
      totalPaid,
      fairShare,
      balance
    };
  });
}

// Calculate optimized settlements (moved from frontend)
function calculateOptimizedSettlements(expenses) {
  const settlement = calculateSettlement(expenses);
  
  // Separate creditors (people who should receive money) and debtors (people who should pay)
  const creditors = settlement.filter(s => s.balance > 0.01).map(s => ({
    id: s.id,
    name: s.name,
    amount: s.balance
  }));
  
  const debtors = settlement.filter(s => s.balance < -0.01).map(s => ({
    id: s.id,
    name: s.name,
    amount: Math.abs(s.balance)
  }));
  
  // Calculate optimized transactions
  const transactions = [];
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i].amount;
    const debt = debtors[j].amount;
    const settled = Math.min(credit, debt);
    
    if (settled > 0.01) {
      transactions.push({
        from: debtors[j].id,
        fromName: debtors[j].name,
        to: creditors[i].id,
        toName: creditors[i].name,
        amount: settled
      });
    }
    
    creditors[i].amount -= settled;
    debtors[j].amount -= settled;
    
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }
  
  return transactions;
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    authenticated: req.isAuthenticated()
  });
});

// Auth routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

app.get('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Error logging out', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Get groups
app.get('/api/groups', (req, res) => {
  logger.info('Fetching groups');
  res.json(groups);
});

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    logger.info('Fetching all expenses');
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
      ORDER BY e.created_at DESC
    `;
    logger.info('Expenses fetched successfully', { count: expenses.length });
    res.json(expenses);
  } catch (error) {
    logger.error('Error fetching expenses', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Add new expense (requires authentication)
app.post('/api/expenses', requireAuth, async (req, res) => {
  try {
    const { paidBy, amount, description } = req.body;
    const userId = req.user.id;
    
    logger.info('Adding new expense', { paidBy, amount, description, userId });
    
    if (!paidBy || !amount) {
      logger.warn('Invalid expense data - missing required fields', { paidBy, amount });
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    const result = await sql`
      INSERT INTO expenses (paid_by, amount, description, created_by, updated_by)
      VALUES (${paidBy}, ${amount}, ${description || 'No description'}, ${userId}, ${userId})
      RETURNING id, paid_by as "paidBy", amount, description, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const expense = result[0];
    
    // Log activity
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

// Update expense (requires authentication)
app.put('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paidBy, amount, description } = req.body;
    const userId = req.user.id;
    
    logger.info('Updating expense', { expenseId: id, paidBy, amount, description, userId });
    
    if (!paidBy || !amount) {
      logger.warn('Invalid expense data - missing required fields', { paidBy, amount });
      return res.status(400).json({ error: 'paidBy and amount are required' });
    }

    // Get old expense for activity log
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
    
    // Log activity
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

// Delete expense (requires authentication)
app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    logger.info('Deleting expense', { expenseId: id, userId });
    
    // Get expense details before deletion for activity log
    const expenseToDelete = await sql`
      SELECT * FROM expenses WHERE id = ${id}
    `;
    
    if (expenseToDelete.length === 0) {
      logger.warn('Expense not found for deletion', { expenseId: id });
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    const result = await sql`
      DELETE FROM expenses
      WHERE id = ${id}
      RETURNING id
    `;
    
    // Log activity
    await logActivity(userId, 'DELETE', 'expense', id, {
      paidBy: expenseToDelete[0].paid_by,
      amount: expenseToDelete[0].amount,
      description: expenseToDelete[0].description
    });
    
    logger.info('Expense deleted successfully', { expenseId: id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    logger.error('Error deleting expense', error, { expenseId: req.params.id });
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Reset all expenses (requires authentication)
app.delete('/api/expenses', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.warn('Resetting all expenses - DELETE ALL operation initiated', { userId });
    
    // Get count before deletion
    const count = await sql`SELECT COUNT(*) as count FROM expenses`;
    
    await sql`DELETE FROM expenses`;
    
    // Log activity
    await logActivity(userId, 'DELETE_ALL', 'expense', null, {
      count: count[0].count
    });
    
    logger.info('All expenses deleted successfully');
    res.json({ message: 'All expenses deleted successfully' });
  } catch (error) {
    logger.error('Error resetting expenses', error);
    res.status(500).json({ error: 'Failed to reset expenses' });
  }
});

// Get settlement calculation
app.get('/api/settlement', async (req, res) => {
  try {
    logger.info('Calculating settlement');
    
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

// Get optimized settlements
app.get('/api/settlement/optimized', async (req, res) => {
  try {
    logger.info('Calculating optimized settlements');
    
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

// Get activity log
app.get('/api/activity', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 100, 1000));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    
    // Validate that limit and offset are valid numbers
    if (isNaN(limit) || isNaN(offset)) {
      return res.status(400).json({ error: 'Invalid limit or offset parameters' });
    }
    
    logger.info('Fetching activity log', { limit, offset });
    
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
