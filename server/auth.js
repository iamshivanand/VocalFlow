import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vocalflow_super_secret_jwt_key_2026';

export function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Unified Auth Middleware: Authenticates either JWT (Human) or API Key (AI Agent)
export async function authenticateActor(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-api-key'] || req.query.apiKey;

  if (!authHeader) {
    // Default to guest/voice local actor if no token provided in development mode
    req.actor = {
      type: 'human',
      name: 'Local Team Member',
      id: 'local_user',
      role: 'member',
    };
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();

  // 1. Check if token is an Agent API Key (starts with vf_agent_)
  if (token.startsWith('vf_agent_')) {
    try {
      const keys = await query(`SELECT * FROM api_keys WHERE status = 'active'`);
      for (const k of keys) {
        const isMatch = await bcrypt.compare(token, k.key_hash);
        if (isMatch) {
          req.actor = {
            type: 'agent',
            name: k.agent_name,
            id: k.id,
            role: 'agent',
          };
          return next();
        }
      }
      return res.status(401).json({ error: 'Invalid or revoked Agent API key' });
    } catch (err) {
      console.error('API key auth error:', err);
      return res.status(500).json({ error: 'Authentication internal error' });
    }
  }

  // 2. Otherwise verify as JWT User Token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.actor = {
      type: 'human',
      name: decoded.name,
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'member',
    };
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

// Admin guard
export function requireAdmin(req, res, next) {
  if (req.actor?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}
