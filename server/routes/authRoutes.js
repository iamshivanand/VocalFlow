import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signUserToken, authenticateActor } from '../auth.js';

const router = express.Router();

// Register new team member
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await query(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const userRole = role === 'admin' ? 'admin' : 'member';
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), email.toLowerCase().trim(), hash, userRole, avatar]
    );

    const user = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: userRole, avatar };
    const token = signUserToken(user);

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to register team member' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const users = await query(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    const token = signUserToken(userData);

    return res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Current user profile
router.get('/me', authenticateActor, async (req, res) => {
  if (req.actor.type !== 'human' || !req.actor.email) {
    return res.json({ actor: req.actor });
  }
  const users = await query(`SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?`, [req.actor.id]);
  if (users.length === 0) {
    return res.json({ actor: req.actor });
  }
  return res.json({ user: users[0], actor: req.actor });
});

// List all team members
router.get('/users', authenticateActor, async (req, res) => {
  try {
    const users = await query(`SELECT id, name, email, role, avatar FROM users ORDER BY name ASC`);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

export default router;
