import React, { useState, useRef, useEffect } from 'react';
import { Task, ChatMessage } from '../types';
import { getAIHelperResponse } from '../services/gemini';
import { BrainIcon, SendIcon } from './Icons';

interface AIHelperModalProps {
    task: Task;
    onClose: () => void;
}

export const AIHelperModal: React.FC<AIHelperModalProps> = ({ task, onClose }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [history]);

    // Initial message from AI
    useEffect(() => {
        const fetchInitialStep = async () => {
            setIsLoading(true);
            try {
                const stream = await getAIHelperResponse([], task.title);
                
                setHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: '' }] }]);

                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    setHistory(prev => {
                        const latestHistory = [...prev];
                        const lastMessage = latestHistory[latestHistory.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            const updatedLastMessage = {
                                ...lastMessage,
                                parts: [{ ...lastMessage.parts[0], text: lastMessage.parts[0].text + chunkText }]
                            };
                            latestHistory[latestHistory.length - 1] = updatedLastMessage;
                            return latestHistory;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("AI Helper error:", error);
                setHistory([{ role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] }]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialStep();
    }, [task.title]);

    const handleSend = async () => {
        if (!userInput.trim()) return;

        setIsLoading(true);
        const newHistoryWithUserMessage = [...history, { role: 'user' as const, parts: [{ text: userInput }] }];
        setHistory(newHistoryWithUserMessage);
        setUserInput('');

        try {
            const stream = await getAIHelperResponse(newHistoryWithUserMessage, task.title);
            
            setHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setHistory(prev => {
                    const latestHistory = [...prev];
                    const lastMessage = latestHistory[latestHistory.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        const updatedLastMessage = {
                            ...lastMessage,
                            parts: [{ ...lastMessage.parts[0], text: lastMessage.parts[0].text + chunkText }]
                        };
                        latestHistory[latestHistory.length - 1] = updatedLastMessage;
                        return latestHistory;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("AI Helper error:", error);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 bg-teal-600 text-white rounded-t-lg flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold flex items-center space-x-2">
                            <BrainIcon className="w-6 h-6" />
                            <span>AI Helper</span>
                        </h2>
                        <p className="text-sm text-teal-100 mt-1 truncate" title={task.title}>Task: {task.title}</p>
                    </div>
                    <button onClick={onClose} className="text-teal-200 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <main className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.parts.map((part, i) => <p key={i}>{part.text}</p>)}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                                ...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </main>
                <footer className="p-4 border-t bg-white flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Your question or update..."
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="p-2 text-white bg-teal-600 rounded-full hover:bg-teal-700 disabled:bg-gray-400">
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};