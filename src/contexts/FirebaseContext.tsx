import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  savedSubdomain: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  saveUserSubdomain: (subdomain: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

const ADMIN_EMAIL = 'suldee.TA@gmail.com';
const SAFE_UID_REGEX = /^[a-zA-Z0-9_-]+$/;

function clampString(val: string, min: number, max: number, fallback: string): string {
  const trimmed = val.trim();
  if (trimmed.length < min) return fallback;
  return trimmed.slice(0, max);
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);

  const syncUserProfile = useCallback(async (currentUser: User) => {
    if (!currentUser.emailVerified || !SAFE_UID_REGEX.test(currentUser.uid)) {
      return;
    }
    const profilePath = `users/${currentUser.uid}`;
    const profileRef = doc(db, 'users', currentUser.uid);

    try {
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.netlifySubdomain === 'string' && data.netlifySubdomain.trim()) {
          setSavedSubdomain(data.netlifySubdomain);
        }
      } else {
        const displayName = clampString(
          currentUser.displayName || 'Хэрэглэгч',
          1,
          80,
          'Хэрэглэгч'
        );
        const initialSubdomain = clampString(
          localStorage.getItem('user_netlify_subdomain') || '[НЕТЛИФАЙ]',
          1,
          100,
          '[НЕТЛИФАЙ]'
        );
        await setDoc(profileRef, {
          uid: currentUser.uid,
          displayName,
          netlifySubdomain: initialSubdomain,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSavedSubdomain(initialSubdomain);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        syncUserProfile(currentUser).catch((err) => {
          console.error('Профайл синк хийхэд алдаа гарлаа:', err);
        });
      } else {
        setSavedSubdomain(null);
      }
    });
    return () => unsubscribe();
  }, [syncUserProfile]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Google-ээр нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
      }
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      await signOut(auth);
      setSavedSubdomain(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const saveUserSubdomain = useCallback(
    async (subdomain: string) => {
      if (!user || !user.emailVerified || !SAFE_UID_REGEX.test(user.uid)) return;
      const cleaned = clampString(subdomain, 1, 100, '[НЕТЛИФАЙ]');
      const displayName = clampString(user.displayName || 'Хэрэглэгч', 1, 80, 'Хэрэглэгч');
      const profilePath = `users/${user.uid}`;
      const profileRef = doc(db, 'users', user.uid);

      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          await updateDoc(profileRef, {
            displayName,
            netlifySubdomain: cleaned,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(profileRef, {
            uid: user.uid,
            displayName,
            netlifySubdomain: cleaned,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        setSavedSubdomain(cleaned);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, profilePath);
      }
    },
    [user]
  );

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      user.email &&
      user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        authLoading,
        authError,
        isAdmin,
        savedSubdomain,
        signInWithGoogle,
        signOutUser,
        saveUserSubdomain,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase нь FirebaseProvider дотор ашиглагдах ёстой');
  }
  return ctx;
}
