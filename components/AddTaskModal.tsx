import React, { useState, useRef, useEffect } from 'react';
import { TaskType, Priority, PRIORITIES, Category } from '../types';
import { RecurringTaskForm } from './RecurringTaskForm';


export const AddTaskModal: React.FC<{onClose: () => void, onAddTask: (title: string, category: Category, taskType: TaskType, priority: Priority, schedule?: { daysOfWeek?: number[]; dayOfMonth?: number }, taskDate?: string, earlyReminder?: boolean) => void}> = ({onClose, onAddTask}) => {
    const [title, setTitle] = useState('');
    const [taskType, setTaskType] = useState<TaskType>('one-time');
    const [priority, setPriority] = useState<Priority>('medium');
    const [schedule, setSchedule] = useState({
        daysOfWeek: [new Date().getDay()],
        dayOfMonth: String(new Date().getDate())
    });
    const [earlyReminder, setEarlyReminder] = useState(false);
    const [dayOfMonthError, setDayOfMonthError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        if(title.trim()) {
            let finalSchedule;
            if (taskType === 'weekly') {
                if(schedule.daysOfWeek.length === 0) {
                    alert("Please select at least one day for a weekly task.");
                    return;
                }
                finalSchedule = { daysOfWeek: schedule.daysOfWeek };
            } else if (taskType === 'monthly') {
                const day = parseInt(schedule.dayOfMonth, 10);
                if (day >= 1 && day <= 31 && schedule.dayOfMonth.trim() !== '') {
                    finalSchedule = { dayOfMonth: day };
                    if (dayOfMonthError) setDayOfMonthError('');
                } else {
                    setDayOfMonthError("Please enter a valid day (1-31).");
                    return;
                }
            }
            onAddTask(title.trim(), 'Inventory', taskType, priority, finalSchedule, undefined, earlyReminder);
            onClose();
        }
    }
    
    const isRecurring = ['weekly', 'monthly', 'everyday'].includes(taskType);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold">Add New Task</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">Task Title</label>
                        <input
                            id="task-title"
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                         <div className="mt-2 flex space-x-2">
                             {PRIORITIES.map(p => (
                                 <label key={p} className="flex-1 text-center cursor-pointer">
                                     <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} className="sr-only" />
                                     <span className={`px-4 py-2 block w-full rounded-md border text-sm font-semibold capitalize transition-colors ${priority === p ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{p}</span>
                                 </label>
                             ))}
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Task Type</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                             <label className="flex items-start p-3 rounded-md border has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 cursor-pointer">
                                <input type="radio" name="taskType" value="one-time" checked={taskType === 'one-time'} onChange={() => setTaskType('one-time')} className="h-4 w-4 mt-0.5 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                                <div className="ml-3 text-sm">
                                    <p className="font-medium text-gray-900">One-Time</p>
                                    <p className="text-gray-500">A standard, non-repeating task.</p>
                                </div>
                            </label>
                            <label className="flex items-start p-3 rounded-md border has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 cursor-pointer">
                                <input type="radio" name="taskType" value="everyday" checked={taskType === 'everyday'} onChange={() => setTaskType('everyday')} className="h-4 w-4 mt-0.5 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                                <div className="ml-3 text-sm">
                                    <p className="font-medium text-gray-900">Everyday</p>
                                    <p className="text-gray-500">Repeats every day.</p>
                                </div>
                            </label>
                            <label className="flex items-start p-3 rounded-md border has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 cursor-pointer">
                                <input type="radio" name="taskType" value="weekly" checked={taskType === 'weekly'} onChange={() => setTaskType('weekly')} className="h-4 w-4 mt-0.5 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                                <div className="ml-3 text-sm">
                                    <p className="font-medium text-gray-900">Weekly</p>
                                    <p className="text-gray-500">Repeats on specific days.</p>
                                </div>
                            </label>
                            <label className="flex items-start p-3 rounded-md border has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 cursor-pointer">
                                <input type="radio" name="taskType" value="monthly" checked={taskType === 'monthly'} onChange={() => setTaskType('monthly')} className="h-4 w-4 mt-0.5 text-purple-600 border-gray-300 focus:ring-purple-500"/>
                                <div className="ml-3 text-sm">
                                    <p className="font-medium text-gray-900">Monthly</p>
                                    <p className="text-gray-500">Repeats on a specific date.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    {(isRecurring || taskType === 'one-time') && (
                        <RecurringTaskForm
                            taskType={taskType}
                            schedule={schedule}
                            earlyReminder={earlyReminder}
                            onScheduleChange={setSchedule}
                            onReminderChange={setEarlyReminder}
                            dayOfMonthError={dayOfMonthError}
                            setDayOfMonthError={setDayOfMonthError}
                        />
                    )}
                </div>
                <div className="p-4 border-t flex justify-end items-center space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700">Add Task</button>
                </div>
            </div>
        </div>
    )
}