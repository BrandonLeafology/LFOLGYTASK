import { Task } from './types';

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatSchedule(task: Task): string | null {
  switch (task.taskType) {
    case 'everyday':
      return '(Daily)';
    case 'weekly':
      if (task.daysOfWeek && task.daysOfWeek.length > 0) {
        // Sort days to ensure consistent order (Sunday first)
        const sortedDays = [...task.daysOfWeek].sort((a, b) => a - b);
        return `(${sortedDays.map(d => DAY_NAMES_SHORT[d]).join(', ')})`;
      }
      return null;
    case 'monthly':
      if (task.dayOfMonth) {
        const suffix = getOrdinalSuffix(task.dayOfMonth);
        return `(on the ${task.dayOfMonth}${suffix})`;
      }
      return null;
    default:
      return null;
  }
}