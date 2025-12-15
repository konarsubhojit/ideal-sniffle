import jwt from 'jsonwebtoken';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret-key-only-for-development';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'; // 7 days default

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
  logger.warn('SECURITY WARNING: Using default JWT secret in production. Set JWT_SECRET or SESSION_SECRET environment variable.');
}

export function generateToken(user) {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    };
    
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      issuer: 'ideal-sniffle-backend'
    });
    
    logger.info('JWT token generated', { userId: user.id });
    return token;
  } catch (error) {
    logger.error('Error generating JWT token', error);
    throw error;
  }
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ideal-sniffle-backend'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT token expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid JWT token', { error: error.message });
    } else {
      logger.error('Error verifying JWT token', error);
    }
    return null;
  }
}
