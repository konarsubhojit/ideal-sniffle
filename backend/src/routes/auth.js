import express from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

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
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
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

router.get('/user', (req, res) => {
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

export default router;
