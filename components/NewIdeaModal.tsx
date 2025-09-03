import React, { useState } from 'react';
import { LightbulbIcon, UploadIcon } from './Icons';
import { generateProposal } from '../services/gemini';

const questions = [
  { id: 'problem', label: 'What is the core problem you are solving?', placeholder: 'e.g., Local businesses struggle with online visibility.' },
  { id: 'audience', label: 'Who is your target audience?', placeholder: 'e.g., Small retail shops and restaurants in the NYC area.' },
  { id: 'solution', label: 'What is your unique solution?', placeholder: 'e.g., A hyper-local marketing platform that combines social media management and SEO.' },
  { id: 'revenue', label: 'What is your revenue model?', placeholder: 'e.g., A tiered monthly subscription model.' },
  { id: 'milestones', label: 'What are the key milestones for the next 3 months?', placeholder: 'e.g., Onboard 10 pilot customers, launch v1 of the platform, secure initial funding.' },
];

export const NewIdeaModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [proposal, setProposal] = useState('');
    const [error, setError] = useState('');

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };
    
    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setProposal('');
        try {
            const result = await generateProposal(answers, files);
            setProposal(result);
        } catch (err) {
            setError('Failed to generate proposal. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center space-x-2"><LightbulbIcon className="w-6 h-6 text-teal-500" /><span>AI Proposal Creator</span></h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    {proposal ? (
                        <div>
                             <h3 className="text-xl font-semibold mb-2">Generated Proposal</h3>
                             <textarea readOnly value={proposal} className="w-full h-96 p-2 font-mono text-sm bg-gray-50 border rounded-md focus:outline-none"></textarea>
                        </div>
                    ) : (
                    <>
                        <p className="text-sm text-gray-600">Answer any questions and upload relevant images to help the AI craft a business proposal. The more detail you provide, the better the result.</p>
                        {questions.map((q, index) => (
                            <div key={q.id}>
                                <label htmlFor={q.id} className="block text-sm font-medium text-gray-700">{q.label}</label>
                                <textarea
                                    id={q.id}
                                    value={answers[index]}
                                    onChange={e => handleAnswerChange(index, e.target.value)}
                                    placeholder={q.placeholder}
                                    rows={2}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload Supporting Files</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>Upload files</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB. PDF not supported.</p>
                                </div>
                            </div>
                             {files.length > 0 && <div className="mt-2 text-sm text-gray-500">{files.length} file(s) selected.</div>}
                        </div>
                    </>
                    )}
                </div>
                <div className="p-4 border-t flex justify-end items-center space-x-2">
                     {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    {proposal ? (
                         <button onClick={() => setProposal('')} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Start Over</button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-400">
                            {isLoading ? 'Generating...' : 'Generate Proposal'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
