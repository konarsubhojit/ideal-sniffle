import express from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { generateToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/google', authLimiter, passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', authLimiter, 
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' 
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateToken(req.user);
      
      // Redirect to frontend with token in URL hash (more secure than query params)
      // Hash fragments are not sent to the server and don't appear in server logs
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}#token=${encodeURIComponent(token)}`);
    } catch (error) {
      logger.error('Error generating token in OAuth callback', error);
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Error logging out', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/user', requireAuth, (req, res) => {
  // requireAuth middleware ensures req.user is set (from JWT or session)
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture
  });
});

export default router;
