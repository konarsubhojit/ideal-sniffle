import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { neon } from '@neondatabase/serverless';
import logger from '../utils/logger.js';

export function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info('Google OAuth callback', { 
        userId: profile.id, 
        email: profile.emails?.[0]?.value 
      });
      
      const existingUser = await sql`
        SELECT * FROM users WHERE google_id = ${profile.id}
      `;
      
      if (existingUser.length > 0) {
        await sql`
          UPDATE users 
          SET last_login = NOW() 
          WHERE google_id = ${profile.id}
        `;
        return done(null, existingUser[0]);
      }
      
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
  }));

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
}
