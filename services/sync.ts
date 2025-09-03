import { getAllTasks, getSettings, clearAndRestoreDatabase } from './db';
import pako from 'pako';
import { Task, Settings } from '../types';

// Helper to get today's date and time for filename
const getDateTimeForFilename = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Exports all user data to a compressed, base64 encoded file.
 */
export const exportData = async (filenamePrefix = 'leafology-backup') => {
    try {
        const tasks = await getAllTasks();
        const settings = await getSettings();
        
        const data = {
            tasks,
            settings,
            exportFormat: 'leafology-v1', // For future compatibility
            timestamp: new Date().toISOString(),
        };

        const jsonString = JSON.stringify(data);
        
        // Compress the data
        const compressed = pako.gzip(jsonString);
        
        // Encode to Base64 to make it a string that can be easily saved
        const base64String = btoa(String.fromCharCode.apply(null, Array.from(compressed)));

        // Create a blob and trigger download
        const blob = new Blob([base64String], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}-${getDateTimeForFilename()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error exporting data:", error);
        alert("Could not export data. See console for details.");
    }
};

/**
 * Imports data from a file, overwriting existing data.
 */
export const importData = async (file: File): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                if (typeof event.target?.result !== 'string') {
                    throw new Error("File content is not a string.");
                }

                const base64String = event.target.result;

                // Decode from Base64
                const compressed = new Uint8Array(atob(base64String).split('').map(char => char.charCodeAt(0)));
                
                // Decompress the data
                const jsonString = pako.ungzip(compressed, { to: 'string' });

                const data: { exportFormat: string; tasks: Task[]; settings: Settings } = JSON.parse(jsonString);

                // Validate the imported data
                if (data.exportFormat !== 'leafology-v1' || !Array.isArray(data.tasks) || !data.settings) {
                    throw new Error("Invalid or corrupted backup file.");
                }

                await clearAndRestoreDatabase(data.tasks, data.settings);
                resolve();

            } catch (error) {
                console.error("Error importing data:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error("File reading error:", error);
            reject(new Error("Could not read the selected file."));
        };

        reader.readAsText(file);
    });
};
