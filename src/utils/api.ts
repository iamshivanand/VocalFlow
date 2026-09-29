import type { TaskTicket, TaskHistoryItem, UserProfile, AgentApiKey } from '../types/task';
import { StorageService } from './storage';

// In development, Vite runs on 5173 and backend on 3001. In production on Hostinger, both share origin.
const API_BASE = window.location.port === '5173'
  ? 'http://localhost:3001/api'
  : '/api';

const TOKEN_KEY = 'vocalflow_auth_token';

class ApiService {
  private token: string | null = localStorage.getItem(TOKEN_KEY);

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`API call ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // --- Auth APIs ---
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const data = await this.request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(name: string, email: string, password: string, role: string = 'member'): Promise<{ user: UserProfile; token: string }> {
    const data = await this.request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ user?: UserProfile; actor?: any }> {
    return this.request<{ user?: UserProfile; actor?: any }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // --- Tasks APIs ---
  async getTasks(params?: Record<string, string>): Promise<TaskTicket[]> {
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const serverTasks = await this.request<TaskTicket[]>(`/tasks${query}`);
      // Cache server tasks in local storage
      StorageService.saveTasks(serverTasks);
      return serverTasks;
    } catch (err) {
      // Offline fallback: load from LocalStorage
      console.info('Using offline LocalStorage task cache...');
      return StorageService.loadTasks();
    }
  }

  async createTask(task: Partial<TaskTicket>): Promise<TaskTicket> {
    try {
      const created = await this.request<TaskTicket>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return created;
    } catch (err) {
      // Local fallback
      const localId = StorageService.getNextTaskId(StorageService.loadTasks());
      const localTask: TaskTicket = {
        id: localId,
        order: 0,
        title: task.title || 'New Task',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        tags: task.tags || [],
        subtasks: task.subtasks || [],
        dueDate: task.dueDate,
        createdBy: { type: 'human', name: 'Offline User' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return localTask;
    }
  }

  async updateTask(id: string, updates: Partial<TaskTicket>): Promise<TaskTicket> {
    try {
      return await this.request<TaskTicket>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      // Local fallback
      const tasks = StorageService.loadTasks();
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
        StorageService.saveTasks(tasks);
        return tasks[idx];
      }
      throw err;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await this.request(`/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      const tasks = StorageService.loadTasks().filter(t => t.id !== id);
      StorageService.saveTasks(tasks);
    }
  }

  async getTaskHistory(id: string): Promise<TaskHistoryItem[]> {
    try {
      return await this.request<TaskHistoryItem[]>(`/tasks/${id}/history`);
    } catch {
      return [];
    }
  }

  async getBriefing(): Promise<{ summaryText: string; totalActive: number; urgentCount: number; dueTodayCount: number; inProgressCount: number; topTasks: TaskTicket[] }> {
    try {
      return await this.request('/tasks/briefing');
    } catch {
      // Fallback calculation from local tasks
      const tasks = StorageService.loadTasks();
      const active = tasks.filter(t => t.status !== 'done');
      return {
        summaryText: `You have ${active.length} active tasks across your board.`,
        totalActive: active.length,
        urgentCount: active.filter(t => t.priority === 'urgent').length,
        dueTodayCount: 0,
        inProgressCount: active.filter(t => t.status === 'in_progress').length,
        topTasks: active.slice(0, 3),
      };
    }
  }

  // --- API Key (Agent Management) APIs ---
  async getApiKeys(): Promise<AgentApiKey[]> {
    return this.request<AgentApiKey[]>('/api-keys');
  }

  async createApiKey(agentName: string): Promise<{ apiKey: string; keyId: string; agentName: string; prefix: string; claudeConfigSnippet: any }> {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ agentName }),
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.request(`/api-keys/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();
