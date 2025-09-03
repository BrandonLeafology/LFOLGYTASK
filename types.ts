export const CATEGORIES = ['Inventory', 'Marketing', 'HR', 'Financials', 'Ownership', 'Competition', 'Training', 'Staffing'] as const;
export type Category = typeof CATEGORIES[number];

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = typeof STATUSES[number];

export const VIEW_FILTERS = ['today', 'tomorrow', 'this week'] as const;
export type ViewFilter = typeof VIEW_FILTERS[number];

export const TYPE_FILTERS = ['project step'] as const;
export type TypeFilter = typeof TYPE_FILTERS[number];

export type ExtendedStatus = Status | ViewFilter | TypeFilter;


export const DISPOSITIONS = ['normal', 'muted', 'ignored', 'retired'] as const;
export type Disposition = typeof DISPOSITIONS[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = typeof PRIORITIES[number];

export type TaskType = 'one-time' | 'project' | 'everyday' | 'weekly' | 'monthly';

export interface Comment {
  ts: string;
  text: string;
}

export interface Task {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: Category;
  status: Status;
  disposition: Disposition;
  priority: Priority;
  includeInEOD: boolean;
  starred: boolean;
  asks: boolean;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  // New fields for task types
  taskType: TaskType;
  projectId?: string; // For 'project' tasks
  originId?: string; // For 'everyday', 'weekly', 'monthly' tasks to link back to the original
  projectTaskOrder?: number; // For 'project' tasks sequence
  totalProjectTasks?: number; // For 'project' tasks sequence
  // New fields for scheduling
  daysOfWeek?: number[]; // [0-6] for Sunday-Saturday, for 'weekly' tasks
  dayOfMonth?: number; // 1-31, for 'monthly' tasks
  earlyReminder?: boolean; // For early reminders
}

export interface KPIs {
    AOV?: number;
    googleReviews?: number;
    proposalsNew?: number;
    initiativesProgress?: string;
}

export interface Settings {
  eodTime: string; // '17:00'
  sendTo: string[];
  timezone: 'America/New_York';
  kpis: KPIs;
  lastOpenedDate?: string; // YYYY-MM-DD
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: any[]; // Can contain text or file parts
}

export interface AISuggestedTask {
  // Common fields
  title?: string;
  category: Category;
  priority: Priority;
  taskType: TaskType;
  date?: string; // YYYY-MM-DD for one-time tasks
  time?: string; // HH:MM for one-time tasks
  earlyReminder?: boolean;
  
  // For recurring
  daysOfWeek?: number[];
  dayOfMonth?: number;
  
  // For projects
  projectTitle?: string;
  steps?: string[];
}