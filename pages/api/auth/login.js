import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { compare } from 'bcryptjs';

// Simple in-memory rate limiting (replace with Redis in production)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  
  // Clean old attempts
  const recentAttempts = attempts.filter(time => now - time < WINDOW_MS);
  loginAttempts.set(ip, recentAttempts);
  
  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip) {
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(Date.now());
  loginAttempts.set(ip, attempts);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.socket.remoteAddress;
    
    if (isRateLimited(ip)) {
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.' 
      });
    }

    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

    if (!ADMIN_PASSWORD_HASH) {
      console.error('ADMIN_PASSWORD_HASH is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Compare password with hash
    const isValid = await compare(password, ADMIN_PASSWORD_HASH);

    if (isValid) {
      // Generate JWT token
      const token = jwt.sign(
        { role: 'admin' }, 
        process.env.JWT_SECRET || 'dev_secret', 
        { expiresIn: '8h' }
      );

      // Set secure cookie
      res.setHeader('Set-Cookie', cookie.serialize('nandan_admin', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8 // 8 hours
      }));

      // Clear rate limiting for this IP on successful login
      loginAttempts.delete(ip);

      return res.status(200).json({ success: true });
    } else {
      recordAttempt(ip);
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}