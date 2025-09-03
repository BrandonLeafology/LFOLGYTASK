import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Status, Category, Comment, CATEGORIES, STATUSES, Priority, PRIORITIES } from '../types';
import { updateTask } from '../services/db';
import { AskIcon, CommentIcon, EODIcon, IgnoreIcon, MuteIcon, RetireIcon, StarIcon, FlagIcon, BellIcon, BrainIcon } from './Icons';
import { formatSchedule } from '../utils';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onFocus: () => void;
  isFocused: boolean;
  currentDate: string;
  onTaskClick: (id: string) => void;
  onStartAIHelper: (task: Task) => void;
}

const SLASH_PHRASES: { [key: string]: string } = {
  '/side': 'Side-note: ',
  '/app': 'Appreciated. ',
  '/data': 'The data seems to say… ',
};

const statusColors: Record<Status, string> = {
  todo: 'bg-gray-200 text-gray-700',
  doing: 'bg-blue-200 text-blue-800',
  done: 'bg-green-200 text-green-800',
};

const categoryColors: Record<Category, string> = {
    Inventory: 'border-red-400',
    Marketing: 'border-blue-400',
    HR: 'border-green-400',
    Financials: 'border-yellow-400',
    Ownership: 'border-purple-400',
    Competition: 'border-indigo-400',
    Training: 'border-pink-400',
    Staffing: 'border-teal-400',
};

const taskTypeColors: Record<Task['taskType'], string> = {
    'one-time': 'bg-gray-200 text-gray-600',
    'project': 'bg-indigo-200 text-indigo-800',
    'everyday': 'bg-cyan-200 text-cyan-800',
    'weekly': 'bg-orange-200 text-orange-800',
    'monthly': 'bg-pink-200 text-pink-800',
}

