// Firebase ulanishi (Avto-Tuning asosiy sayt)
// Vite muhit o'zgaruvchilari (import.meta.env.VITE_*) orqali sozlanadi.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

let app = null;
let auth = null;
let db = null;
let rtdb = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.error("Firebase init xatosi:", e?.message);
}

// getAuth noto'g'ri/yo'q apiKey bilan xato tashlaydi — uni ushlaymiz,
// shunda butun sayt oq bo'lib qolmaydi.
try {
  if (app) auth = getAuth(app);
} catch (e) {
  console.error(
    "⚠️ Firebase Auth ishga tushmadi. .env.local dagi VITE_FIREBASE_API_KEY ni tekshiring:",
    e?.message,
  );
}
try {
  if (app) db = getFirestore(app);
} catch (e) {
  console.error("Firestore init xatosi:", e?.message);
}
try {
  if (app) rtdb = getDatabase(app);
} catch (e) {
  console.error("Realtime DB init xatosi:", e?.message);
}

// Auth sozlanganmi (kalit to'g'rimi) — UI shu orqali ogohlantirishi mumkin.
export const isFirebaseReady = !!auth;
export { auth, db, rtdb };
export default app;
