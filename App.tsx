import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Task, Settings, TaskType, Category, Status, Priority, ExtendedStatus, STATUSES, AISuggestedTask } from './types';
import * as db from './services/db';
import { exportData } from './services/sync';
import { TaskItem } from './components/TaskItem';
import { PlusIcon, SettingsIcon, EODIcon, SearchIcon, ProjectIcon, LightbulbIcon, RefreshIcon, SparklesIcon, DownloadIcon } from './components/Icons';
import { NewIdeaModal } from './components/NewIdeaModal';
import { NewProjectModal } from './components/NewProjectModal';
import { AddTaskModal } from './components/AddTaskModal';
import { EODModal } from './components/EODModal';
import { SettingsModal } from './components/SettingsModal';
import { FilterSortControls } from './components/FilterSortControls';
import { EditRecurringTaskModal } from './components/EditRecurringTaskModal';
import { AINotetakerModal } from './components/AINotetakerModal';
import { VibeAI } from './components/VibeAI';
import { initializeFirebase, onAuthChange } from './services/firebase';
import { listenToFirestoreChanges, syncLocalAndRemote, updateTaskInFirestore, addTaskToFirestore, deleteTaskInFirestore, updateSettingsInFirestore } from './services/firestoreSync';
import { AuthDisplay } from './components/AuthDisplay';
import { User } from 'firebase/auth';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AIHelperModal } from './components/AIHelperModal';
import { GettingStartedCard } from './components/GettingStartedCard';

