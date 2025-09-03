

import { Task, Settings } from '../types';
import { openDB, IDBPDatabase } from './localDb';

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDb = (): Promise<IDBPDatabase<any>> => {
  if (!dbPromise) {
    dbPromise = openDB('leafology-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
};


// --- Task Operations ---

export const getTasksForDate = async (date: string): Promise<Task[]> => {
  const db = await getDb();
  // FIX: Provide generic type to getAll to ensure allTasks is Task[] instead of unknown[]
  const allTasks = await db.getAll<Task>('tasks');
  return allTasks.filter(task => task.date === date);
};

export const getAllTasks = async (): Promise<Task[]> => {
    const db = await getDb();
    return await db.getAll<Task>('tasks');
};

const putTask = async (taskData: Task): Promise<Task> => {
    const db = await getDb();
    await db.put('tasks', taskData);
    return taskData;
}

export const putTasks = async (tasks: Task[]): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction('tasks', 'readwrite');
    for (const task of tasks) {
        tx.store.put(task);
    }
    await tx.done;
};

export const addTask = async (taskData: Omit<Task, 'id'>, isRecurring: boolean, isProject: boolean): Promise<Task> => {
  const id = crypto.randomUUID();
  let finalTaskData: Task = { ...taskData, id };
  
  if (isRecurring) {
    finalTaskData.originId = id;
  }
  if (isProject) {
     finalTaskData.projectId = id;
  }

  return putTask(finalTaskData);
};

export const addTasks = async (tasksData: Omit<Task, 'id'>[]): Promise<Task[]> => {
    const db = await getDb();
    const tx = db.transaction('tasks', 'readwrite');
    const addedTasks: Task[] = [];
    
    tasksData.forEach(taskData => {
        const id = crypto.randomUUID();
        const taskWithId = { ...taskData, id };
        tx.store.put(taskWithId);
        addedTasks.push(taskWithId);
    });
    
    await tx.done;
    return addedTasks;
};

export const addProjectTasks = async (tasksData: Omit<Task, 'id'>[]): Promise<Task[]> => {
    const db = await getDb();
    const projectId = crypto.randomUUID();
    const addedTasks: Task[] = [];
    const tx = db.transaction('tasks', 'readwrite');
    
    tasksData.forEach(taskData => {
        const id = crypto.randomUUID();
        const taskWithId: Task = { ...taskData, id, projectId };
        tx.store.put(taskWithId);
        addedTasks.push(taskWithId);
    });
    
    await tx.done;
    return addedTasks;
}

export const updateTask = async (id: string, changes: Partial<Task>): Promise<void> => {
    const db = await getDb();
    // FIX: Provide generic type to get to ensure task is Task | undefined instead of unknown
    const task = await db.get<Task>('tasks', id);
    if (task) {
        const updatedTask = { ...task, ...changes, updatedAt: new Date().toISOString() };
        await db.put('tasks', updatedTask);
    }
};

export const updateRecurringTemplate = async (originId: string, changes: Partial<Task>): Promise<void> => {
    const db = await getDb();
    const templateTask = await db.get<Task>('tasks', originId);
    
    if (templateTask) {
        // Apply changes to the template task. The daily rollover logic will use this updated
        // template to create future instances.
        const updatedTemplate = { ...templateTask, ...changes, updatedAt: new Date().toISOString() };
        await db.put('tasks', updatedTemplate);
    }
};

export const activateNextProjectTask = async (projectId: string, nextOrder: number, date: string): Promise<void> => {
    const db = await getDb();
    // FIX: Provide generic type to getAll to ensure allTasks is Task[] instead of unknown[]
    const allTasks = await db.getAll<Task>('tasks');
    const nextTask = allTasks.find(t => t.projectId === projectId && t.projectTaskOrder === nextOrder);
    
    if (nextTask) {
        await updateTask(nextTask.id, { date });
    }
};

export const deleteTask = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete('tasks', id);
};

// --- Settings Operations ---

export const getSettings = async (): Promise<Settings> => {
  const db = await getDb();
  // FIX: Provide generic type to get to ensure settings is Settings | undefined instead of unknown
  let settings = await db.get<Settings>('settings', 'main');
  
  if (!settings) {
    // Seed initial settings if they don't exist
    const defaultSettings: Settings = {
      eodTime: '17:00',
      sendTo: ['brandon@leafologyny.com'],
      timezone: 'America/New_York',
      kpis: { AOV: 0, googleReviews: 0, proposalsNew: 0, initiativesProgress: '' },
      lastOpenedDate: ''
    };
    await db.put('settings', defaultSettings, 'main');
    return defaultSettings;
  }
  return settings;
};

export const updateSettings = async (settingsChanges: Partial<Settings>): Promise<void> => {
    const db = await getDb();
    // Perform a direct read instead of calling getSettings() to avoid potential recursive loops.
    let currentSettings = await db.get<Settings>('settings', 'main');

    // If settings don't exist, initialize with defaults, mirroring the logic in getSettings().
    if (!currentSettings) {
        currentSettings = {
            eodTime: '17:00',
            sendTo: ['brandon@leafologyny.com'],
            timezone: 'America/New_York',
            kpis: { AOV: 0, googleReviews: 0, proposalsNew: 0, initiativesProgress: '' },
            lastOpenedDate: ''
        };
    }

    const newSettings = { ...currentSettings, ...settingsChanges };
    await db.put('settings', newSettings, 'main');
};

export const clearAndRestoreDatabase = async (tasks: Task[], settings: Settings): Promise<void> => {
    const db = await getDb();
    const tx = db.transaction(['tasks', 'settings'], 'readwrite');
    
    const tasksStore = tx.objectStore('tasks');
    const settingsStore = tx.objectStore('settings');

    tasksStore.clear();
    settingsStore.clear();

    for (const task of tasks) {
        tasksStore.put(task);
    }
    settingsStore.put(settings, 'main');
    
    await tx.done;
};