// Autentifikatsiya konteksti — ro'yxatdan o'tish, kirish, chiqish
// va foydalanuvchi profilini (Firestore) boshqaradi.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore users/{uid}
  const [loading, setLoading] = useState(true);

  // Profilni Firestore'dan yuklash
  const loadProfile = useCallback(async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile({ uid, ...snap.data() });
      else setProfile(null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u.uid);
      else setProfile(null);
      setLoading(false);
    });
    return () => unsub();
  }, [loadProfile]);

  const register = async ({ name, email, password, phone = "" }) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", u.uid), {
      uid: u.uid,
      name,
      displayName: name,
      email,
      phone,
      photoURL: "",
      bio: "",
      currentCar: "",
      role: "user",
      createdAt: serverTimestamp(),
    });
    await loadProfile(u.uid);
    return u;
  };

  const login = async ({ email, password }) => {
    const { user: u } = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(u.uid);
    return u;
  };

  const logout = () => signOut(auth);

  const refreshProfile = () => (user ? loadProfile(user.uid) : null);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, register, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
