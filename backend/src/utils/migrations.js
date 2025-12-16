import { neon } from '@neondatabase/serverless';
import logger from './logger.js';

const HARDCODED_GROUPS = [
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

export async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    logger.info('Starting database migrations...');
    
    // Add role column to users table
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(50)
      `;
      logger.info('Added role column to users table');
    } catch (error) {
      logger.warn('Role column might already exist', error.message);
    }
    
    // Add soft-delete columns to expenses table
    try {
      await sql`
        ALTER TABLE expenses 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS category VARCHAR(100)
      `;
      logger.info('Added soft-delete and category columns to expenses table');
    } catch (error) {
      logger.warn('Soft-delete/category columns might already exist', error.message);
    }
    
    // Create groups table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          type VARCHAR(50) NOT NULL DEFAULT 'Internal',
          created_by INTEGER REFERENCES users(id),
          updated_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      logger.info('Created groups table');
    } catch (error) {
      logger.warn('Groups table might already exist', error.message);
    }
    
    // Create group_members table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS group_members (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES groups(id) NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_paying INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      logger.info('Created group_members table');
    } catch (error) {
      logger.warn('Group members table might already exist', error.message);
    }
    
    // Migrate hardcoded groups to database
    const existingGroups = await sql`SELECT COUNT(*) as count FROM groups`;
    if (existingGroups[0].count === 0) {
      logger.info('Migrating hardcoded groups to database...');
      
      for (const group of HARDCODED_GROUPS) {
        await sql`
          INSERT INTO groups (id, name, count, type, created_at, updated_at)
          VALUES (${group.id}, ${group.name}, ${group.count}, ${group.type}, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `;
      }
      
      // Reset sequence to start from max ID + 1
      await sql`
        SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups))
      `;
      
      logger.info(`Migrated ${HARDCODED_GROUPS.length} groups to database`);
    } else {
      logger.info('Groups already exist in database, skipping migration');
    }
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations', error);
    throw error;
  }
}
