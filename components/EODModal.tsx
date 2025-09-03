

import React, { useState } from 'react';
import { Task, Settings } from '../types';
import { buildEOD, applyToneGuard } from '../services/eod';
import { CopyIcon, EmailIcon, DownloadIcon } from './Icons';

export const EODModal: React.FC<{tasks: Task[], settings: Settings, date: string, onClose: () => void}> = ({tasks, settings, date, onClose}) => {
    const reportRaw = buildEOD(date, tasks, settings);
    const { guardedText: reportBodyWithToneGuard, warning } = applyToneGuard(reportRaw.split('\n\n').slice(2).join('\n\n'));
    const reportSubject = reportRaw.match(/SUBJECT: (.*)/)?.[1] || '';
    const reportHeader = reportRaw.split('\n\n')[1] || '';
    const fullReportForDisplay = `${reportHeader}\n\n${reportBodyWithToneGuard}`;
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(`${reportSubject}\n\n${fullReportForDisplay}`);
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const handleEmail = () => {
        const to = encodeURIComponent(settings.sendTo.join(','));
        const subject = encodeURIComponent(reportSubject);
        const body = encodeURIComponent(fullReportForDisplay);
        
        // Construct a Gmail compose URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

        // Open the URL in a new tab to avoid navigating away from the app
        window.open(gmailUrl, '_blank');
    };

    const handleApproveAndDownload = () => {
        const dataToExport = {
            exportDate: new Date().toISOString(),
            reportDate: date,
            settings: settings,
            tasks: tasks.filter(t => t.date === date),
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leafology-eod-data-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold">End-of-Day Report</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    {warning && <div className="p-2 mb-3 text-sm bg-yellow-100 text-yellow-800 rounded-md">Heads up: language tweak recommended. Some text was redacted.</div>}
                    <textarea readOnly value={fullReportForDisplay} className="w-full h-96 p-2 font-mono text-sm bg-gray-50 border rounded-md focus:outline-none"></textarea>
                </div>
                <div className="p-4 border-t flex justify-end items-center space-x-2">
                    <span className="text-sm text-green-600 mr-auto">{copySuccess}</span>
                    <button id="copy-eod-button" onClick={handleCopy} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 flex items-center space-x-2"><CopyIcon className="w-4 h-4"/><span>Copy (Ctrl+B)</span></button>
                    <button id="email-eod-button" onClick={handleEmail} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2"><EmailIcon className="w-4 h-4"/><span>Email (Ctrl+Enter)</span></button>
                    <button onClick={handleApproveAndDownload} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2"><DownloadIcon className="w-4 h-4"/><span>Approve &amp; Download</span></button>
                </div>
            </div>
        </div>
    )
}