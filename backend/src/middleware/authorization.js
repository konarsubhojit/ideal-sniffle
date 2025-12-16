import logger from '../utils/logger.js';

const ROLES = {
  ADMIN: 'admin',
  CONTRIBUTOR: 'contributor',
  READER: 'reader'
};

/**
 * Middleware to check if user has a valid role
 * Users without a role (null/undefined) should get 403
 */
export function requireRole(req, res, next) {
  if (!req.user) {
    logger.warn('Authorization check failed - no user');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.role) {
    logger.warn('Authorization check failed - user has no role', { userId: req.user.id, email: req.user.email });
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'You do not have permission to access this application. Please contact an administrator.'
    });
  }
  
  logger.debug('User has valid role', { userId: req.user.id, role: req.user.role });
  next();
}

/**
 * Middleware to check if user has one of the specified roles
 * @param {Array<string>} allowedRoles - Array of allowed role names
 */
export function requireAnyRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization check failed - no user');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.role) {
      logger.warn('Authorization check failed - user has no role', { userId: req.user.id, email: req.user.email });
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: 'You do not have permission to access this application. Please contact an administrator.'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization check failed - insufficient permissions', { 
        userId: req.user.id, 
        userRole: req.user.role,
        requiredRoles: allowedRoles 
      });
      return res.status(403).json({ 
        error: 'Access forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    logger.debug('User authorized', { userId: req.user.id, role: req.user.role });
    next();
  };
}

/**
 * Middleware to check if user is an admin
 */
export function requireAdmin(req, res, next) {
  return requireAnyRole(ROLES.ADMIN)(req, res, next);
}

/**
 * Middleware to check if user can modify content (admin or contributor)
 */
export function requireContributor(req, res, next) {
  return requireAnyRole(ROLES.ADMIN, ROLES.CONTRIBUTOR)(req, res, next);
}

export { ROLES };
