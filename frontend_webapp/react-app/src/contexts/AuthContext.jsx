import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userApiKey, setUserApiKey] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const googleSignIn = async () => { // Make async for try/catch
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // User signed in
      return result;
    } catch (error) {
      console.error("AuthContext: Error during Google Sign-In", error);
      // This error should ideally be caught and handled by the component calling googleSignIn
      // to display a user-facing message. Re-throwing is an option.
      throw error;
    }
  };

  const appSignOut = async () => { // Make async for try/catch
    try {
      await signOut(auth);
      // User signed out
    } catch (error) {
      console.error("AuthContext: Error during Sign Out", error);
      throw error; // Re-throw for component to handle
    }
  };

  const fetchUserApiKey = useCallback(async (uid) => {
    if (!uid) {
      setUserApiKey(null);
      setApiKeyLoading(false);
      return;
    }
    setApiKeyLoading(true);
    const docRef = doc(db, 'userApiKeys', uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserApiKey(docSnap.data().geminiApiKey);
      } else {
        setUserApiKey(null);
      }
    } catch (error) {
      console.error("AuthContext: Error fetching API key:", error);
      setUserApiKey(null); // Ensure state is clear on error
    } finally {
      setApiKeyLoading(false);
    }
  }, []);

  const saveUserApiKey = async (keyToSave) => {
    if (!currentUser) {
      console.error("AuthContext: User not authenticated to save API key.");
      throw new Error("User not authenticated to save API key.");
    }
    setApiKeyLoading(true);
    const docRef = doc(db, 'userApiKeys', currentUser.uid);
    try {
      await setDoc(docRef, { geminiApiKey: keyToSave });
      setUserApiKey(keyToSave);
    } catch (error) {
      console.error("AuthContext: Error saving API key:", error);
      throw error;
    } finally {
      setApiKeyLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserApiKey(user.uid);
      } else {
        setUserApiKey(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [fetchUserApiKey]);

  const value = {
    currentUser,
    userApiKey,
    apiKeyLoading,
    authLoading,
    googleSignIn,
    appSignOut,
    saveUserApiKey,
    fetchUserApiKey
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Children rendered after initial auth check. Loading of API key is separate.
          App.jsx handles combined loading state for UI gating. */}
      {!authLoading && children}
    </AuthContext.Provider>
  );
}
