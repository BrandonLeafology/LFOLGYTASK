// A simple promise-based wrapper for IndexedDB, inspired by idb-keyval.
// This avoids adding a new dependency.

export interface IDBPDatabase<DBTypes extends unknown> extends IDBDatabase {
    get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined>;
    getAll<T>(storeName: string): Promise<T[]>;
    put(storeName: string, value: any, key?: IDBValidKey): Promise<void>;
    delete(storeName: string, key: IDBValidKey): Promise<void>;
    transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBPTransaction<DBTypes>;
}

export interface IDBPTransaction<DBTypes extends unknown> extends IDBTransaction {
    store: IDBObjectStore;
    done: Promise<void>;
}

interface UpgradeCallback {
    (db: IDBPDatabase<any>): void;
}

interface OpenDBOptions {
    upgrade?: UpgradeCallback;
}

export function openDB(
    name: string,
    version: number,
    options: OpenDBOptions = {}
): Promise<IDBPDatabase<any>> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);

        request.onupgradeneeded = (event) => {
            const db = request.result as IDBPDatabase<any>;
            if (options.upgrade) {
                options.upgrade(db);
            }
        };

        request.onsuccess = () => {
            const db = request.result as IDBPDatabase<any>;
            
            // Store a reference to the native transaction method before we override it.
            // Using .call(db, ...) ensures the 'this' context is correct.
            const nativeTransaction = db.transaction;

            // Add helper methods to the db object
            db.get = (storeName, key) => {
                return new Promise((res, rej) => {
                    const tx = nativeTransaction.call(db, storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.get(key);
                    tx.oncomplete = () => res(req.result);
                    tx.onerror = () => rej(tx.error);
                });
            };

            db.getAll = (storeName) => {
                 return new Promise((res, rej) => {
                    const tx = nativeTransaction.call(db, storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const req = store.getAll();
                    tx.oncomplete = () => res(req.result);
                    tx.onerror = () => rej(tx.error);
                });
            };

            db.put = (storeName, value, key) => {
                 return new Promise((res, rej) => {
                    const tx = nativeTransaction.call(db, storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    store.put(value, key);
                    tx.oncomplete = () => res();
                    tx.onerror = () => rej(tx.error);
                });
            };
            
            db.delete = (storeName, key) => {
                 return new Promise((res, rej) => {
                    const tx = nativeTransaction.call(db, storeName, 'readwrite');
                    const store = tx.objectStore(storeName);
                    store.delete(key);
                    tx.oncomplete = () => res();
                    tx.onerror = () => rej(tx.error);
                });
            };

            // Now, override db.transaction to provide the enhanced version with the .done promise
            db.transaction = (storeNames, mode = 'readonly') => {
                const tx = nativeTransaction.call(db, storeNames, mode) as IDBPTransaction<any>;
                tx.done = new Promise((res, rej) => {
                    tx.oncomplete = () => res();
                    tx.onerror = () => rej(tx.error);
                });
                if(typeof storeNames === 'string') {
                    tx.store = tx.objectStore(storeNames);
                }
                return tx;
            };

            resolve(db);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}