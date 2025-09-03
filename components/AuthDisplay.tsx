import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, doSignOut } from '../services/firebase';

interface AuthDisplayProps {
    user: User | null;
    isFirebaseInitialized: boolean;
}

export const AuthDisplay: React.FC<AuthDisplayProps> = ({ user, isFirebaseInitialized }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Sign in failed:", error);
            alert("Could not sign in. Please check your Firebase configuration in Settings and ensure popups are enabled.");
        }
    };

    const handleSignOut = async () => {
        await doSignOut();
        setShowMenu(false);
    };
    
    if (!isFirebaseInitialized) {
        return (
            <div className="p-2 text-xs text-yellow-700 bg-yellow-100 rounded-md" title="Configure Firebase in Settings to enable login">
                Sync Disabled
            </div>
        );
    }

    if (user) {
        return (
            <div className="relative">
                <button onClick={() => setShowMenu(s => !s)} className="rounded-full h-8 w-8 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    <img src={user.photoURL || undefined} alt={user.displayName || 'User'} referrerPolicy="no-referrer" />
                </button>
                {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            <p className="font-semibold">Signed in as</p>
                            <p className="truncate">{user.displayName}</p>
                        </div>
                        <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
        >
            Sign In
        </button>
    );
};
