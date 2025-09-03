
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getHelpBotResponse } from '../services/gemini';
import { HelpIcon, SendIcon } from './Icons';

export const HelpBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "Hi! I'm Leafy, your AI assistant. How can I help you with your sign-in issues today?" }] }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(isOpen) {
            scrollToBottom();
        }
    }, [history, isOpen]);

    const handleSend = async () => {
        if (!userInput.trim()) return;

        setIsLoading(true);
        const newHistoryWithUserMessage = [...history, { role: 'user' as const, parts: [{ text: userInput }] }];
        setHistory(newHistoryWithUserMessage);
        setUserInput('');

        try {
            const stream = await getHelpBotResponse(newHistoryWithUserMessage);
            
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
            console.error("Help bot error:", error);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-4 left-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 z-50"
                aria-label="Open help bot"
            >
                <HelpIcon className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="fixed bottom-20 left-4 w-full max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50">
                    <div className="p-4 bg-purple-600 text-white rounded-t-lg flex justify-between items-center">
                        <h3 className="font-bold text-lg">Leafy Help Bot</h3>
                        <button onClick={() => setIsOpen(false)} className="text-purple-200 hover:text-white">&times;</button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.parts.map((part, i) => <p key={i}>{part.text}</p>)}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                                 <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                                    ...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t bg-white">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Ask about sign-in issues..."
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="p-2 text-white bg-purple-600 rounded-full hover:bg-purple-700 disabled:bg-gray-400">
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};