const priorityColors: Record<Priority, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-red-500',
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onFocus, isFocused, currentDate, onTaskClick, onStartAIHelper }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  const taskPriority = task.priority || 'medium';
  const taskType = task.taskType || 'one-time';
  const scheduleText = useMemo(() => formatSchedule(task), [task]);

  const isEarlyReminderActive = useMemo(() => {
    if (!task.earlyReminder || !task.date) return false;

    try {
        const today = new Date(currentDate + 'T00:00:00');
        const taskDate = new Date(task.date + 'T00:00:00');
        
        // Reminder date is 2 days before the task date
        const reminderDate = new Date(taskDate);
        reminderDate.setDate(taskDate.getDate() - 2);

        // Activate reminder on the reminder date and keep it active until the task date (exclusive)
        return today >= reminderDate && today < taskDate;
    } catch(e) {
        // Invalid date string might throw an error
        console.error("Error calculating reminder date:", e);
        return false;
    }
  }, [task.earlyReminder, task.date, currentDate]);

  useEffect(() => {
    if (isFocused) {
      // Logic for when item gets focus via keyboard, e.g. scroll into view
    }
  }, [isFocused]);

  const handleUpdate = <K extends keyof Task,>(key: K, value: Task[K]) => {
    onUpdate(task.id, { [key]: value });
  };
  
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if(title.trim() !== task.title && title.trim() !== '') {
        handleUpdate('title', title.trim());
    } else {
        setTitle(task.title);
    }
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      titleInputRef.current?.blur();
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const lastWord = value.split(' ').pop() || '';
    if (SLASH_PHRASES[lastWord]) {
      const expansion = SLASH_PHRASES[lastWord];
      setNewComment(value.replace(lastWord, expansion));
      return;
    }
    
    const checkAndUpdateFlag = (phrase: string, flag: keyof Task, flagValue: boolean) => {
      if (value.endsWith(phrase)) {
        setNewComment(value.replace(phrase, ''));
        handleUpdate(flag, flagValue);
        return true;
      }
      return false;
    }
    
    if (checkAndUpdateFlag('/ask', 'asks', true)) return;
    if (checkAndUpdateFlag('/win', 'starred', true)) return;
    if (checkAndUpdateFlag('/eod', 'includeInEOD', true)) return;

    setNewComment(value);
  };

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    
    let text = newComment.trim();
    if(text.startsWith('@ask')){
        handleUpdate('asks', true);
    }
    
    const newComments = [...task.comments, { text: text, ts: new Date().toISOString() }];
    handleUpdate('comments', newComments);
    setNewComment('');
  };
  
  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if(e.key === 'Enter'){
          handleAddComment();
      }
  }
  
  const cycleCategory = () => {
      const currentIndex = CATEGORIES.indexOf(task.category);
      const nextIndex = (currentIndex + 1) % CATEGORIES.length;
      handleUpdate('category', CATEGORIES[nextIndex]);
  }
  
  const cycleStatus = () => {
      const currentIndex = STATUSES.indexOf(task.status);
      const nextIndex = (currentIndex + 1) % STATUSES.length;
      handleUpdate('status', STATUSES[nextIndex]);
  }
  
  const cyclePriority = () => {
      const currentIndex = PRIORITIES.indexOf(taskPriority);
      const nextIndex = (currentIndex + 1) % PRIORITIES.length;
      handleUpdate('priority', PRIORITIES[nextIndex]);
  }
  
  // Keyboard shortcuts specific to this item when focused
  useEffect(() => {
    if (!isFocused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        if(document.activeElement?.tagName === 'INPUT') return;

        switch (e.key) {
            case '1': handleUpdate('status', 'todo'); break;
            case '2': handleUpdate('status', 'doing'); break;
            case '3': handleUpdate('status', 'done'); break;
            case 'p': case 'P': cyclePriority(); break;
            case 'm': case 'M': handleUpdate('disposition', 'muted'); break;
            case 'i': case 'I': handleUpdate('disposition', 'ignored'); break;
            case 'x': case 'X': handleUpdate('disposition', 'retired'); break;
            case 'e': case 'E': handleUpdate('includeInEOD', !task.includeInEOD); break;
            case 's': case 'S': handleUpdate('starred', !task.starred); break;
            case 'a': case 'A': handleUpdate('asks', !task.asks); break;
            case 'c': case 'C': 
                setShowComments(s => !s);
                setTimeout(() => commentInputRef.current?.focus(), 0);
                break;
            case 'Tab': 
                e.preventDefault();
                cycleCategory();
                break;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, task]);

  return (
    <div onClick={() => onTaskClick(task.id)} onFocus={onFocus} className={`p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${isFocused ? 'bg-white shadow-md' : 'bg-gray-100'} border-l-4 ${task.disposition === 'muted' ? 'border-gray-400' : categoryColors[task.category]}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-grow">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onClick={e => e.stopPropagation()}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent text-gray-800 font-medium focus:outline-none"
              autoFocus
            />
          ) : (
            <p onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true) }} className="font-medium text-gray-800">{task.title}</p>
          )}
          {taskType === 'project' && task.projectTaskOrder !== undefined && task.totalProjectTasks !== undefined && (
            <div className="text-xs text-indigo-600 font-semibold mt-1 bg-indigo-100 inline-block px-2 py-0.5 rounded-full">
                Step {task.projectTaskOrder + 1} of {task.totalProjectTasks}
            </div>
           )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
           <button onClick={(e) => { e.stopPropagation(); cyclePriority(); }} title={`Priority: ${taskPriority} (P)`} className={`flex items-center space-x-1 px-2 py-0.5 rounded-full font-semibold cursor-pointer bg-gray-200 hover:bg-gray-300`}>
                <FlagIcon solid className={`w-3 h-3 ${priorityColors[taskPriority]}`} />
                <span className="capitalize text-gray-700">{taskPriority}</span>
            </button>
           <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${taskTypeColors[taskType]}`}>
               {taskType.replace('-', ' ')}
               {scheduleText && <span className="font-normal ml-1.5 text-gray-500">{scheduleText}</span>}
           </span>
           <span onClick={(e) => { e.stopPropagation(); cycleStatus(); }} className={`px-2 py-0.5 rounded-full font-semibold cursor-pointer ${statusColors[task.status]}`}>{task.status}</span>
           <span onClick={(e) => { e.stopPropagation(); cycleCategory(); }} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium cursor-pointer">{task.category}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2">
            {isEarlyReminderActive && (
              <div title="Early Reminder: Prepare for this task" className="p-1 rounded-full text-orange-500 bg-orange-100 flex items-center">
                  <BellIcon className="w-4 h-4" />
              </div>
            )}
            <button title="Mark as Win / Star (S)" onClick={(e) => { e.stopPropagation(); handleUpdate('starred', !task.starred); }} className={`p-1 rounded-full transition-colors ${task.starred ? 'text-yellow-500 bg-yellow-100' : 'text-gray-400 hover:bg-gray-200'}`}><StarIcon solid={task.starred} className="w-4 h-4" /></button>
            <button title="Include in EOD (E)" onClick={(e) => { e.stopPropagation(); handleUpdate('includeInEOD', !task.includeInEOD); }} className={`p-1 rounded-full transition-colors ${task.includeInEOD ? 'text-purple-600 bg-purple-100' : 'text-gray-400 hover:bg-gray-200'}`}><EODIcon solid={task.includeInEOD} className="w-4 h-4" /></button>
            <button title="Mark as Blocker / Ask (A)" onClick={(e) => { e.stopPropagation(); handleUpdate('asks', !task.asks); }} className={`p-1 rounded-full transition-colors ${task.asks ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:bg-gray-200'}`}><AskIcon solid={task.asks} className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center space-x-2">
            <button title="AI Helper" onClick={(e) => { e.stopPropagation(); onStartAIHelper(task); }} className="p-1 text-gray-400 hover:text-teal-600 hover:bg-gray-200 rounded-full">
                <BrainIcon className="w-4 h-4"/>
            </button>
            <button title="Show/Hide Comments (C)" onClick={(e) => { e.stopPropagation(); setShowComments(s => !s); }} className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600">
                <CommentIcon className="w-4 h-4"/>
                <span>{task.comments.length}</span>
            </button>
            <button title="Mute for Today (M)" onClick={(e) => { e.stopPropagation(); handleUpdate('disposition', 'muted'); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded-full"><MuteIcon className="w-4 h-4" /></button>
            <button title="Ignore Task (I)" onClick={(e) => { e.stopPropagation(); handleUpdate('disposition', 'ignored'); }} className="p-1 text-gray-400 hover:text-yellow-600 hover:bg-gray-200 rounded-full"><IgnoreIcon className="w-4 h-4" /></button>
            <button title="Retire Task (X)" onClick={(e) => { e.stopPropagation(); handleUpdate('disposition', 'retired'); }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200 rounded-full"><RetireIcon className="w-4 h-4"/></button>
        </div>
      </div>
      
      {showComments && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2" onClick={e => e.stopPropagation()}>
          {task.comments.map(c => (
            <div key={c.ts} className="text-sm text-gray-600">
              <span className="text-gray-400 text-xs mr-2">{new Date(c.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {c.text}
            </div>
          ))}
          <div className="pt-2">
            <input
              ref={commentInputRef}
              type="text"
              value={newComment}
              onChange={handleCommentChange}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add comment... (use / for phrases)"
              className="w-full text-sm bg-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
};