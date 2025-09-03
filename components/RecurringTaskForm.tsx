import React from 'react';
import { TaskType } from '../types';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Schedule {
    daysOfWeek: number[];
    // FIX: Changed dayOfMonth to be only a string. The input value is always a string,
    // and the parent component (`AddTaskModal`) manages it as a string state. This
    // resolves a TypeScript error when passing the state setter to this component.
    dayOfMonth: string;
}

interface RecurringTaskFormProps {
    taskType: TaskType;
    schedule: Schedule;
    earlyReminder: boolean;
    onScheduleChange: (newSchedule: Schedule) => void;
    onReminderChange: (newReminder: boolean) => void;
    dayOfMonthError: string;
    setDayOfMonthError: (error: string) => void;
}

export const RecurringTaskForm: React.FC<RecurringTaskFormProps> = ({
    taskType,
    schedule,
    earlyReminder,
    onScheduleChange,
    onReminderChange,
    dayOfMonthError,
    setDayOfMonthError
}) => {
    const handleDayOfWeekToggle = (dayIndex: number) => {
        const newDaysOfWeek = schedule.daysOfWeek.includes(dayIndex)
            ? schedule.daysOfWeek.filter(d => d !== dayIndex)
            : [...schedule.daysOfWeek, dayIndex];
        onScheduleChange({ ...schedule, daysOfWeek: newDaysOfWeek });
    };

    const handleDayOfMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (dayOfMonthError) {
            setDayOfMonthError('');
        }
        onScheduleChange({ ...schedule, dayOfMonth: e.target.value });
    };
    
    const showWeekly = taskType === 'weekly';
    const showMonthly = taskType === 'monthly';
    const showReminder = taskType === 'one-time' || taskType === 'weekly' || taskType === 'monthly';

    if (!showWeekly && !showMonthly && !showReminder) {
        return null;
    }

    return (
        <div className="pt-4 mt-4 border-t space-y-4">
            {showWeekly && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                    <div className="flex justify-between space-x-1">
                        {DAYS_OF_WEEK.map((day, index) => (
                            <button
                                key={index}
                                title={DAY_NAMES[index]}
                                onClick={() => handleDayOfWeekToggle(index)}
                                className={`h-10 w-10 rounded-full font-semibold text-sm transition-colors ${schedule.daysOfWeek.includes(index) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {showMonthly && (
                <div>
                    <label htmlFor="day-of-month" className="block text-sm font-medium text-gray-700">Day of Month</label>
                    <input
                        id="day-of-month"
                        type="number"
                        min="1"
                        max="31"
                        value={schedule.dayOfMonth}
                        onChange={handleDayOfMonthChange}
                        placeholder="e.g., 15"
                        aria-describedby="day-of-month-error"
                        className={`mt-1 block w-full px-3 py-2 bg-white border ${dayOfMonthError ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {dayOfMonthError && <p id="day-of-month-error" className="mt-1 text-sm text-red-600">{dayOfMonthError}</p>}
                </div>
            )}
            {showReminder && (
                <div>
                    <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={earlyReminder}
                            onChange={(e) => onReminderChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Early Reminder (2 days before)</span>
                    </label>
                </div>
            )}
        </div>
    );
}