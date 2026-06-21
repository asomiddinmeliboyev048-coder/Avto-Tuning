// Fikr va baho — foydalanuvchi saytni baholaydi (yulduz + fikr).
// Yuborilgan fikr admin tasdig'idan o'tgach "Foydalanuvchilar fikri"da ko'rinadi.
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { Star, Quote, Check } from "lucide-react";
import { db } from "../lib/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Reviews.css";

function Stars({ value, onChange, size = 18 }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`stars__btn ${n <= value ? "is-on" : ""}`}
          onClick={onChange ? () => onChange(n) : undefined}
          disabled={!onChange}
          style={{ cursor: onChange ? "pointer" : "default" }}
        >
          <Star size={size} fill={n <= value ? "#ffcf3d" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reviews"), where("status", "==", "approved")));
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) { setErr("Fikr qoldirish uchun avval tizimga kiring."); return; }
    if (!text.trim()) { setErr("Fikringizni yozing."); return; }
    setLoading(true); setErr("");
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        name: profile?.name || profile?.displayName || "Foydalanuvchi",
        photo: profile?.photoURL || "",
        rating,
        text: text.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setDone(true); setText("");
    } catch (e) {
      setErr(e.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" className="section reviews">
      <div className="container">
        <div className="reviews__head">
          <span className="eyebrow"><Quote size={14} /> Foydalanuvchilar fikri</span>
          <h2 className="section-title">Mijozlarimiz <span className="gradient-text">nima deydi</span></h2>
        </div>

        <div className="reviews__layout">
          {/* Fikr qoldirish formasi */}
          <div className="reviews__form glass">
            {done ? (
              <div className="reviews__done">
                <div className="reviews__done-ic"><Check size={30} /></div>
                <h3>Rahmat!</h3>
                <p>Fikringiz admin tasdig'idan o'tgach shu yerda ko'rinadi.</p>
                <button className="btn btn-primary" onClick={() => setDone(false)}>Yana fikr</button>
              </div>
            ) : (
              <>
                <h3>Baho bering</h3>
                <Stars value={rating} onChange={setRating} size={26} />
                <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Avto-Tuning haqida fikringiz..." />
                {err && <p className="reviews__err">{err}</p>}
                <button className="btn btn-primary" onClick={submit} disabled={loading}>
                  {loading ? "Yuborilmoqda..." : "Fikr yuborish"}
                </button>
              </>
            )}
          </div>

          {/* Tasdiqlangan fikrlar */}
          <div className="reviews__list">
            {reviews.length === 0 ? (
              <p className="reviews__empty">Hozircha tasdiqlangan fikr yo'q. Birinchi bo'ling!</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rcard glass">
                  <div className="rcard__top">
                    <div className="rcard__av" style={r.photo ? { backgroundImage: `url(${r.photo})` } : undefined}>
                      {!r.photo && (r.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="rcard__name">{r.name}</p>
                      <Stars value={r.rating} size={13} />
                    </div>
                  </div>
                  <p className="rcard__text">“{r.text}”</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
