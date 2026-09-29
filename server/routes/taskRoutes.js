import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { authenticateActor } from '../auth.js';

const router = express.Router();

function safeParseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatTaskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    order: row.order_index ?? 0,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    tags: safeParseJson(row.tags, []),
    subtasks: safeParseJson(row.subtasks, []),
    dueDate: row.due_date || undefined,
    createdBy: {
      type: row.created_by_type,
      name: row.created_by_name,
      id: row.created_by_id,
    },
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. List tasks with optional filtering
router.get('/', authenticateActor, async (req, res) => {
  try {
    const { status, priority, search, tag } = req.query;

    let sql = `SELECT * FROM tasks WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (priority && priority !== 'all') {
      sql += ` AND priority = ?`;
      params.push(priority);
    }
    if (search) {
      sql += ` AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(id) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY order_index ASC, created_at DESC`;

    const rows = await query(sql, params);
    let tasks = rows.map(formatTaskRow);

    if (tag && tag !== 'all') {
      tasks = tasks.filter(t => t.tags.includes(tag.toLowerCase()));
    }

    return res.json(tasks);
  } catch (err) {
    console.error('List tasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 2. Executive Daily Standup Briefing API
router.get('/briefing', authenticateActor, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM tasks WHERE status != 'done'`);
    const activeTasks = rows.map(formatTaskRow);

    const todayStr = new Date().toISOString().split('T')[0];
    const urgentTasks = activeTasks.filter(t => t.priority === 'urgent');
    const dueTodayTasks = activeTasks.filter(t => t.dueDate === todayStr);
    const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < todayStr);
    const inProgressTasks = activeTasks.filter(t => t.status === 'in_progress');

    let script = `Good day! You have ${activeTasks.length} active tasks across your board. `;
    if (urgentTasks.length > 0) {
      script += `Attention: ${urgentTasks.length} urgent ticket requires priority attention: ${urgentTasks.map(t => t.title).join(', ')}. `;
    }
    if (dueTodayTasks.length > 0) {
      script += `There are ${dueTodayTasks.length} tasks scheduled for completion today. `;
    }
    if (inProgressTasks.length > 0) {
      script += `You have ${inProgressTasks.length} tasks actively in progress. `;
    }
    script += `Let's keep momentum high and execute!`;

    return res.json({
      summaryText: script,
      totalActive: activeTasks.length,
      urgentCount: urgentTasks.length,
      dueTodayCount: dueTodayTasks.length,
      overdueCount: overdueTasks.length,
      inProgressCount: inProgressTasks.length,
      topTasks: activeTasks.slice(0, 3),
    });
  } catch (err) {
    console.error('Briefing error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

// 3. Get single task
router.get('/:id', authenticateActor, async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(formatTaskRow(rows[0]));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve task' });
  }
});

// 4. Create new task (stamped with Actor: Human or AI Agent)
router.post('/', authenticateActor, async (req, res) => {
  try {
    const { title, description, status, priority, tags, subtasks, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Determine next sequential ID: TK-101, TK-102...
    const countRows = await query(`SELECT id FROM tasks`);
    let highestNum = 100;
    countRows.forEach(row => {
      const match = row.id.match(/^TK-(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > highestNum) highestNum = n;
      }
    });
    const newId = `TK-${highestNum + 1}`;

    const actor = req.actor || { type: 'human', name: 'User' };
    const taskStatus = status || 'todo';
    const taskPriority = priority || 'medium';
    const taskTags = JSON.stringify(Array.isArray(tags) ? tags : []);
    const taskSubtasks = JSON.stringify(Array.isArray(subtasks) ? subtasks : []);
    const nowIso = new Date().toISOString();

    await query(
      `INSERT INTO tasks (
        id, order_index, title, description, status, priority, tags, subtasks,
        due_date, created_by_type, created_by_name, created_by_id, updated_by_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        0,
        title.trim(),
        description || '',
        taskStatus,
        taskPriority,
        taskTags,
        taskSubtasks,
        dueDate || null,
        actor.type,
        actor.name,
        actor.id || null,
        actor.name,
        nowIso,
        nowIso,
      ]
    );

    // Record creation in audit history
    const historyId = 'hist_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
    await query(
      `INSERT INTO task_history (id, task_id, actor_type, actor_name, action, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        newId,
        actor.type,
        actor.name,
        'created',
        JSON.stringify({ status: taskStatus, priority: taskPriority, title: title.trim() }),
        nowIso,
      ]
    );

    const createdRows = await query(`SELECT * FROM tasks WHERE id = ?`, [newId]);
    return res.status(201).json(formatTaskRow(createdRows[0]));
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// 5. Update task (status, priority, details, checklists)
router.put('/:id', authenticateActor, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT * FROM tasks WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const current = existing[0];
    const updates = req.body;
    const actor = req.actor || { type: 'human', name: 'User' };
    const nowIso = new Date().toISOString();

    const title = updates.title !== undefined ? updates.title.trim() : current.title;
    const description = updates.description !== undefined ? updates.description : current.description;
    const status = updates.status !== undefined ? updates.status : current.status;
    const priority = updates.priority !== undefined ? updates.priority : current.priority;
    const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : current.tags;
    const subtasks = updates.subtasks !== undefined ? JSON.stringify(updates.subtasks) : current.subtasks;
    const dueDate = updates.dueDate !== undefined ? updates.dueDate : current.due_date;

    await query(
      `UPDATE tasks SET
        title = ?, description = ?, status = ?, priority = ?, tags = ?,
        subtasks = ?, due_date = ?, updated_by_name = ?, updated_at = ?
       WHERE id = ?`,
      [title, description, status, priority, tags, subtasks, dueDate || null, actor.name, nowIso, id]
    );

    // Track Audit Log details
    const changes = {};
    if (current.status !== status) changes.status = { from: current.status, to: status };
    if (current.priority !== priority) changes.priority = { from: current.priority, to: priority };
    if (current.title !== title) changes.title = { from: current.title, to: title };

    const action = current.status !== status ? 'status_changed' : current.priority !== priority ? 'priority_changed' : 'edited';
    const historyId = 'hist_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');

    await query(
      `INSERT INTO task_history (id, task_id, actor_type, actor_name, action, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [historyId, id, actor.type, actor.name, action, JSON.stringify(changes), nowIso]
    );

    const updatedRows = await query(`SELECT * FROM tasks WHERE id = ?`, [id]);
    return res.json(formatTaskRow(updatedRows[0]));
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// 6. Delete task
router.delete('/:id', authenticateActor, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM tasks WHERE id = ?`, [id]);
    await query(`DELETE FROM task_history WHERE task_id = ?`, [id]);
    return res.json({ message: `Task ${id} deleted successfully` });
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// 7. Audit History Timeline for ticket
router.get('/:id/history', authenticateActor, async (req, res) => {
  try {
    const { id } = req.params;
    const historyRows = await query(
      `SELECT * FROM task_history WHERE task_id = ? ORDER BY created_at ASC`,
      [id]
    );

    const history = historyRows.map(r => ({
      id: r.id,
      taskId: r.task_id,
      actorType: r.actor_type,
      actorName: r.actor_name,
      action: r.action,
      details: safeParseJson(r.details, {}),
      createdAt: r.created_at,
    }));

    return res.json(history);
  } catch (err) {
    console.error('Task history error:', err);
    return res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

export default router;
