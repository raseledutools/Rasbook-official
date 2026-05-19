// src/hooks/useAuth.js — Fixed: logout function added
import { useState, useEffect, createContext, useContext } from 'react';
import { getFirebaseAuth } from '../services/firebase';
import { signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = still initializing
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState(null);

  useEffect(() => {
    let unsub = () => {};

    getFirebaseAuth().then((auth) => {
      setAuthInstance(auth);
      unsub = auth.onAuthStateChanged((u) => {
        setUser(u);
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
