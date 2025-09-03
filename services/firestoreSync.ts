import {
    getFirestore,
    collection,
    doc,
    getDocs,
    writeBatch,
    onSnapshot,
    serverTimestamp,
    setDoc,
    deleteDoc,
    Timestamp,
    getDoc,
} from 'firebase/firestore';
import { Task, Settings } from '../types';
import { getDbInstance } from './firebase';
import * as localDb from './db';

// Firestore uses its own Timestamp class. This type represents a Task coming from Firestore.
type FirestoreTask = Omit<Task, 'createdAt' | 'updatedAt'> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

// --- Conversion Helpers ---
const taskToFirestore = (task: Task) => {
    // Convert ISO strings to Firestore Timestamps for dates
    return {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
    };
};

const taskFromFirestore = (data: any): Task => {
    // Convert Firestore Timestamps back to ISO strings
    return {
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
    } as Task;
};

// --- Sync Operations ---

export const addTaskToFirestore = async (userId: string, task: Task): Promise<void> => {
    const db = getDbInstance();
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, taskToFirestore(task));
};

export const updateTaskInFirestore = async (userId: string, task: Task): Promise<void> => {
    const db = getDbInstance();
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    // Use serverTimestamp to ensure the latest update is always from the server's perspective
    await setDoc(taskRef, { ...taskToFirestore(task), updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteTaskInFirestore = async (userId: string, taskId: string): Promise<void> => {
    const db = getDbInstance();
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
};

export const updateSettingsInFirestore = async (userId: string, settings: Settings): Promise<void> => {
    const db = getDbInstance();
    const settingsRef = doc(db, 'users', userId, 'data', 'settings');
    await setDoc(settingsRef, settings);
};

export const syncLocalAndRemote = async (userId: string): Promise<void> => {
    console.log("Performing initial two-way sync...");
    const db = getDbInstance();
    const batch = writeBatch(db);

    // 1. Get all local tasks and settings
    const localTasks = await localDb.getAllTasks();
    const localTasksMap = new Map(localTasks.map(t => [t.id, t]));
    const localSettings = await localDb.getSettings();

    // 2. Get all remote tasks and settings
    const remoteTasksCol = collection(db, 'users', userId, 'tasks');
    const remoteTasksSnapshot = await getDocs(remoteTasksCol);
    const remoteTasksMap = new Map<string, Task>();
    remoteTasksSnapshot.forEach(doc => {
        remoteTasksMap.set(doc.id, taskFromFirestore(doc.data()));
    });
    
    const remoteSettingsRef = doc(db, 'users', userId, 'data', 'settings');
    const remoteSettingsDoc = await getDoc(remoteSettingsRef);
    const remoteSettings = remoteSettingsDoc.exists() ? remoteSettingsDoc.data() as Settings : null;

    // 3. Compare and merge tasks
    // Sync local to remote
    for (const localTask of localTasks) {
        const remoteTask = remoteTasksMap.get(localTask.id);
        if (!remoteTask || new Date(localTask.updatedAt) > new Date(remoteTask.updatedAt)) {
            const taskRef = doc(db, 'users', userId, 'tasks', localTask.id);
            batch.set(taskRef, taskToFirestore(localTask));
        }
    }

    // Sync remote to local
    const tasksToUpdateLocally: Task[] = [];
    for (const [id, remoteTask] of remoteTasksMap.entries()) {
        const localTask = localTasksMap.get(id);
        if (!localTask || new Date(remoteTask.updatedAt) > new Date(localTask.updatedAt)) {
            tasksToUpdateLocally.push(remoteTask);
        }
    }

    if (tasksToUpdateLocally.length > 0) {
        await localDb.putTasks(tasksToUpdateLocally);
    }
    
    // 4. Compare and merge settings
    if(remoteSettings) {
       // For settings, let's assume remote is the source of truth if it exists.
       // A more complex strategy could be added later if needed.
       await localDb.updateSettings(remoteSettings);
    } else {
        // No remote settings, so upload local settings
        batch.set(remoteSettingsRef, localSettings);
    }

    // 5. Commit all remote changes
    await batch.commit();
    console.log("Initial sync complete.");
};


export const listenToFirestoreChanges = (
    userId: string,
    callback: (tasks: Task[], settings: Settings) => void
): (() => void) => {
    const db = getDbInstance();
    const tasksCol = collection(db, 'users', userId, 'tasks');
    const settingsRef = doc(db, 'users', userId, 'data', 'settings');
    
    let cachedTasks: Task[] = [];
    let cachedSettings: Settings | null = null;
    let initialTasksLoaded = false;
    let initialSettingsLoaded = false;

    const maybeInvokeCallback = () => {
        // Only invoke once both listeners have fired at least once
        if (initialTasksLoaded && initialSettingsLoaded && cachedSettings) {
            callback(cachedTasks, cachedSettings);
        }
    }

    const unsubscribeTasks = onSnapshot(tasksCol, (snapshot) => {
        cachedTasks = snapshot.docs.map(doc => taskFromFirestore(doc.data()));
        initialTasksLoaded = true;
        maybeInvokeCallback();
    }, (error) => {
        console.error("Firestore tasks listener error:", error);
    });
    
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if(doc.exists()){
            cachedSettings = doc.data() as Settings;
        }
        initialSettingsLoaded = true;
        maybeInvokeCallback();
    }, (error) => {
         console.error("Firestore settings listener error:", error);
    });

    // Return a function that unsubscribes from both listeners
    return () => {
        unsubscribeTasks();
        unsubscribeSettings();
    };
};
