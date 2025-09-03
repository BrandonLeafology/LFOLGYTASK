import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getVibeAIChatResponse } from '../services/gemini';
import { UsersIcon, SendIcon, ChevronDownIcon } from './Icons';

const teamMembers = ['Christopher "Chris" Weldon', 'Shirley Xu-Weldon', 'Raphael Bassalobre', 'Jonathan Seti', 'Brandon (The Executive)'];

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          callback();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, callback]);
  };

export const VibeAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOutsideClick(dropdownRef, () => setShowDropdown(false));

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if(isOpen) {
            scrollToBottom();
        }
    }, [history, isOpen]);

    const handleTeamMemberToggle = (name: string) => {
        setSelectedTeamMembers(prev => 
            prev.includes(name) 
            ? prev.filter(member => member !== name)
            : [...prev, name]
        );
    };

    const handleSend = async () => {
        if (!userInput.trim()) return;

        if (selectedTeamMembers.length === 0) {
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Please select a team member from the dropdown to begin your conversation. You can select multiple people to simulate a meeting." }] }]);
            return;
        }

        setIsLoading(true);
        const newHistoryWithUserMessage = [...history, { role: 'user' as const, parts: [{ text: userInput }] }];
        setHistory(newHistoryWithUserMessage);
        setUserInput('');

        try {
            const stream = await getVibeAIChatResponse(newHistoryWithUserMessage, selectedTeamMembers);
            
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
            console.error("Vibe AI error:", error);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getSelectedNames = () => {
        if (selectedTeamMembers.length === 0) return "Select Team Member";
        if (selectedTeamMembers.length > 2) return `${selectedTeamMembers.length} People`;
        return selectedTeamMembers.map(name => name.split(' ')[0]).join(', ');
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-4 left-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 z-50"
                aria-label="Open Vibe AI Chat"
            >
                <UsersIcon className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="fixed bottom-20 left-4 w-full max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50">
                    <div className="p-4 bg-purple-600 text-white rounded-t-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">Vibe AI Chat</h3>
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setShowDropdown(s => !s)} className="flex items-center space-x-1 text-sm text-purple-200 hover:text-white">
                                    <span>{getSelectedNames()}</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showDropdown && (
                                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                                        {teamMembers.map(name => (
                                            <label key={name} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTeamMembers.includes(name)}
                                                    onChange={() => handleTeamMemberToggle(name)}
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="ml-3">{name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-purple-200 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                        {history.length === 0 && (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-gray-500 text-center">
                                    {selectedTeamMembers.length > 0
                                        ? `Start a conversation with ${getSelectedNames()}.`
                                        : "Select a team member above to begin."}
                                </p>
                            </div>
                        )}
                        {history.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.parts.map((part, i) => {
                                        const segments = part.text.split(/(\*\*.*?\*\*)/g);
                                        return (
                                            <p key={i}>
                                                {segments.map((segment, j) => {
                                                    if (segment.startsWith('**') && segment.endsWith('**')) {
                                                        return <strong key={j}>{segment.slice(2, -2)}</strong>;
                                                    }
                                                    return <span key={j}>{segment}</span>;
                                                })}
                                            </p>
                                        );
                                    })}
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
                                placeholder="Type your message..."
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