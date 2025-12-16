import { verifyToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export function requireAuth(req, res, next) {
  // First, try JWT authentication from Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    if (decoded) {
      // Attach user info to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: decoded.role || null
      };
      logger.debug('User authenticated via JWT', { userId: decoded.id, role: decoded.role });
      return next();
    } else {
      logger.warn('Invalid or expired JWT token');
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
  }
  
  // Fall back to session-based authentication for backwards compatibility
  if (req.isAuthenticated()) {
    logger.debug('User authenticated via session', { userId: req.user.id, role: req.user.role });
    return next();
  }
  
  logger.warn('Authentication required - no valid token or session');
  res.status(401).json({ error: 'Authentication required' });
}

export function optionalAuth(req, res, next) {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: decoded.role || null
      };
    }
  }
  
  // If no JWT, req.user might still be set from session
  next();
}
