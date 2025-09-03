

import React, { useState, useRef, useEffect } from 'react';
import { Settings, KPIs } from '../types';
import { DownloadIcon, UploadIcon } from './Icons';
import { exportData, importData } from '../services/sync';
import { getFirebaseConfig, saveFirebaseConfig } from '../services/firebase';

interface SettingsModalProps {
    settings: Settings | null;
    onClose: () => void;
    onSave: (s: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    settings,
    onClose,
    onSave,
}) => {
    const [kpis, setKpis] = useState<KPIs>(settings?.kpis || {});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [firebaseConfigStr, setFirebaseConfigStr] = useState('');
    const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
    
    useEffect(() => {
        const config = getFirebaseConfig();
        if (config) {
            setFirebaseConfigStr(JSON.stringify(config, null, 2));
            setIsFirebaseConfigured(true);
        }
    }, []);

    const handleSaveKpis = () => {
        if (!settings) return;
        onSave({ ...settings, kpis });
        onClose();
    };

    const handleKpiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setKpis(prev => ({...prev, [name]: name === 'initiativesProgress' ? value : Number(value) }));
    };

    const handleExport = async () => {
        await exportData();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmed = window.confirm(
            "Are you sure you want to restore from this backup?\n\nWARNING: This will completely overwrite all current tasks and settings on this device. This action cannot be undone."
        );

        if (confirmed) {
            try {
                await importData(file);
                alert("Data restored successfully! The application will now reload.");
                window.location.reload();
            } catch (error) {
                alert(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleSaveFirebaseConfig = () => {
        try {
            const config = JSON.parse(firebaseConfigStr);
            if (config.apiKey && config.projectId && config.authDomain) {
                saveFirebaseConfig(config);
                alert("Firebase configuration saved successfully. The app will now reload to apply the changes.");
                window.location.reload();
            } else {
                alert("Invalid Firebase config. Make sure it includes at least apiKey, projectId, and authDomain.");
            }
        } catch (e) {
            alert("Invalid JSON format. Please paste the entire config object from your Firebase project settings.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold">Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                    {/* KPIs Section */}
                    {settings && (
                        <div>
                            <h3 className="font-semibold text-md">KPIs for EOD Report</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">AOV ($)</label>
                                <input type="number" name="AOV" value={kpis.AOV || ''} onChange={handleKpiChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Google Reviews</label>
                                <input type="number" name="googleReviews" value={kpis.googleReviews || ''} onChange={handleKpiChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">New Proposals</label>
                                <input type="number" name="proposalsNew" value={kpis.proposalsNew || ''} onChange={handleKpiChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Initiatives Progress</label>
                                <textarea name="initiativesProgress" value={kpis.initiativesProgress || ''} onChange={handleKpiChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                    )}
                    
                    {/* Cloud Sync Section */}
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="font-semibold text-md">Cloud Sync (Firebase)</h3>
                         {isFirebaseConfigured ? (
                             <div className="mt-2 p-3 bg-green-100 text-green-800 text-sm rounded-md">
                                Firebase is configured. You can sign in to sync your data.
                             </div>
                         ) : (
                             <p className="text-sm text-gray-600 mt-1 mb-3">
                                To permanently save and sync your tasks across devices, create a free Firebase project and paste the Web App configuration object below.
                            </p>
                         )}
                         
                        <div className="mt-2">
                             <label className="block text-sm font-medium text-gray-700">Firebase Config</label>
                             <textarea
                                value={firebaseConfigStr}
                                onChange={e => setFirebaseConfigStr(e.target.value)}
                                rows={6}
                                placeholder={`{\n  "apiKey": "...",\n  "authDomain": "...",\n  ...\n}`}
                                className="mt-1 block w-full font-mono text-xs p-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                             />
                        </div>
                         <button
                            onClick={handleSaveFirebaseConfig}
                            className="mt-2 w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Save Config & Reload
                        </button>
                    </div>
                    
                    {/* Data Portability Section */}
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="font-semibold text-md">Backup & Restore (Local)</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                            Download a local backup file to move your data to another device, or restore from a previously saved file.
                        </p>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleExport}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Download Backup</span>
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                <UploadIcon className="w-4 h-4" />
                                <span>Upload & Restore</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".txt,application/json"
                                onChange={handleFileSelected}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-between items-center">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveKpis} className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700">Save KPIs</button>
                </div>
            </div>
        </div>
    )
}