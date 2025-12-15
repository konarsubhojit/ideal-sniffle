import dotenv from 'dotenv';
import app from './src/app.js';
import { initializeDatabase, createTables } from './src/config/database.js';
import logger from './src/utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    logger.info('Server started', { 
      port: PORT, 
      environment: process.env.NODE_ENV || 'development'
    });
    
    try {
      initializeDatabase();
      await createTables();
    } catch (error) {
      logger.error('Failed to initialize database', error);
      process.exit(1);
    }
  });
} else {
  let dbInitialized = false;
  
  app.use(async (req, res, next) => {
    if (!dbInitialized) {
      try {
        initializeDatabase();
        await createTables();
        dbInitialized = true;
      } catch (error) {
        logger.error('Failed to initialize database on serverless startup', error);
      }
    }
    next();
  });
}

export default app;
