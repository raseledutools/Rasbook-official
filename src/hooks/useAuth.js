// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { getFirebaseAuth } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = still initializing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    getFirebaseAuth().then((auth) => {
      unsub = auth.onAuthStateChanged((u) => {
        setUser(u);
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
