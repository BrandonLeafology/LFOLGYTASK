import React, { useState } from 'react';
import { AISuggestedTask } from '../types';
import { processNoteWithAI } from '../services/gemini';
import { SparklesIcon, ProjectIcon, PlusIcon } from './Icons';

interface AINotetakerModalProps {
  onClose: () => void;
  onAddTaskFromAI: (suggestion: AISuggestedTask) => Promise<void>;
  currentDate: string;
}

const SuggestionCard: React.FC<{
    suggestion: AISuggestedTask;
    onAdd: () => void;
    isAdded: boolean;
    onToggleReminder: () => void;
}> = ({ suggestion, onAdd, isAdded, onToggleReminder }) => {
    const isProject = suggestion.taskType === 'project';
    const title = isProject ? suggestion.projectTitle : suggestion.title;
    
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-semibold capitalize">{suggestion.taskType.replace('-', ' ')}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-semibold">{suggestion.category}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold capitalize">{suggestion.priority}</span>
                    </div>
                </div>
                <button
                    onClick={onAdd}
                    disabled={isAdded}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isAdded ? (
                        <><span>Added</span><span>✔</span></>
                    ) : (
                        <><PlusIcon className="w-4 h-4" /><span>Add</span></>
                    )}
                </button>
            </div>
            {isProject && suggestion.steps && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">Project Steps:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {suggestion.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ul>
                </div>
            )}
            {suggestion.taskType === 'one-time' && suggestion.date && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer w-fit">
                        <input 
                            type="checkbox" 
                            checked={suggestion.earlyReminder || false} 
                            onChange={onToggleReminder}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>Early Reminder (2 days before)</span>
                    </label>
                </div>
            )}
        </div>
    );
};


export const AINotetakerModal: React.FC<AINotetakerModalProps> = ({ onClose, onAddTaskFromAI, currentDate }) => {
  const [note, setNote] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedIndices, setAddedIndices] = useState<number[]>([]);

  const handleAnalyze = async () => {
    if (!note.trim()) return;
    setIsLoading(true);
    setError('');
    setSuggestions([]);
    setAddedIndices([]);
    try {
        const results = await processNoteWithAI(note, currentDate);
        setSuggestions(results);
        if (results.length === 0) {
            setError("No actionable tasks found in your note. Try rephrasing or adding more detail.");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdd = async (suggestion: AISuggestedTask, index: number) => {
    try {
        await onAddTaskFromAI(suggestion);
        setAddedIndices(prev => [...prev, index]);
    } catch (e) {
        console.error("Failed to add task from AI", e);
        alert("There was a problem adding this task.");
    }
  };

  const handleToggleReminder = (index: number) => {
    setSuggestions(currentSuggestions => 
        currentSuggestions.map((suggestion, i) => {
            if (i === index) {
                return { ...suggestion, earlyReminder: !suggestion.earlyReminder };
            }
            return suggestion;
        })
    );
  };

  const handleReset = () => {
    setNote('');
    setSuggestions([]);
    setError('');
    setIsLoading(false);
    setAddedIndices([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
        <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
            <header className="p-4 border-b bg-white rounded-t-lg flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold flex items-center space-x-2 text-gray-800">
                    <SparklesIcon className="w-6 h-6 text-teal-500" />
                    <span>AI Notetaker</span>
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-bold text-2xl leading-none">&times;</button>
            </header>

            <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                {suggestions.length === 0 ? (
                    <div className="h-full flex flex-col">
                        <label htmlFor="ai-note-input" className="text-sm font-medium text-gray-700 mb-2">
                            Jot down your thoughts, ideas, or reminders. The AI will turn them into tasks.
                        </label>
                        <textarea
                            id="ai-note-input"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="e.g., 'need to launch the new marketing campaign next month, first create ad copy, then set up the socials. also remember to restock inventory every tuesday'"
                            className="w-full flex-grow p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700">Here's what I found:</h3>
                        {suggestions.map((s, i) => (
                             <SuggestionCard 
                                key={i} 
                                suggestion={s} 
                                onAdd={() => handleAdd(s, i)}
                                isAdded={addedIndices.includes(i)}
                                onToggleReminder={() => handleToggleReminder(i)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <footer className="p-4 border-t bg-white rounded-b-lg flex justify-between items-center flex-shrink-0">
                {suggestions.length > 0 ? (
                    <>
                        <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Start Over
                        </button>
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700">
                           Done
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isLoading || !note.trim()}
                            className="px-6 py-2 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center min-w-[120px]"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Analyze Note'
                            )}
                        </button>
                    </>
                )}
            </footer>
        </div>
    </div>
  );
};