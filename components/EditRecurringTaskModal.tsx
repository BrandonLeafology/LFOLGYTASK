import React from 'react';

interface EditRecurringTaskModalProps {
    onClose: () => void;
    onConfirm: (scope: 'single' | 'future') => void;
}

export const EditRecurringTaskModal: React.FC<EditRecurringTaskModalProps> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-recurring-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h2 id="edit-recurring-title" className="text-xl font-bold text-gray-800">Edit Recurring Task</h2>
                    <p className="mt-2 text-gray-600">You're editing a recurring task. How would you like to apply this change?</p>
                </div>
                <div className="p-6 bg-gray-50 space-y-3">
                    <button 
                        onClick={() => onConfirm('future')} 
                        className="w-full text-left p-4 bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                        <p className="font-semibold text-gray-900">Apply to this and all future tasks</p>
                        <p className="text-sm text-gray-500 mt-1">This will update the underlying template for all future occurrences.</p>
                    </button>
                    <button 
                        onClick={() => onConfirm('single')}
                        className="w-full text-left p-4 bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                        <p className="font-semibold text-gray-900">Apply to this task only</p>
                        <p className="text-sm text-gray-500 mt-1">Only this specific instance will be changed. Future tasks will be unaffected.</p>
                    </button>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        </div>
    );
};
