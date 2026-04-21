import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut as firebaseSignOut } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Patient',
          photoURL: firebaseUser.photoURL
        });
        // Keep localStorage in sync for backward compatibility
        localStorage.setItem('patientName', firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Patient');
        localStorage.setItem('patientEmail', firebaseUser.email);
        localStorage.setItem('patientUID', firebaseUser.uid);
      } else {
        setUser(null);
        localStorage.removeItem('patientName');
        localStorage.removeItem('patientEmail');
        localStorage.removeItem('patientUID');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
