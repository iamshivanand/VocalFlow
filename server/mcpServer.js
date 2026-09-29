import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function createMcpServer({ apiUrl, apiKey }) {
  const server = new Server(
    {
      name: 'vocalflow-task-tracker',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const baseUrl = apiUrl || `http://localhost:${process.env.PORT || 3001}/api`;

  async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${endpoint}`, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error (${res.status}): ${errText}`);
    }
    return res.json();
  }

  // Define MCP Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'vocalflow_create_task',
          description: 'Create a new task ticket in VocalFlow. Automatically attributed to the calling agent.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title or summary' },
              description: { type: 'string', description: 'Comprehensive specifications, notes, or implementation details' },
              priority: {
                type: 'string',
                enum: ['urgent', 'high', 'medium', 'low'],
                description: 'Task priority level (default: medium)',
              },
              status: {
                type: 'string',
                enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
                description: 'Target lane status (default: todo)',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Category tags, e.g. ["backend", "stripe", "bug"]',
              },
              dueDate: {
                type: 'string',
                description: 'Due date in YYYY-MM-DD format',
              },
              subtasks: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of checklist subtask titles',
              },
            },
            required: ['title'],
          },
        },
        {
          name: 'vocalflow_list_tasks',
          description: 'List and filter tasks on the VocalFlow tracker board.',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['all', 'backlog', 'todo', 'in_progress', 'in_review', 'done'],
                description: 'Filter by column status lane',
              },
              priority: {
                type: 'string',
                enum: ['all', 'urgent', 'high', 'medium', 'low'],
                description: 'Filter by priority level',
              },
              search: {
                type: 'string',
                description: 'Search string matching title, description, or ID',
              },
              tag: {
                type: 'string',
                description: 'Filter by specific tag',
              },
            },
          },
        },
        {
          name: 'vocalflow_get_task',
          description: 'Get full details of a specific task ticket including subtasks and audit history.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'Ticket ID, e.g. "TK-101"' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'vocalflow_update_task',
          description: 'Update a task status, priority, description, or subtasks. Action is logged in the ticket audit history.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'Ticket ID to update (e.g. "TK-101")' },
              status: {
                type: 'string',
                enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
                description: 'New status lane for the ticket',
              },
              priority: {
                type: 'string',
                enum: ['urgent', 'high', 'medium', 'low'],
                description: 'New priority level',
              },
              title: { type: 'string', description: 'Updated title' },
              description: { type: 'string', description: 'Updated description' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'vocalflow_delete_task',
          description: 'Permanently remove a task ticket from the board.',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: { type: 'string', description: 'Ticket ID to delete (e.g. "TK-101")' },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'vocalflow_get_daily_briefing',
          description: 'Retrieve the executive daily standup briefing summarizing active, urgent, and overdue tasks.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Handle Tool Calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'vocalflow_create_task') {
        const subtasksFormatted = Array.isArray(args.subtasks)
          ? args.subtasks.map((st, i) => ({ id: `sub-${Date.now()}-${i}`, title: String(st), completed: false }))
          : [];

        const task = await apiCall('/tasks', 'POST', {
          title: args.title,
          description: args.description,
          priority: args.priority,
          status: args.status,
          tags: args.tags,
          dueDate: args.dueDate,
          subtasks: subtasksFormatted,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Task ${task.id} created successfully!\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}\nAttribution: ${task.createdBy.name} (${task.createdBy.type})`,
            },
          ],
        };
      }

      if (name === 'vocalflow_list_tasks') {
        const queryParams = new URLSearchParams();
        if (args.status) queryParams.set('status', args.status);
        if (args.priority) queryParams.set('priority', args.priority);
        if (args.search) queryParams.set('search', args.search);
        if (args.tag) queryParams.set('tag', args.tag);

        const tasks = await apiCall(`/tasks?${queryParams.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      if (name === 'vocalflow_get_task') {
        const task = await apiCall(`/tasks/${args.taskId}`);
        const history = await apiCall(`/tasks/${args.taskId}/history`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ task, auditHistory: history }, null, 2),
            },
          ],
        };
      }

      if (name === 'vocalflow_update_task') {
        const updated = await apiCall(`/tasks/${args.taskId}`, 'PUT', {
          status: args.status,
          priority: args.priority,
          title: args.title,
          description: args.description,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Task ${updated.id} updated successfully!\nStatus: ${updated.status}\nPriority: ${updated.priority}\nUpdated By: ${updated.updatedByName}`,
            },
          ],
        };
      }

      if (name === 'vocalflow_delete_task') {
        const res = await apiCall(`/tasks/${args.taskId}`, 'DELETE');
        return {
          content: [
            {
              type: 'text',
              text: res.message || `Task ${args.taskId} deleted.`,
            },
          ],
        };
      }

      if (name === 'vocalflow_get_daily_briefing') {
        const briefing = await apiCall('/tasks/briefing');
        return {
          content: [
            {
              type: 'text',
              text: `🎙️ Executive Daily Standup Briefing:\n\n${briefing.summaryText}\n\nMetrics:\n- Active Tasks: ${briefing.totalActive}\n- Urgent Items: ${briefing.urgentCount}\n- Due Today: ${briefing.dueTodayCount}\n- In Progress: ${briefing.inProgressCount}`,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${err.message}`,
          },
        ],
      };
    }
  });

  return server;
}
