// FIX: Corrected corrupted import statement and added missing 'useState' import.
import React, { useState } from 'react';
import { Category } from '../types';
import { PlusIcon } from './Icons';

interface ChecklistTask {
  title: string;
  category: Category;
  isSubtask?: boolean;
}

interface ChecklistGroup {
  groupTitle: string;
  tasks: ChecklistTask[];
}

const REFINED_DAILY_CHECKLIST: ChecklistGroup[] = [
  {
    groupTitle: '🚀 Big Goals',
    tasks: [
      { title: "Project Split Documented Progress", category: 'Ownership' },
      { title: "Project Kiosk Physical/Analytical Documented Progress", category: 'Ownership' },
      { title: "Project IMP Upgrade Status", category: 'Ownership' },
      { title: "Celeste Training Project Progress", category: 'Training' },
      { title: "New App Deployment", category: 'Ownership' },
      { title: "FiGURE OUT HOW TO CONNECT WITH API'S & GOOGLE DRIVE WITH THE APPS! IT'S TIME", category: 'Ownership' },
    ],
  },
  {
    groupTitle: '🎯 Morning Setup (< 5 min)',
    tasks: [
      { title: "Review Yesterday's KPIs (AOV, deliveries, etc.)", category: 'Financials' },
      { title: "Define Today's Top 3 Must-Wins", category: 'Ownership' },
      { title: "Outline Morning Huddle (deal, plays, reminders)", category: 'Staffing' },
    ],
  },
  {
    groupTitle: '🛒 Floor & Sales Readiness',
    tasks: [
      { title: 'Set Deal of the Day & Attach Plays', category: 'Marketing' },
      { title: 'Check Menus/Kiosks (prices, stock, images)', category: 'Inventory' },
      { title: 'Refresh Feature Bay with Priority SKUs', category: 'Inventory' },
      { title: "Review Budtender Sales Numbers with each Opener & Closer", category: 'Staffing' },
    ],
  },
  {
    groupTitle: '📦 Core Operations',
    tasks: [
      { title: 'Confirm Driver Coverage & Breaks', category: 'Staffing' },
      { title: 'Run Quick Reorder Pass (top sellers, gaps)', category: 'Inventory' },
      { title: 'Receive Shipments (verify counts, update locations)', category: 'Inventory' },
      { title: "Reconcile Yesterday's Cash & Payments", category: 'Financials' },
    ],
  },
  {
    groupTitle: '📣 Growth & Comms',
    tasks: [
      { title: "Review Social Ads & Analytics.", category: 'Marketing' },
      { title: "Create 1 Social Script/Shot for Damian", category: 'Marketing' },
      { title: "Email Dubraska Graphic Requests", category: 'Marketing' },
      { title: "Run & Review Competitive Report", category: 'Competition' },
      { title: "Prepare & Send EoD Email", category: 'Ownership' },
      { title: 'Triage Hiring Pipeline (replies, screens)', category: 'HR' },
    ],
  },
  {
    groupTitle: '🧪 Today’s Micro-Experiment',
    tasks: [
      { title: "Launch Micro-Experiment (define hypothesis & change)", category: 'Ownership' },
    ],
  },
];


interface GettingStartedCardProps {
  onAddTasks: (tasks: { title: string; category: Category }[]) => void;
}

export const GettingStartedCard: React.FC<GettingStartedCardProps> = ({ onAddTasks }) => {
  const [selectedTasks, setSelectedTasks] = useState<ChecklistTask[]>([]);

  const handleToggleTask = (task: ChecklistTask) => {
    setSelectedTasks(prev =>
      prev.some(t => t.title === task.title)
        ? prev.filter(t => t.title !== task.title)
        : [...prev, task]
    );
  };

  const handleAddSelected = () => {
    if (selectedTasks.length > 0) {
      onAddTasks(selectedTasks);
      setSelectedTasks([]); // Clear selection after adding
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <h2 className="text-xl font-bold text-gray-800">Ready to Start Your Day?</h2>
      <p className="mt-1 text-gray-600">Select from your daily operations playbook to build your to-do list for today.</p>

      <div className="mt-6 space-y-6">
        {REFINED_DAILY_CHECKLIST.map(({ groupTitle, tasks }) => (
          <div key={groupTitle}>
            <h3 className="font-semibold text-gray-800 text-lg mb-3">{groupTitle}</h3>
            <div className="space-y-2">
              {tasks.map(task => {
                const isSelected = selectedTasks.some(t => t.title === task.title);
                return (
                  <label
                    key={task.title}
                    className={`flex items-start space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                      task.isSubtask ? 'ml-6' : ''
                    } ${
                      isSelected ? 'bg-purple-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleTask(task)}
                      className="h-4 w-4 mt-0.5 flex-shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-800">{task.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-4 flex justify-end">
        <button
          onClick={handleAddSelected}
          disabled={selectedTasks.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add {selectedTasks.length > 0 ? `(${selectedTasks.length})` : ''} Selected Tasks</span>
        </button>
      </div>
    </div>
  );
};
