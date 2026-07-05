// Autentifikatsiya / Profil konteksti.
// YANGI: sayt birinchi ochilganda foydalanuvchi ism + telefon (+ ixtiyoriy mashina)
// kiritadi va "Kirish" bosilganда unga darhol lokal profil yaratiladi (login/parol
// talab qilinmaydi). Profil brauzerда (localStorage) saqlanadi va mumkin bo'lsa
// Firestore'ga ham sinxronlanadi (best-effort).
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase.js";

const AuthContext = createContext(null);
const LS_KEY = "apex_profile_v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocal(profile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch {
    /* localStorage to'la yoki bloklangan bo'lishi mumkin — jim o'tamiz */
  }
}

function makeUid() {
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => loadLocal());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lokal profil sinxron o'qiladi — shunchaki loading bayrog'ini o'chiramiz.
    setLoading(false);
  }, []);

  // Ro'yxatdan o'tish (onboarding) — ism, telefon, ixtiyoriy mashina.
  const completeOnboarding = useCallback(({ name, phone, currentCar = "" }) => {
    const uid = makeUid();
    const p = {
      uid,
      name: (name || "").trim(),
      displayName: (name || "").trim(),
      phone: (phone || "").trim(),
      currentCar: currentCar || "",
      photoURL: "",
      bio: "",
      email: "",
      role: "user",
      createdAt: Date.now(),
    };
    saveLocal(p);
    setProfile(p);
    // Firestore mavjud bo'lsa — fon rejimida sinxronlaymiz (xato bo'lsa jim o'tamiz).
    if (db) {
      setDoc(doc(db, "users", uid), { ...p, createdAt: serverTimestamp() }).catch(() => {});
    }
    return p;
  }, []);

  // Profilni yangilash (rasm, ism, telefon, mashina, bio ...).
  const updateProfile = useCallback((patch) => {
    let updated = null;
    setProfile((prev) => {
      if (!prev) return prev;
      updated = { ...prev, ...patch };
      saveLocal(updated);
      return updated;
    });
    if (db && updated?.uid) {
      updateDoc(doc(db, "users", updated.uid), patch).catch(() => {});
    }
    return updated;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setProfile(null);
    return Promise.resolve();
  }, []);

  const refreshProfile = useCallback(() => {
    setProfile(loadLocal());
  }, []);

  // Backward-compat: ko'p joyda `user` va `user.uid` ishlatiladi.
  const user = profile ? { uid: profile.uid, email: profile.email || "" } : null;

  const value = {
    user,
    profile,
    loading,
    needsOnboarding: !loading && !profile,
    completeOnboarding,
    updateProfile,
    logout,
    refreshProfile,
    // Eski AuthModal importlari buzilmasligi uchun (endi ishlatilmaydi):
    register: async () => {},
    login: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
