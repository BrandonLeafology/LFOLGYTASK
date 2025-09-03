import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Status, Category, Priority, Comment, STATUSES, CATEGORIES, PRIORITIES } from '../types';
import { AskIcon, CalendarIcon, CheckCircleIcon, ClockIcon, CommentIcon, EODIcon, FlagIcon, ProjectIcon, RefreshIcon, StarIcon } from './Icons';
import { formatSchedule } from '../utils';

interface TaskDetailModalProps {
  task: Task;
  allTasks: Task[];
  onUpdate: (id: string, changes: Partial<Task>) => void;
  onClose: () => void;
}

const categoryColors: Record<Category, string> = {
    Inventory: 'bg-red-100 text-red-800',
    Marketing: 'bg-blue-100 text-blue-800',
    HR: 'bg-green-100 text-green-800',
    Financials: 'bg-yellow-100 text-yellow-800',
    Ownership: 'bg-purple-100 text-purple-800',
    Competition: 'bg-indigo-100 text-indigo-800',
    Training: 'bg-pink-100 text-pink-800',
    Staffing: 'bg-teal-100 text-teal-800',
};

const ToggleButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
            isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
        {children}
        <span>{label}</span>
    </button>
);


export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, allTasks, onUpdate, onClose }) => {
    const [title, setTitle] = useState(task.title);
    const [newComment, setNewComment] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const taskPriority = task.priority || 'medium';

    const handleUpdate = <K extends keyof Task,>(key: K, value: Task[K]) => {
        onUpdate(task.id, { [key]: value });
    };

    const handleTitleBlur = () => {
        if (title.trim() && title.trim() !== task.title) {
            handleUpdate('title', title.trim());
        } else {
            setTitle(task.title);
        }
    };
    
    const handleAddComment = () => {
        if (newComment.trim() === '') return;
        const newComments = [...task.comments, { text: newComment.trim(), ts: new Date().toISOString() }];
        handleUpdate('comments', newComments);
        setNewComment('');
    };

    const recurringHistory = useMemo(() => {
        if (!task.originId || task.id === task.originId) return [];
        return allTasks
            .filter(t => t.originId === task.originId && t.id !== task.id && t.status === 'done')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [task, allTasks]);

    const projectContext = useMemo(() => {
        if (!task.projectId) return null;
        const projectTasks = allTasks
            .filter(t => t.projectId === task.projectId)
            .sort((a, b) => (a.projectTaskOrder ?? 0) - (b.projectTaskOrder ?? 0));
        const projectTitle = projectTasks[0]?.title.split(' - ')[0] || 'Project';
        return { title: projectTitle, tasks: projectTasks };
    }, [task, allTasks]);
    
    const scheduleText = useMemo(() => formatSchedule(task), [task]);
    
    const isRecurringInstance = useMemo(() => !!(task.originId && task.id !== task.originId), [task.originId, task.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={e => e.key === 'Enter' && titleInputRef.current?.blur()}
                        className="text-lg font-bold text-gray-800 bg-transparent focus:outline-none focus:bg-gray-100 rounded px-2 py-1 w-full"
                    />
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl ml-4">&times;</button>
                </header>
                <div className="flex-grow flex flex-col md:flex-row min-h-0">
                    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {isRecurringInstance && (
                            <div className="p-3 mb-2 bg-blue-50 text-blue-800 text-sm rounded-md flex items-center space-x-3" role="alert">
                                <RefreshIcon className="w-5 h-5 flex-shrink-0" />
                                <p>This is a recurring task. Changes to Title, Category, or Priority will prompt you to apply them to this task only, or to all future tasks.</p>
                            </div>
                        )}
                        {/* Properties */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Properties</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                    <select id="status" value={task.status} onChange={e => handleUpdate('status', e.target.value as Status)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                    <select id="category" value={task.category} onChange={e => handleUpdate('category', e.target.value as Category)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select id="priority" value={taskPriority} onChange={e => handleUpdate('priority', e.target.value as Priority)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* EOD Flags */}
                        <section>
                             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">EOD Flags</h3>
                             <div className="flex space-x-2">
                                <ToggleButton label="Win" isActive={task.starred} onClick={() => handleUpdate('starred', !task.starred)}>
                                    <StarIcon className="w-4 h-4" />
                                </ToggleButton>
                                <ToggleButton label="Ask/Blocker" isActive={task.asks} onClick={() => handleUpdate('asks', !task.asks)}>
                                    <AskIcon className="w-4 h-4" />
                                </ToggleButton>
                                <ToggleButton label="Include in EOD" isActive={task.includeInEOD} onClick={() => handleUpdate('includeInEOD', !task.includeInEOD)}>
                                    <EODIcon className="w-4 h-4" />
                                </ToggleButton>
                            </div>
                        </section>

                        {/* Comments */}
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Comments</h3>
                            <div className="space-y-3">
                                {task.comments.length > 0 ? (
                                    task.comments.map(c => (
                                        <div key={c.ts} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                            <p>{c.text}</p>
                                            <span className="text-gray-400 text-xs mt-1 block">{new Date(c.ts).toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No comments yet.</p>
                                )}
                            </div>
                             <div className="mt-4">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add a new comment..."
                                    rows={3}
                                    className="w-full text-sm bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button onClick={handleAddComment} className="mt-2 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Add Comment</button>
                            </div>
                        </section>
                    </main>

                    <aside className="w-full md:w-1/3 p-6 bg-gray-50 border-l overflow-y-auto flex-shrink-0">
                        <div className="space-y-6">
                             <div>
                                <h3 className="font-semibold text-md text-gray-800 mb-3">Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <CalendarIcon className="w-4 h-4 text-gray-500"/>
                                        <span className="text-gray-700">Date: {task.date || 'Unscheduled'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="w-4 h-4 text-gray-500"/>
                                        <span className="text-gray-700 capitalize">Type: {task.taskType.replace('-', ' ')} {scheduleText}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[task.category]}`}>{task.category}</span>
                                    </div>
                                </div>
                            </div>
                            {projectContext && (
                                <div>
                                    <h3 className="font-semibold text-md text-gray-800 mb-3 flex items-center space-x-2"><ProjectIcon className="w-5 h-5"/><span>Project: {projectContext.title}</span></h3>
                                    <ul className="space-y-1">
                                        {projectContext.tasks.map(pt => (
                                            <li key={pt.id} className={`p-2 rounded-md text-sm ${pt.id === task.id ? 'bg-indigo-100 font-semibold' : ''}`}>
                                                <div className="flex items-center space-x-2">
                                                    {pt.status === 'done' ? <CheckCircleIcon className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 flex items-center justify-center"><div className={`h-2 w-2 rounded-full ${pt.date ? 'bg-blue-500' : 'bg-gray-300'}`}></div></div>}
                                                    <span className={`${pt.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                                        {pt.title.split(' - ')[1] || pt.title}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {recurringHistory.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-md text-gray-800 mb-3 flex items-center space-x-2"><RefreshIcon className="w-5 h-5"/><span>Completion History</span></h3>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        {recurringHistory.slice(0, 5).map(ht => (
                                            <li key={ht.id} className="flex items-center space-x-2">
                                                <CheckCircleIcon className="w-4 h-4 text-green-500"/>
                                                <span>Completed on {new Date(ht.date + 'T00:00:00').toLocaleDateString()}</span>
                                            </li>
                                        ))}
                                        {recurringHistory.length > 5 && <li>...and {recurringHistory.length - 5} more.</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
