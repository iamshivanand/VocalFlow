import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  TaskTicket, 
  Status, 
  ViewMode, 
  FilterState, 
  VoiceCommandResult 
} from './types/task';
import { StorageService } from './utils/storage';
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

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskTicket[]>(() => StorageService.loadTasks());
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    status: 'all',
    tag: 'all',
    sortBy: 'order',
    sortDirection: 'asc',
  });

  const [selectedTask, setSelectedTask] = useState<TaskTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Save to persistence
  const updateTasksAndPersist = useCallback((newTasks: TaskTicket[]) => {
    setTasks(newTasks);
    StorageService.saveTasks(newTasks);
  }, []);

  // Celebration confetti when finishing tasks
  const fireConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#6366F1', '#38BDF8', '#F59E0B'],
    });
  };

  // Create new task helper
  const handleCreateTask = useCallback((partial?: Partial<TaskTicket>) => {
    const newId = StorageService.getNextTaskId(tasks);
    const newTask: TaskTicket = {
      id: newId,
      order: 0,
      title: partial?.title || 'New Task',
      description: partial?.description || '',
      status: partial?.status || 'todo',
      priority: partial?.priority || 'medium',
      tags: partial?.tags || ['general'],
      subtasks: partial?.subtasks || [],
      dueDate: partial?.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = [newTask, ...tasks];
    updateTasksAndPersist(nextTasks);
    return newTask;
  }, [tasks, updateTasksAndPersist]);

  // Voice Command Dispatcher
  const handleVoiceCommand = useCallback((cmd: VoiceCommandResult) => {
    if (cmd.intent === 'create' && cmd.taskData) {
      handleCreateTask(cmd.taskData);
      soundEffects.playSuccessChord();
      return;
    }

    if (cmd.intent === 'update_status' && cmd.targetTaskId && cmd.targetStatus) {
      const matchIndex = tasks.findIndex(
        t => t.id.toLowerCase() === cmd.targetTaskId?.toLowerCase()
      );

      if (matchIndex !== -1) {
        const target = tasks[matchIndex];
        const updatedTasks = [...tasks];
        updatedTasks[matchIndex] = {
          ...target,
          status: cmd.targetStatus,
          updatedAt: new Date().toISOString(),
        };
        updateTasksAndPersist(updatedTasks);
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
        const updatedTasks = [...tasks];
        updatedTasks[matchIndex] = {
          ...target,
          priority: cmd.targetPriority,
          updatedAt: new Date().toISOString(),
        };
        updateTasksAndPersist(updatedTasks);
        soundEffects.playSuccessChord();
      }
      return;
    }

    if (cmd.intent === 'delete' && cmd.targetTaskId) {
      const updatedTasks = tasks.filter(
        t => t.id.toLowerCase() !== cmd.targetTaskId?.toLowerCase()
      );
      updateTasksAndPersist(updatedTasks);
      soundEffects.playSuccessChord();
      return;
    }

    if (cmd.intent === 'filter' && cmd.filterQuery !== undefined) {
      setFilters(prev => ({ ...prev, search: cmd.filterQuery || '' }));
      soundEffects.playSuccessChord();
      return;
    }
  }, [tasks, handleCreateTask, updateTasksAndPersist]);

  // Voice Hook
  const voice = useVoiceController({
    onCommandParsed: handleVoiceCommand,
    onBriefingRequest: () => setIsStandupOpen(true),
  });

  // Drag and drop card drop handler
  const handleCardDrop = (taskId: string, targetStatus: Status) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    if (task.status === targetStatus) return;

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    updateTasksAndPersist(updatedTasks);

    if (targetStatus === 'done') {
      fireConfetti();
      speechFeedback.speak(`Task ${task.id} marked as done. Great job!`);
    }
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    handleCardDrop(id, newStatus);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    updateTasksAndPersist(updated);
    soundEffects.playDropClick();
  };

  const handleSaveTask = (updatedTask: TaskTicket) => {
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      const updated = [...tasks];
      updated[index] = updatedTask;
      updateTasksAndPersist(updated);
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
        const newTask = handleCreateTask();
        setSelectedTask(newTask);
        setIsDetailOpen(true);
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
        onNewTaskClick={() => {
          const newTask = handleCreateTask();
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
            onAddTaskToColumn={(status) => {
              const newTask = handleCreateTask({ status });
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

      {/* Detail / Edit Modal */}
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
        onNewTask={() => {
          const newTask = handleCreateTask();
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
    </div>
  );
};

export default App;