// Helper function to get today's date in YYYY-MM-DD format for the specified timezone
const getTodayISO = (timeZone: string) => {
    const date = new Date();
    const year = date.toLocaleString('en-US', { year: 'numeric', timeZone });
    const month = date.toLocaleString('en-US', { month: '2-digit', timeZone });
    const day = date.toLocaleString('en-US', { day: '2-digit', timeZone });
    return `${year}-${month}-${day}`;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [filter, setFilter] = useState('');
  const [showEODModal, setShowEODModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAINotetakerModal, setShowAINotetakerModal] = useState(false);
  const [editRecurringState, setEditRecurringState] = useState<{ task: Task; changes: Partial<Task> } | null>(null);
  const [isEODReady, setIsEODReady] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [detailedTaskId, setDetailedTaskId] = useState<string | null>(null);
  const [helperTask, setHelperTask] = useState<Task | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autosaveIntervalRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isFirebaseInitialized, setFirebaseInitialized] = useState(false);
  const unsubscribeFromFirestore = useRef<(() => void) | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: 'createdAt' | 'priority', direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [activeFilters, setActiveFilters] = useState<{
      categories: Category[];
      statuses: ExtendedStatus[];
      priorities: Priority[];
  }>({ categories: [], statuses: ['today'], priorities: [] });

  const refreshTasks = useCallback(async () => {
      const allTasksFromDb = await db.getAllTasks();
      // Simple migration for tasks without priority or taskType to ensure app stability
      const tasksWithDefaults = allTasksFromDb.map(t => ({
        ...t,
        priority: t.priority || 'medium',
        taskType: t.taskType || 'one-time'
      }));
      setTasks(tasksWithDefaults);
  }, []);
  
  const handleRemoteUpdate = useCallback(async (remoteTasks: Task[], remoteSettings: Settings) => {
    console.log("Received updates from Firestore...");
    const localTasks = await db.getAllTasks();
    const localTasksMap = new Map(localTasks.map(t => [t.id, t]));
    const tasksToUpdateLocally: Task[] = [];

    for (const remoteTask of remoteTasks) {
        const localTask = localTasksMap.get(remoteTask.id);
        if (!localTask || new Date(localTask.updatedAt) < new Date(remoteTask.updatedAt)) {
            tasksToUpdateLocally.push(remoteTask);
        }
    }

    if (tasksToUpdateLocally.length > 0) {
        console.log(`Syncing ${tasksToUpdateLocally.length} tasks from Firestore...`);
        await db.putTasks(tasksToUpdateLocally);
        await refreshTasks();
    }
    
    if (remoteSettings && (!settings || new Date(settings.kpis.initiativesProgress || 0) < new Date(remoteSettings.kpis.initiativesProgress || 1))) {
        setSettings(remoteSettings);
        await db.updateSettings(remoteSettings);
    }
  }, [refreshTasks, settings]);


  // Effect for initializing Firebase and handling auth
  useEffect(() => {
    const initialized = initializeFirebase();
    setFirebaseInitialized(initialized);

    if (initialized) {
        const unsubscribeAuth = onAuthChange(async (newUser) => {
            setUser(newUser);
            if (unsubscribeFromFirestore.current) {
                unsubscribeFromFirestore.current();
                unsubscribeFromFirestore.current = null;
            }
            if (newUser) {
                console.log("User signed in. Starting sync...");
                await syncLocalAndRemote(newUser.uid);
                await refreshTasks(); // Refresh local state after initial sync
                unsubscribeFromFirestore.current = listenToFirestoreChanges(newUser.uid, handleRemoteUpdate);
            } else {
                console.log("User signed out. Stopping sync.");
            }
        });
        return () => unsubscribeAuth();
    }
  }, [handleRemoteUpdate, refreshTasks]);

  const handleRollover = useCallback(async (todayISO: string, currentSettings: Settings) => {
    const lastOpenedDate = currentSettings.lastOpenedDate;
    
    if (!lastOpenedDate || lastOpenedDate >= todayISO) {
        if (!lastOpenedDate) {
             await db.updateSettings({ lastOpenedDate: todayISO });
        }
        return;
    }
    
    console.log(`Rollover from ${lastOpenedDate} to ${todayISO}`);
    
    const allTasks = await db.getAllTasks();
    const newTasksForToday: Omit<Task, 'id'>[] = [];
    const tasksForToday = allTasks.filter(t => t.date === todayISO);

    // Carry over incomplete, non-recurring tasks. Muted tasks from yesterday get carried over and reset to 'normal'.
    const carryOverTasks = allTasks.filter(t => 
        t.date === lastOpenedDate && 
        t.status !== 'done' && 
        t.disposition !== 'retired' && 
        t.disposition !== 'ignored' &&
        (t.taskType === 'one-time' || t.taskType === 'project')
    );
    for (const task of carryOverTasks) {
        const { id, ...rest } = task;
        newTasksForToday.push({
            ...rest,
            date: todayISO,
            disposition: 'normal', // Reset muted or normal tasks to normal for the new day
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }
    
    const createRecurringTask = (template: Task): Omit<Task, 'id'> => {
        const { id, ...rest } = template;
        return {
            ...rest,
            date: todayISO,
            status: 'todo',
            disposition: 'normal',
            comments: [], starred: false, asks: false, includeInEOD: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }
    };
    
    const taskExists = (originId: string | undefined) => !originId || tasksForToday.some(t => t.originId === originId) || newTasksForToday.some(t => t.originId === originId);

    const originEverydayTasks = allTasks.filter(t => t.taskType === 'everyday' && t.id === t.originId);
    for (const template of originEverydayTasks) {
        if (!taskExists(template.originId)) newTasksForToday.push(createRecurringTask(template));
    }

    const today = new Date(todayISO + 'T00:00:00');
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();


    const originWeeklyTasks = allTasks.filter(t => t.taskType === 'weekly' && t.id === t.originId);
    for (const template of originWeeklyTasks) {
        if (template.daysOfWeek?.includes(dayOfWeek) && !taskExists(template.originId)) {
            newTasksForToday.push(createRecurringTask(template));
        }
    }

    const originMonthlyTasks = allTasks.filter(t => t.taskType === 'monthly' && t.id === t.originId);
    for (const template of originMonthlyTasks) {
        if (!template.dayOfMonth) continue;
        
        // Create task if it's the scheduled day, OR if it's the last day of the month
        // and the scheduled day is later than the last day (e.g., scheduled for 31st, but month is Feb).
        const shouldCreate = 
            (template.dayOfMonth === dayOfMonth) || 
            (dayOfMonth === lastDayOfMonth && template.dayOfMonth > lastDayOfMonth);
            
        if (shouldCreate && !taskExists(template.originId)) {
            newTasksForToday.push(createRecurringTask(template));
        }
    }

    if (newTasksForToday.length > 0) {
      const addedTasks = await db.addTasks(newTasksForToday);
       if (user) {
          for (const task of addedTasks) {
              await addTaskToFirestore(user.uid, task);
          }
       }
    }
    
    await db.updateSettings({ lastOpenedDate: todayISO });
     if (user && settings) {
        await updateSettingsInFirestore(user.uid, {...settings, lastOpenedDate: todayISO});
    }
  }, [user, settings]);

  // Effect to load data on initial app load, without rollover
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const initialSettings = await db.getSettings();
        const today = getTodayISO(initialSettings.timezone);
        
        setSettings(initialSettings);
        setCurrentDate(today);
        await refreshTasks();

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshTasks]);


  useEffect(() => {
      if(!settings) return;
      const checkEODTime = () => {
          const now = new Date();
          const eodHour = parseInt(settings.eodTime.split(':')[0], 10);
          const eodMinute = parseInt(settings.eodTime.split(':')[1], 10);
          const nowInET = new Date(now.toLocaleString('en-US', {timeZone: settings.timezone}));
          setIsEODReady(nowInET.getHours() >= eodHour && nowInET.getMinutes() >= eodMinute);
      };
      checkEODTime();
      const interval = setInterval(checkEODTime, 60000);
      return () => clearInterval(interval);
  }, [settings]);
  
  const resetAutosaveTimer = useCallback(() => {
      if (autosaveIntervalRef.current) {
          clearInterval(autosaveIntervalRef.current);
      }
      const AUTOSAVE_INTERVAL = 60 * 60 * 1000; // 1 hour
      autosaveIntervalRef.current = window.setInterval(() => {
          console.log('Auto-saving data via download...');
          exportData('leafology-autosave');
      }, AUTOSAVE_INTERVAL);
  }, []);

  useEffect(() => {
      resetAutosaveTimer();
      return () => {
          if (autosaveIntervalRef.current) {
              clearInterval(autosaveIntervalRef.current);
          }
      };
  }, [resetAutosaveTimer]);

  const handleManualSave = async () => {
      await exportData('leafology-manual-save');
      resetAutosaveTimer();
      // Consider adding a visual confirmation for the user
  };

  const handleRefreshAndRollover = async () => {
    if (!settings) return;
    setIsLoading(true);
    try {
      const today = getTodayISO(settings.timezone);
      await handleRollover(today, settings);
      
      const latestSettings = await db.getSettings();
      setSettings(latestSettings);
      
      await refreshTasks();
    } catch (error)      {
      console.error("Error during manual refresh:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (
    title: string,
    category: Category,
    taskType: TaskType,
    priority: Priority,
    schedule?: { daysOfWeek?: number[]; dayOfMonth?: number },
    taskDate?: string,
    earlyReminder?: boolean
) => {
    if (title.trim() === '') return;
    
    const isRecurring = ['everyday', 'weekly', 'monthly'].includes(taskType);
    // Recurring templates get a blank date to hide them from daily views.
    const dateForBaseTask = isRecurring ? '' : (taskDate || currentDate);
    
    const baseTask: Omit<Task, 'id' | 'originId' | 'projectId'> = {
      date: dateForBaseTask,
      title: title.trim(),
      category: category,
      status: 'todo',
      disposition: 'normal',
      priority: priority,
      includeInEOD: false,
      starred: false,
      asks: false,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskType: taskType,
      daysOfWeek: schedule?.daysOfWeek,
      dayOfMonth: schedule?.dayOfMonth,
      earlyReminder: earlyReminder || false,
    };

    // This creates either a one-time task or a recurring template.
    const primaryTask = await db.addTask(baseTask, isRecurring, taskType === 'project');
    if (user) {
        await addTaskToFirestore(user.uid, primaryTask);
    }

    let taskToFocus: Task | null = isRecurring ? null : primaryTask;

    // If a recurring task was created, check if an instance is needed for today.
    if (isRecurring) {
        const today = new Date(currentDate + 'T00:00:00');
        const dayOfWeek = today.getDay();
        const dayOfMonth = today.getDate();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        let shouldCreateForToday = false;
        if (taskType === 'everyday') {
            shouldCreateForToday = true;
        } else if (taskType === 'weekly' && schedule?.daysOfWeek?.includes(dayOfWeek)) {
            shouldCreateForToday = true;
        } else if (taskType === 'monthly' && schedule?.dayOfMonth) {
            const scheduledDay = schedule.dayOfMonth;
            shouldCreateForToday = (scheduledDay === dayOfMonth) || (dayOfMonth === lastDayOfMonth && scheduledDay > lastDayOfMonth);
        }

        if (shouldCreateForToday) {
            // primaryTask is the template here. It has originId === id.
            const { id, ...templateData } = primaryTask; 
            const instanceData: Omit<Task, 'id'> = {
                ...templateData,
                date: currentDate, // Set instance date to today
                // Reset transient properties for the new instance
                status: 'todo',
                disposition: 'normal',
                comments: [],
                starred: false,
                asks: false,
                includeInEOD: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            // Create the instance. isRecurring is false so a *new* originId is not created.
            const instanceTask = await db.addTask(instanceData, false, false); 
            if (user) {
                await addTaskToFirestore(user.uid, instanceTask);
            }
            taskToFocus = instanceTask; // We want to focus the new instance for today.
        }
    }
    
    await refreshTasks();
    if (taskToFocus) {
      setFocusedTaskId(taskToFocus.id);
    }
  };

  const handleAddMultipleTasks = async (tasksToAdd: { title: string; category: Category }[]) => {
    const now = new Date().toISOString();
    const newTasksData: Omit<Task, 'id'>[] = tasksToAdd.map(({ title, category }) => ({
      date: currentDate,
      title,
      category,
      status: 'todo' as Status,
      disposition: 'normal',
      priority: 'medium' as Priority,
      includeInEOD: false,
      starred: false,
      asks: false,
      comments: [],
      createdAt: now,
      updatedAt: now,
      taskType: 'one-time' as TaskType,
    }));

    const addedTasks = await db.addTasks(newTasksData);
    if (user) {
      for (const task of addedTasks) {
        await addTaskToFirestore(user.uid, task);
      }
    }
    await refreshTasks();
  };

  const handleCreateProject = async ({ projectTitle, tasks: taskTitles, category, priority }: { projectTitle: string, tasks: string[], category: Category, priority: Priority }) => {
      if (!projectTitle.trim() || taskTitles.length === 0) return;

      const now = new Date().toISOString();
      const totalTasks = taskTitles.length;

      const newTasksData: Omit<Task, 'id'>[] = taskTitles.map((title, index) => ({
          date: index === 0 ? currentDate : '',
          title: `${projectTitle} - ${title}`,
          category: category || 'Ownership',
          status: 'todo',
          disposition: 'normal',
          priority: priority || 'medium',
          includeInEOD: true,
          starred: index === 0,
          asks: false,
          comments: index === 0 ? [{ ts: now, text: `Project '${projectTitle}' initiated via AI Planner.` }] : [],
          createdAt: now,
          updatedAt: now,
          taskType: 'project',
          projectTaskOrder: index,
          totalProjectTasks: totalTasks,
      }));
      
      const createdTasks = await db.addProjectTasks(newTasksData);
      if (user) {
          for (const task of createdTasks) {
              await addTaskToFirestore(user.uid, task);
          }
      }
      await refreshTasks();
      if (createdTasks.length > 0) {
          setFocusedTaskId(createdTasks[0].id);
      }
  };
  
  const handleUpdateTask = async (id: string, changes: Partial<Task>) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isTemplateProperty = 'title' in changes || 'category' in changes || 'priority' in changes;
    const isRecurringInstance = !!(task.originId && task.id !== task.originId);

    if (isRecurringInstance && isTemplateProperty) {
      setEditRecurringState({ task, changes });
    } else {
      await db.updateTask(id, changes);
       if (user) {
          const updatedTask = { ...task, ...changes, updatedAt: new Date().toISOString() };
          await updateTaskInFirestore(user.uid, updatedTask);
          if (changes.disposition === 'retired') {
            await deleteTaskInFirestore(user.uid, id);
          }
      }

      if (task.taskType === 'project' && changes.status === 'done') {
          const nextOrder = (task.projectTaskOrder ?? -1) + 1;
          if (nextOrder < (task.totalProjectTasks ?? 0)) {
              await db.activateNextProjectTask(task.projectId!, nextOrder, currentDate);
              // Also sync this activation
              if(user){
                  const allTasks = await db.getAllTasks();
                  const nextTask = allTasks.find(t => t.projectId === task.projectId && t.projectTaskOrder === nextOrder);
                  if(nextTask) await updateTaskInFirestore(user.uid, nextTask);
              }
          }
      }
      await refreshTasks();
    }
  };

  const executeRecurringUpdate = async (scope: 'single' | 'future') => {
    if (!editRecurringState) return;
    const { task, changes } = editRecurringState;

    // Always update the current instance to immediately reflect the change
    await db.updateTask(task.id, changes);
    const updatedTask = { ...task, ...changes, updatedAt: new Date().toISOString() };

    if (user) {
      await updateTaskInFirestore(user.uid, updatedTask);
    }

    if (scope === 'future') {
        // If applying to future tasks, update the template as well
        await db.updateRecurringTemplate(task.originId!, changes);
        if(user){
            const allTasks = await db.getAllTasks();
            const templateTask = allTasks.find(t => t.id === task.originId);
            if(templateTask) await updateTaskInFirestore(user.uid, templateTask);
        }
    }
    
    setEditRecurringState(null);
    await refreshTasks();
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    await db.updateSettings({ kpis: newSettings.kpis });
    const latestSettings = await db.getSettings();
    setSettings(latestSettings);
     if (user) {
        await updateSettingsInFirestore(user.uid, latestSettings);
    }
  }

  const handleAddTaskFromAI = async (suggestion: AISuggestedTask) => {
    // Add more robust validation based on the task type.
    if (suggestion.taskType === 'project') {
        if (suggestion.projectTitle && suggestion.steps && suggestion.category && suggestion.priority) {
            await handleCreateProject({
                projectTitle: suggestion.projectTitle,
                tasks: suggestion.steps,
                category: suggestion.category,
                priority: suggestion.priority,
            });
        } else {
            console.error("Invalid AI project suggestion: missing required fields.", suggestion);
            alert("Sorry, the AI suggestion for the project was incomplete.");
        }
    } else if (suggestion.title && suggestion.taskType && suggestion.category && suggestion.priority) {
        await handleAddTask(
            suggestion.title,
            suggestion.category,
            suggestion.taskType,
            suggestion.priority, // No default needed as it's checked
            {
                daysOfWeek: suggestion.daysOfWeek,
                dayOfMonth: suggestion.dayOfMonth,
            },
            suggestion.date,
            suggestion.earlyReminder
        );
    } else {
        console.error("Invalid AI suggestion received:", suggestion);
        alert("Sorry, there was an issue adding the task from the AI suggestion. It might be incomplete.");
    }
  };
  
  const handleTaskClick = (taskId: string) => {
    setFocusedTaskId(taskId);
    setDetailedTaskId(taskId);
  };
  
  const handleStartAIHelper = (task: Task) => {
    setHelperTask(task);
  };
  
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) return;
      
      if(e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowAddTaskModal(true); }
      if(e.key === '/') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'Escape') {
          if (detailedTaskId) {
              setDetailedTaskId(null);
          }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowEODModal(true);
        setTimeout(() => document.getElementById('copy-eod-button')?.click(), 100);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        setShowEODModal(true);
        setTimeout(() => document.getElementById('email-eod-button')?.click(), 100);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [detailedTaskId]);


  const sortedAndFilteredTasks = useMemo(() => {
    if (!currentDate) return [];

    const priorityValue: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

    let baseTasks = tasks
      .filter(t => t.disposition !== 'retired' && t.disposition !== 'ignored' && t.disposition !== 'muted')
      // Hides recurring task templates from the daily view.
      .filter(t => !t.originId || t.id !== t.originId)
      .filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    // Apply active filters
    const extendedStatuses = activeFilters.statuses;
    const dateFilters = extendedStatuses.filter(s => ['today', 'tomorrow', 'this week'].includes(s));
    const normalStatusFilters = extendedStatuses.filter(s => STATUSES.includes(s as Status));
    const typeFilters = extendedStatuses.filter(s => ['project step'].includes(s));

    const todayISO = currentDate;
    const today = new Date(todayISO + 'T00:00:00');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfWeekISO = startOfWeek.toISOString().split('T')[0];
    const endOfWeekISO = endOfWeek.toISOString().split('T')[0];

    let result = baseTasks.filter(task => {
        const dateMatch = dateFilters.length === 0 ? true : dateFilters.some(f => {
            if (f === 'today') return task.date === todayISO;
            if (f === 'tomorrow') return task.date === tomorrowISO;
            if (f === 'this week') return task.date && task.date >= startOfWeekISO && task.date <= endOfWeekISO;
            return false;
        });

        const statusMatch = normalStatusFilters.length === 0 ? true : normalStatusFilters.includes(task.status);
        
        const typeMatch = typeFilters.length === 0 ? true : typeFilters.some(f => {
            if (f === 'project step') return task.taskType === 'project';
            return false;
        });

        return dateMatch && statusMatch && typeMatch;
    });

    if (activeFilters.categories.length > 0) {
      result = result.filter(t => activeFilters.categories.includes(t.category));
    }
    if (activeFilters.priorities.length > 0) {
      result = result.filter(t => activeFilters.priorities.includes(t.priority || 'medium'));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      const aPriority = a.priority || 'medium';
      const bPriority = b.priority || 'medium';

      if (sortConfig.key === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortConfig.key === 'priority') {
        comparison = priorityValue[bPriority] - priorityValue[aPriority];
      }
      
      return sortConfig.direction === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [tasks, filter, currentDate, activeFilters, sortConfig]);
  
  const detailedTask = useMemo(() => {
    if (!detailedTaskId) return null;
    return tasks.find(t => t.id === detailedTaskId) || null;
  }, [detailedTaskId, tasks]);

  const tasksForToday = useMemo(() => {
    return tasks.filter(t => t.date === currentDate && t.disposition !== 'retired' && t.disposition !== 'ignored' && (!t.originId || t.id !== t.originId));
  }, [tasks, currentDate]);


  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leafology</h1>
          {/* FIX: Corrected typo from `toLocaleDate` to `toLocaleDateString` and fixed syntax for the method call. */}
          <p className="text-gray-500">{currentDate ? new Date(currentDate+'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '\u00A0'}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={handleRefreshAndRollover}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full"
                aria-label="Refresh and carry over tasks"
            >
              <RefreshIcon className="w-6 h-6"/>
            </button>
            <button 
                onClick={() => setShowEODModal(true)} 
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 ${isEODReady ? 'animate-pulse' : ''}`}
            >
               <EODIcon className="w-4 h-4" />
               <span>Generate EOD</span>
            </button>
            <button
                onClick={handleManualSave}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full"
                aria-label="Save data backup now"
                title="Save data backup now"
            >
                <DownloadIcon className="w-6 h-6" />
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full"><SettingsIcon className="w-6 h-6"/></button>
            <AuthDisplay user={user} isFirebaseInitialized={isFirebaseInitialized} />
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mb-4">
        <div className="relative flex-grow mb-2 md:mb-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
            <input
                ref={searchInputRef}
                type="text"
                placeholder="Quick find/filter (/)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <FilterSortControls 
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
        />
      </div>

      <main className="space-y-2">
          {sortedAndFilteredTasks.length > 0 ? (
            sortedAndFilteredTasks.map(task => (
              <TaskItem 
                  key={task.id} 
                  task={task} 
                  onUpdate={handleUpdateTask}
                  isFocused={focusedTaskId === task.id}
                  onFocus={() => setFocusedTaskId(task.id)}
                  onTaskClick={handleTaskClick}
                  currentDate={currentDate}
                  onStartAIHelper={handleStartAIHelper}
              />
            ))
          ) : (
            tasksForToday.length === 0 ? (
              <GettingStartedCard onAddTasks={handleAddMultipleTasks} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No tasks match your current filters.</p>
                <p className="text-sm">Try adjusting your filter settings.</p>
              </div>
            )
          )}
      </main>

      <footer className="mt-4 flex items-stretch space-x-2">
          <button onClick={() => setShowAddTaskModal(true)} className="w-1/3 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 font-semibold">
              <PlusIcon className="w-5 h-5"/>
              <span>New Task (N)</span>
          </button>
          <button onClick={() => setShowNewProjectModal(true)} className="w-1/3 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 font-semibold">
              <ProjectIcon className="w-5 h-5" />
              <span>New Project</span>
          </button>
           <button onClick={() => setShowNewIdeaModal(true)} className="w-1/3 flex items-center justify-center space-x-2 px-4 py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 font-semibold">
              <LightbulbIcon className="w-5 h-5" />
              <span>New Idea</span>
          </button>
      </footer>

      {showAddTaskModal && <AddTaskModal onAddTask={handleAddTask} onClose={() => setShowAddTaskModal(false)} />}
      {showNewIdeaModal && <NewIdeaModal onClose={() => setShowNewIdeaModal(false)} />}
      {showNewProjectModal && <NewProjectModal onClose={() => setShowNewProjectModal(false)} onCreateProject={handleCreateProject} />}
      {showEODModal && settings && <EODModal tasks={tasks.filter(t => t.date === currentDate)} settings={settings} date={currentDate} onClose={() => setShowEODModal(false)} />}
      {showSettingsModal && <SettingsModal 
        settings={settings} 
        onClose={() => setShowSettingsModal(false)} 
        onSave={handleSaveSettings}
        />}
      {editRecurringState && <EditRecurringTaskModal 
        onClose={() => setEditRecurringState(null)}
        onConfirm={executeRecurringUpdate}
      />}
       {showAINotetakerModal && <AINotetakerModal 
        onClose={() => setShowAINotetakerModal(false)} 
        onAddTaskFromAI={handleAddTaskFromAI}
        currentDate={currentDate}
      />}
       {detailedTask && (
        <TaskDetailModal
            task={detailedTask}
            allTasks={tasks}
            onUpdate={handleUpdateTask}
            onClose={() => setDetailedTaskId(null)}
        />
       )}
       {helperTask && (
        <AIHelperModal
            task={helperTask}
            onClose={() => setHelperTask(null)}
        />
       )}
      <VibeAI />
       <button
        onClick={() => setShowAINotetakerModal(true)}
        className="fixed bottom-4 right-4 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 z-40"
        aria-label="Open AI Notetaker"
      >
        <SparklesIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default App;