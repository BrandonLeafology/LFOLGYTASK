import React, { useState, useRef, useEffect } from 'react';
import { ProjectIcon, UploadIcon, SendIcon } from './Icons';
import { ChatMessage } from '../types';
import { startProjectChat, createProjectFromChat } from '../services/gemini';

export const NewProjectModal: React.FC<{onClose: () => void, onCreateProject: (projectData: { projectTitle: string, tasks: string[] }) => void}> = ({ onClose, onCreateProject }) => {
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "Hello! I'm your project planning assistant. Describe your new project, and I'll help you break it down. You can also upload relevant files." }] }
    ]);
    const [userInput, setUserInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
    const [keyFacts, setKeyFacts] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(scrollToBottom, [history]);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(filePreviews).forEach(URL.revokeObjectURL);
        };
    }, [filePreviews]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prevFiles => [...prevFiles, ...newFiles]);
            
            const newPreviews: Record<string, string> = {};
            newFiles.forEach(file => {
                newPreviews[file.name] = URL.createObjectURL(file);
            });
            setFilePreviews(prev => ({...prev, ...newPreviews}));
        }
    };
    
    const handleRemoveFile = (fileToRemove: File) => {
        setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
        setFilePreviews(prev => {
            const newPreviews = {...prev};
            URL.revokeObjectURL(newPreviews[fileToRemove.name]); // Clean up memory
            delete newPreviews[fileToRemove.name];
            return newPreviews;
        });
    };

    const handleSend = async () => {
        if (!userInput.trim() && files.length === 0) return;
        
        setIsLoading(true);
        setError('');

        const currentInput = userInput;
        const currentFiles = files;
        
        const userMessageParts = [{text: currentInput}];
        if (currentFiles.length > 0) {
            userMessageParts.push({text: `\n[Attached: ${currentFiles.map(f => f.name).join(', ')}]`});
        }
        
        const newHistoryWithUserMessage = [...history, { role: 'user' as const, parts: userMessageParts }];
        setHistory(newHistoryWithUserMessage);
        
        setUserInput('');
        setFiles([]);
        setFilePreviews(prev => {
            Object.values(prev).forEach(URL.revokeObjectURL);
            return {};
        });

        try {
            const baseInstruction = "You are a helpful project planning assistant. Your goal is to help the user analyze their documents and ideas to create a concrete project plan. Be collaborative and ask clarifying questions.";
            const systemInstruction = keyFacts.trim()
                ? `${baseInstruction}\n\nHere are some highly important facts and directions to remember: ${keyFacts.trim()}`
                : baseInstruction;
                
            const stream = await startProjectChat(history, currentInput, currentFiles, systemInstruction);
            
            setHistory(prev => [...prev, {role: 'model' as const, parts: [{text: ''}]}]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setHistory(prev => {
                    const latestHistory = [...prev];
                    const lastMessage = latestHistory[latestHistory.length - 1];
                    const updatedLastMessage = {
                        ...lastMessage,
                        parts: [{ ...lastMessage.parts[0], text: lastMessage.parts[0].text + chunkText }]
                    };
                    latestHistory[latestHistory.length - 1] = updatedLastMessage;
                    return latestHistory;
                });
            }

        } catch (err) {
            const errorMessage = '\n\n[Error: Connection interrupted. Please try again.]';
            setError('An error occurred during the chat. Please try again.');
            console.error(err);
            setHistory(prev => {
                const latestHistory = [...prev];
                const lastMessage = latestHistory[latestHistory.length - 1];
                 if (lastMessage && lastMessage.role === 'model') {
                    const updatedLastMessage = {
                        ...lastMessage,
                        parts: [{ ...lastMessage.parts[0], text: lastMessage.parts[0].text + errorMessage }]
                    };
                    latestHistory[latestHistory.length - 1] = updatedLastMessage;
                    return latestHistory;
                }
                return [...prev, {role: 'model' as const, parts: [{text: 'Sorry, I encountered an error.'}]}];
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateProject = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Create a temporary history that includes the final un-sent user input and files
            const finalUserMessageParts: {text: string}[] = [];
            if (userInput.trim()) {
                finalUserMessageParts.push({ text: userInput.trim() });
            }
            if (files.length > 0) {
                 finalUserMessageParts.push({ text: `\n[Analyzing final attached files: ${files.map(f => f.name).join(', ')}]` });
            }

            let historyForCreation = [...history];
            if (finalUserMessageParts.length > 0) {
                historyForCreation.push({ role: 'user' as const, parts: finalUserMessageParts });
            }

            const projectData = await createProjectFromChat(historyForCreation);

            if (projectData.projectTitle && projectData.tasks.length > 0 && !projectData.projectTitle.startsWith("Error:")) {
                onCreateProject(projectData);
                onClose();
            } else {
                setError("Could not determine a project plan. Please continue the conversation to define a clearer goal.");
            }
        } catch (err) {
            setError("Failed to create project from conversation.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center space-x-2"><ProjectIcon className="w-6 h-6 text-indigo-500" /><span>AI Project Planner</span></h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                    <div className="p-4 bg-indigo-100 text-indigo-800 rounded-lg text-sm space-y-3">
                        <p>Start by describing your project idea below. You can also upload supporting files. When you're ready, click "Create Project".</p>
                        <div>
                             <label htmlFor="key-facts" className="block text-sm font-medium text-left text-indigo-900 mb-1">Important Facts / Directions for AI</label>
                             <textarea
                                id="key-facts"
                                value={keyFacts}
                                onChange={(e) => setKeyFacts(e.target.value)}
                                placeholder="e.g., The target budget is $5000, the deadline is Q4, focus on user retention."
                                rows={2}
                                className="w-full text-sm p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                        </div>
                    </div>

                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.parts.map((part, i) => <p key={i} className="whitespace-pre-wrap">{part.text}</p>)}
                            </div>
                        </div>
                    ))}
                    {isLoading && history[history.length-1]?.role === 'user' && (
                        <div className="flex justify-start">
                             <div className="max-w-lg px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                
                 {error && <p className="p-2 text-sm text-red-500 text-center">{error}</p>}

                <div className="p-4 border-t bg-white">
                    {files.length > 0 && (
                        <div className="mb-2 p-2 border rounded-md bg-gray-50">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                                {files.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="relative group">
                                         <img src={filePreviews[file.name]} alt={file.name} className="h-16 w-16 object-cover rounded-md" />
                                         <button 
                                            onClick={() => handleRemoveFile(file)} 
                                            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="project-file-upload" className="p-2 text-gray-500 hover:text-indigo-600 cursor-pointer rounded-full hover:bg-gray-100">
                            <UploadIcon className="w-6 h-6" />
                            <input id="project-file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={handleFileChange} />
                        </label>
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Type your message or describe your project..."
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                disabled={isLoading}
                            />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">PNG, JPG</span>
                        </div>
                        <button onClick={handleSend} disabled={isLoading || (!userInput.trim() && files.length === 0)} className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:bg-gray-400">
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end items-center space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleCreateProject} disabled={isLoading || history.length < 2} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        {isLoading ? 'Working...' : 'Create Project'}
                    </button>
                </div>
            </div>
        </div>
    );
};