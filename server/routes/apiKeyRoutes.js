import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { authenticateActor } from '../auth.js';

const router = express.Router();

// List all agent API keys
router.get('/', authenticateActor, async (req, res) => {
  try {
    const keys = await query(`
      SELECT id, agent_name, prefix, status, created_at
      FROM api_keys
      ORDER BY created_at DESC
    `);
    return res.json(keys);
  } catch (err) {
    console.error('List API keys error:', err);
    return res.status(500).json({ error: 'Failed to retrieve agent keys' });
  }
});

// Generate new Agent API Key
router.post('/', authenticateActor, async (req, res) => {
  try {
    const { agentName } = req.body;
    if (!agentName || !agentName.trim()) {
      return res.status(400).json({ error: 'Agent name is required (e.g., "Claude Desktop" or "Cursor Bot")' });
    }

    const cleanName = agentName.trim();
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawKey = `vf_agent_live_${rawSecret}`;
    const prefix = `vf_agent_live_${rawSecret.substring(0, 6)}...`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyId = 'key_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');

    await query(
      `INSERT INTO api_keys (id, agent_name, key_hash, prefix, status, created_by_user_id)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [keyId, cleanName, keyHash, prefix, req.actor.id || null]
    );

    // Return plain text key once
    return res.status(201).json({
      message: 'Agent API Key generated successfully. Please copy it now as it will not be displayed again.',
      apiKey: rawKey,
      keyId,
      agentName: cleanName,
      prefix,
      claudeConfigSnippet: {
        mcpServers: {
          vocalflow: {
            command: "node",
            args: ["<path-to-tracker>/server/mcp-runner.js"],
            env: {
              VOCALFLOW_API_URL: `http://localhost:${process.env.PORT || 3001}/api`,
              VOCALFLOW_API_KEY: rawKey
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Create API key error:', err);
    return res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Revoke or delete an API key
router.delete('/:id', authenticateActor, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM api_keys WHERE id = ?`, [id]);
    return res.json({ message: 'API key successfully revoked and removed' });
  } catch (err) {
    console.error('Revoke API key error:', err);
    return res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;
