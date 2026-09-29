import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  TaskTicket, 
  Status, 
  ViewMode, 
  FilterState, 
  VoiceCommandResult,
  UserProfile
} from './types/task';
import { StorageService } from './utils/storage';
import { api } from './utils/api';
import { soundEffects } from './utils/audio';
import { speechFeedback } from './utils/speech';
import { useVoiceController } from './hooks/useVoiceController';
import { Header } from './components/Header';
import { VoiceHUD } from './components/VoiceHUD';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { DailyStandupModal } from './components/DailyStandupModal';
import { CommandPalette } from './components/CommandPalette';
import { VoiceHelpModal } from './components/VoiceHelpModal';
import { AgentKeysModal } from './components/AgentKeysModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskTicket[]>(() => StorageService.loadTasks());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    status: 'all',
    tag: 'all',
    creatorType: 'all',
    sortBy: 'order',
    sortDirection: 'asc',
  });

  const [selectedTask, setSelectedTask] = useState<TaskTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAgentKeysOpen, setIsAgentKeysOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Load live tasks from API
  const refreshTasks = useCallback(async () => {
    try {
      const serverTasks = await api.getTasks();
      setTasks(serverTasks);
    } catch {
      // Offline fallback already handled by StorageService
    }
  }, []);

  // Check auth & initial load
  useEffect(() => {
    refreshTasks();
    api.getMe()
      .then(res => {
        if (res?.user) setCurrentUser(res.user);
      })
      .catch(() => {});
  }, [refreshTasks]);

  // Celebration confetti when finishing tasks
  const fireConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#6366F1', '#38BDF8', '#F59E0B'],
    });
  };

  // Create new task helper (syncs with backend API)
  const handleCreateTask = useCallback(async (partial?: Partial<TaskTicket>) => {
    try {
      const created = await api.createTask({
        title: partial?.title || 'New Task',
        description: partial?.description || '',
        status: partial?.status || 'todo',
        priority: partial?.priority || 'medium',
        tags: partial?.tags || ['general'],
        subtasks: partial?.subtasks || [],
        dueDate: partial?.dueDate,
      });

      setTasks(prev => [created, ...prev.filter(t => t.id !== created.id)]);
      soundEffects.playSuccessChord();
      return created;
    } catch {
      const fallbackId = StorageService.getNextTaskId(tasks);
      const localTask: TaskTicket = {
        id: fallbackId,
        order: 0,
        title: partial?.title || 'New Task',
        description: partial?.description || '',
        status: partial?.status || 'todo',
        priority: partial?.priority || 'medium',
        tags: partial?.tags || ['general'],
        subtasks: partial?.subtasks || [],
        dueDate: partial?.dueDate,
        createdBy: { type: 'human', name: currentUser?.name || 'Local User' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [localTask, ...prev]);
      StorageService.saveTasks([localTask, ...tasks]);
      return localTask;
    }
  }, [tasks, currentUser]);

  // Voice Command Dispatcher
  const handleVoiceCommand = useCallback(async (cmd: VoiceCommandResult) => {
    if (cmd.intent === 'create' && cmd.taskData) {
      await handleCreateTask(cmd.taskData);
      soundEffects.playSuccessChord();
      return;
    }

    if (cmd.intent === 'update_status' && cmd.targetTaskId && cmd.targetStatus) {
      const matchIndex = tasks.findIndex(
        t => t.id.toLowerCase() === cmd.targetTaskId?.toLowerCase()
      );

      if (matchIndex !== -1) {
        const target = tasks[matchIndex];
        try {
          const updated = await api.updateTask(target.id, { status: cmd.targetStatus });
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch {
          const updatedTasks = [...tasks];
          updatedTasks[matchIndex] = { ...target, status: cmd.targetStatus, updatedAt: new Date().toISOString() };
          setTasks(updatedTasks);
          StorageService.saveTasks(updatedTasks);
        }
        soundEffects.playSuccessChord();
        if (cmd.targetStatus === 'done') fireConfetti();
      } else {
        soundEffects.playErrorTone();
        speechFeedback.speak(`Could not find task ${cmd.targetTaskId}`);
      }
      return;
    }

    if (cmd.intent === 'set_priority' && cmd.targetTaskId && cmd.targetPriority) {
      const matchIndex = tasks.findIndex(
        t => t.id.toLowerCase() === cmd.targetTaskId?.toLowerCase()
      );
      if (matchIndex !== -1) {
        const target = tasks[matchIndex];
        try {
          const updated = await api.updateTask(target.id, { priority: cmd.targetPriority });
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch {
          const updatedTasks = [...tasks];
          updatedTasks[matchIndex] = { ...target, priority: cmd.targetPriority, updatedAt: new Date().toISOString() };
          setTasks(updatedTasks);
          StorageService.saveTasks(updatedTasks);
        }
        soundEffects.playSuccessChord();
      }
      return;
    }

    if (cmd.intent === 'delete' && cmd.targetTaskId) {
      await api.deleteTask(cmd.targetTaskId);
      setTasks(prev => prev.filter(t => t.id.toLowerCase() !== cmd.targetTaskId?.toLowerCase()));
      soundEffects.playSuccessChord();
      return;
    }

    if (cmd.intent === 'filter' && cmd.filterQuery !== undefined) {
      setFilters(prev => ({ ...prev, search: cmd.filterQuery || '' }));
      soundEffects.playSuccessChord();
      return;
    }
  }, [tasks, handleCreateTask]);

  // Voice Hook
  const voice = useVoiceController({
    onCommandParsed: handleVoiceCommand,
    onBriefingRequest: () => setIsStandupOpen(true),
  });

  // Drag and drop card drop handler
  const handleCardDrop = async (taskId: string, targetStatus: Status) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    if (task.status === targetStatus) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t));

    try {
      const updated = await api.updateTask(taskId, { status: targetStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch {
      // Revert if error
    }

    if (targetStatus === 'done') {
      fireConfetti();
      speechFeedback.speak(`Task ${task.id} marked as done. Great job!`);
    }
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    handleCardDrop(id, newStatus);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await api.deleteTask(id);
    soundEffects.playDropClick();
  };

  const handleSaveTask = async (updatedTask: TaskTicket) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    try {
      const saved = await api.updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        tags: updatedTask.tags,
        subtasks: updatedTask.subtasks,
        dueDate: updatedTask.dueDate,
      });
      setTasks(prev => prev.map(t => t.id === saved.id ? saved : t));
    } catch {
      // local cache
    }
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Global hotkeys (Ctrl+K, C, B, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCreateTask().then(newTask => {
          setSelectedTask(newTask);
          setIsDetailOpen(true);
        });
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setIsStandupOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateTask]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Header
        tasks={tasks}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewTaskClick={async () => {
          const newTask = await handleCreateTask();
          setSelectedTask(newTask);
          setIsDetailOpen(true);
        }}
        onDailyStandupClick={() => setIsStandupOpen(true)}
        onHelpClick={() => setIsHelpOpen(true)}
        onVoiceToggle={voice.toggleListening}
        isListening={voice.isListening}
        searchQuery={filters.search}
        onSearchChange={(q) => setFilters(prev => ({ ...prev, search: q }))}
        onExportBackup={() => StorageService.exportToJson(tasks)}
        onImportBackup={async (file) => {
          try {
            const imported = await StorageService.importFromJson(file);
            setTasks(imported);
            soundEffects.playSuccessChord();
            speechFeedback.speak("Task backup successfully imported!");
          } catch (err: any) {
            alert(err.message || 'Failed to import JSON file');
          }
        }}
        onResetData={() => {
          const reset = StorageService.resetToDefault();
          setTasks(reset);
          soundEffects.playSuccessChord();
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAgentKeys={() => setIsAgentKeysOpen(true)}
      />

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            filters={filters}
            onEditTask={(task) => {
              setSelectedTask(task);
              setIsDetailOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onAddTaskToColumn={async (status) => {
              const newTask = await handleCreateTask({ status });
              setSelectedTask(newTask);
              setIsDetailOpen(true);
            }}
            onCardDrop={handleCardDrop}
          />
        ) : (
          <ListView
            tasks={tasks}
            filters={filters}
            onEditTask={(task) => {
              setSelectedTask(task);
              setIsDetailOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onSortChange={handleSortChange}
          />
        )}
      </main>

      {/* Floating Voice HUD */}
      <VoiceHUD
        isListening={voice.isListening}
        transcript={voice.transcript}
        interimTranscript={voice.interimTranscript}
        lastCommand={voice.lastCommand}
        audioLevel={voice.audioLevel}
        errorMessage={voice.errorMessage}
        onToggleListening={voice.toggleListening}
        onSimulateCommand={voice.simulateCommand}
      />

      {/* Detail / Edit Modal with Audit History */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Executive Daily Standup Briefing Modal */}
      <DailyStandupModal
        isOpen={isStandupOpen}
        onClose={() => setIsStandupOpen(false)}
        tasks={tasks}
        onSelectTask={(task) => {
          setSelectedTask(task);
          setIsDetailOpen(true);
        }}
      />

      {/* Quick Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={(task) => {
          setSelectedTask(task);
          setIsDetailOpen(true);
        }}
        onNewTask={async () => {
          const newTask = await handleCreateTask();
          setSelectedTask(newTask);
          setIsDetailOpen(true);
        }}
        onDailyStandup={() => setIsStandupOpen(true)}
        onToggleVoice={voice.toggleListening}
        onSwitchView={setViewMode}
        onExportBackup={() => StorageService.exportToJson(tasks)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Voice Help & Cheat Sheet Modal */}
      <VoiceHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSimulateCommand={voice.simulateCommand}
      />

      {/* AI Agents & MCP API Keys Modal */}
      <AgentKeysModal
        isOpen={isAgentKeysOpen}
        onClose={() => setIsAgentKeysOpen(false)}
      />

      {/* Team Member Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshTasks();
        }}
        onLogout={() => {
          api.logout();
          setCurrentUser(null);
          refreshTasks();
        }}
      />
    </div>
  );
};

export default App;
